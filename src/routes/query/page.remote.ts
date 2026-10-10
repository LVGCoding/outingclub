import type { PageContent } from '#lib/components/page/Page.svelte';
import { hasPermission } from '#lib/server/auth';
import { db } from '#lib/server/db/';
import { pages, pageCategoryValid } from '#lib/server/db/schema';
import { command, query } from '$app/server';
import { and, eq, asc, desc, sql, inArray } from 'drizzle-orm';
import * as v from 'valibot';

export const getPage = query(
	v.object({
		path: v.string(),
		pageCategory: pageCategoryValid
	}),
	async ({ path, pageCategory }) => {
		const pathFound = await db.query.pages.findFirst({
			columns: {
				content: true,
				id: true,
				link: true,
				pageCategory: true,
				path: true,
				title: true
			},
			where: and(eq(pages.path, path), eq(pages.pageCategory, pageCategory))
		});
		return { ...pathFound, content: pathFound?.content as (PageContent & { type: 'row' })[] };
	}
);

export const getPageById = query(
	v.object({
		id: v.string()
	}),
	async ({ id }) => {
		const pathFound = await db.query.pages.findFirst({
			columns: {
				content: true,
				id: true,
				link: true,
				pageCategory: true,
				path: true,
				title: true
			},
			where: eq(pages.id, id)
		});
		return { ...pathFound, content: pathFound?.content as (PageContent & { type: 'row' })[] };
	}
);

export const duplicatePage = command(
	v.object({
		id: v.string()
	}),
	async ({ id }) => {
		const page = await getPageById({ id });
		if (!page) return;
		const lastOrder = await db.query.pages.findFirst({
			columns: { order: true },
			orderBy: desc(pages.order),
			where: eq(pages.pageCategory, page.pageCategory ?? 'activity')
		});

		const new_page = await db
			.insert(pages)
			.values({
				title: page.title ?? '',
				path: page.path + '-copy',
				link: false,
				pageCategory: page.pageCategory ?? 'activity',
				content: page.content,
				order: lastOrder?.order ?? 0
			})
			.returning();
		return new_page;
	}
);

export const getPaths = query(async () => {
	const paths = await db.query.pages.findMany({
		columns: {
			path: true,
			pageCategory: true,
			title: true,
			id: true,
			link: true,
			order: true
		},
		orderBy: asc(pages.order)
	});
	return paths;
});

export const createExternalPage = command(
	v.object({
		title: v.string(),
		link: v.string(),
		category: pageCategoryValid
	}),
	async ({ link, title, category }) => {
		if (!hasPermission({ page: ['create'] })) {
			throw new Error('Permission Denied');
		}
		const lastOrder = await db.query.pages.findFirst({
			columns: { order: true },
			orderBy: desc(pages.order),
			where: eq(pages.pageCategory, category ?? 'activity')
		});
		const page = await db
			.insert(pages)
			.values({
				title,
				path: link,
				link: true,
				pageCategory: category,
				content: [],
				order: lastOrder?.order ?? 0
			})
			.returning();
		return page;
	}
);

export const createInternalPage = command(
	v.object({
		category: pageCategoryValid
	}),
	async ({ category }) => {
		if (!hasPermission({ page: ['create'] })) {
			throw new Error('Permission Denied');
		}
		const lastOrder = await db.query.pages.findFirst({
			columns: { order: true },
			orderBy: desc(pages.order),
			where: eq(pages.pageCategory, category ?? 'activity')
		});
		const page = await db
			.insert(pages)
			.values({
				title: '',
				path: '',
				link: false,
				pageCategory: category,
				content: [],
				order: lastOrder?.order ?? 0
			})
			.returning();
		return page[0].id;
	}
);

export const deletePage = command(
	v.object({
		id: v.string()
	}),
	async ({ id }) => {
		if (!hasPermission({ page: ['delete'] })) {
			throw new Error('Permission Denied');
		}
		await db.delete(pages).where(eq(pages.id, id));
	}
);

export const updatePage = command(
	v.object({
		id: v.string(),
		title: v.string(),
		path: v.string(),
		type: pageCategoryValid,
		content: v.array(v.unknown())
	}),
	async ({ id, title, path, type, content }) => {
		if (!hasPermission({ page: ['update'] })) {
			throw new Error('Permission Denied');
		}
		console.log(type);
		await db
			.update(pages)
			.set({
				title,
				path,
				pageCategory: type,
				content
			})
			.where(eq(pages.id, id));
	}
);

export const updatePageOrder = command(
	v.array(v.object({ id: v.string(), order: v.number() })),
	async (items) => {
		if (!hasPermission({ page: ['update'] })) {
			throw new Error('Permission Denied');
		}
		if (items.length > 0) {
			await db
				.update(pages)
				.set({
					order: sql`CASE
            ${sql.join(
							items.map((item) => sql`WHEN ${pages.id} = ${item.id} THEN ${item.order}`),
							sql` `
						)}
            ELSE ${pages.order}
          END`
				})
				.where(
					inArray(
						pages.id,
						items.map((item) => item.id)
					)
				);
		}
	}
);
