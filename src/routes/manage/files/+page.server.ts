import { fail, redirect } from '@sveltejs/kit';
import { db } from '#lib/server/db';
import { files, type FileType } from '#lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import type { Actions, PageServerLoad } from './$types';
import { hasPermission } from '#lib/server/auth';
const FILE_TYPES: FileType[] = ['images', 'backgrounds', 'pdfs', 'goofyImages'];

const STATIC_DIR = path.join(process.cwd(), 'static');

function sanitizeFilename(filename: string): string {
	const extension = path.extname(filename);
	const basename = path.basename(filename, extension);

	const safeBase = basename
		.replace(/[^a-zA-Z0-9._-]/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');

	const safeExtension = extension.replace(/[^a-zA-Z0-9.]/g, '').toLowerCase();

	return `${safeBase || 'file'}${safeExtension}`;
}

function isFileType(value: unknown): value is FileType {
	return typeof value === 'string' && FILE_TYPES.includes(value as FileType);
}

function staticPathFromUrl(url: string): string {
	if (!url.startsWith('/')) {
		throw new Error('Invalid file URL');
	}

	const relativePath = url.slice(1);
	const resolved = path.resolve(STATIC_DIR, relativePath);

	if (resolved !== STATIC_DIR && !resolved.startsWith(`${STATIC_DIR}${path.sep}`)) {
		throw new Error('Invalid file path');
	}

	return resolved;
}

function createFileUrl(type: FileType, filename: string): string {
	if (type === 'goofyImages') {
		return `/goofyImages/${filename}`;
	} else if (type === 'backgrounds') {
		return `/bgs/${filename}`;
	} else if (type === 'images') {
		return `/images/${filename}`;
	} else if (type === 'pdfs') {
		return `/pdfs/${filename}`;
	}
	return `/${type}/${filename}`;
}

function getUploadedFile(formData: FormData): File | null {
	const value = formData.get('file');

	if (!(value instanceof File) || value.size === 0) {
		return null;
	}

	return value;
}

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const userId = locals.user?.id;
		if (!userId || !(await hasPermission({ files: ['upload'] }, userId))) {
			return redirect(302, '/');
		}
		const formData = await request.formData();

		const file = getUploadedFile(formData);
		const type = formData.get('type');
		const name = formData.get('name')?.toString();

		if (!file) {
			return fail(400, {
				error: 'No file was provided'
			});
		}

		if (!isFileType(type)) {
			return fail(400, {
				error: 'Invalid file type'
			});
		}

		const id = randomUUID();
		const filename = sanitizeFilename(file.name);
		const fileExt = path.extname(filename);
		const url = createFileUrl(type, name ? name + fileExt : filename);
		const filePath = staticPathFromUrl(url);

		try {
			// Make sure the directory exists.
			await mkdir(path.dirname(filePath), {
				recursive: true
			});

			// Write the uploaded file to static/.
			await writeFile(filePath, Buffer.from(await file.arrayBuffer()));
			console.log('File written to static/', filePath);
			try {
				// Create the database entry.
				const [created] = await db
					.insert(files)
					.values({
						id,
						name: name ?? file.name,
						url,
						type
					})
					.returning();

				return {
					success: true,
					file: created
				};
			} catch (error) {
				// If the DB insert fails, don't leave an orphaned file.
				await unlink(filePath).catch(() => {});
				throw error;
			}
		} catch (error) {
			console.error('Failed to create file:', error);

			return fail(500, {
				error: 'Failed to create file'
			});
		}
	},

	delete: async ({ request, locals }) => {
		const userId = locals.user?.id;
		if (!userId || !(await hasPermission({ files: ['delete'] }, userId))) {
			return redirect(302, '/');
		}
		const formData = await request.formData();
		const id = formData.get('id');
		if (typeof id !== 'string' || !id) {
			return fail(400, {
				error: 'Missing file ID'
			});
		}

		const file = await db.select().from(files).where(eq(files.id, id)).limit(1);

		const existing = file[0];

		if (!existing) {
			return fail(404, {
				error: 'File not found'
			});
		}

		try {
			const filePath = staticPathFromUrl(existing.url);

			// Remove the database entry first.
			await db.delete(files).where(eq(files.id, id));

			// The file may already be missing, which is okay.
			await unlink(filePath).catch((error) => {
				if (error.code !== 'ENOENT') {
					console.error(`Failed to delete file from disk: ${filePath}`, error);
				}
			});

			return {
				success: true
			};
		} catch (error) {
			console.error('Failed to delete file:', error);

			return fail(500, {
				error: 'Failed to delete file'
			});
		}
	},

	swap: async ({ request, locals }) => {
		const userId = locals.user?.id;
		if (!userId || !(await hasPermission({ files: ['upload'] }, userId))) {
			return redirect(302, '/');
		}
		const formData = await request.formData();

		const id = formData.get('id');
		const file = getUploadedFile(formData);

		if (typeof id !== 'string' || !id) {
			return fail(400, {
				error: 'Missing file ID'
			});
		}

		if (!file) {
			return fail(400, {
				error: 'No replacement file was provided'
			});
		}

		const result = await db.select().from(files).where(eq(files.id, id)).limit(1);

		const existing = result[0];

		if (!existing) {
			return fail(404, {
				error: 'File not found'
			});
		}

		try {
			const filePath = staticPathFromUrl(existing.url);

			/*
			 * Write to a temporary file first.
			 *
			 * This means that if the upload fails halfway through,
			 * the old file remains intact.
			 */
			const tempPath = `${filePath}.${randomUUID()}.tmp`;

			await writeFile(tempPath, Buffer.from(await file.arrayBuffer()));

			try {
				// Atomically replace the old file.
				await rename(tempPath, filePath);
			} catch (error) {
				await unlink(tempPath).catch(() => {});
				throw error;
			}

			return {
				success: true
			};
		} catch (error) {
			console.error('Failed to swap file:', error);

			return fail(500, {
				error: 'Failed to replace file'
			});
		}
	}
};

export const load: PageServerLoad = async (event) => {
	const userId = event.locals.user?.id;
	if (!userId || !(await hasPermission({ files: ['upload'] }, userId))) {
		return redirect(302, '/');
	}
	return {};
};
