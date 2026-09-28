import type { PageContent } from '#lib/components/page/Page.svelte';
import { hasPermission } from '#lib/server/auth';
import { db } from '#lib/server/db/';
import { pages } from '#lib/server/db/schema';
import { command, query } from '$app/server';
import { and, eq } from 'drizzle-orm';
import * as v from 'valibot';

export const getPage = query(
	v.object({
		path: v.string(),
		pageCategory: v.union([
			v.literal('activity'),
			v.literal('club'),
			v.literal('main'),
			v.literal('social')
		])
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
export const getPaths = query(async () => {
	const paths = await db.query.pages.findMany({
		columns: {
			path: true,
			pageCategory: true,
			title: true,
			id: true,
			link: true
		}
	});
	return paths;
});

export const createExternalPage = command(
	v.object({
		title: v.string(),
		link: v.string(),
		category: v.union([
			v.literal('activity'),
			v.literal('club'),
			v.literal('main'),
			v.literal('social')
		])
	}),
	async ({ link, title, category }) => {
		if (!hasPermission({ page: ['create'] })) {
			throw new Error('Permission Denied');
		}
		const page = await db
			.insert(pages)
			.values({
				title,
				path: link,
				link: true,
				pageCategory: category,
				content: []
			})
			.returning();
		return page;
	}
);

export const createInternalPage = command(
	v.object({
		category: v.union([
			v.literal('activity'),
			v.literal('club'),
			v.literal('main'),
			v.literal('social')
		])
	}),
	async ({ category }) => {
		if (!hasPermission({ page: ['create'] })) {
			throw new Error('Permission Denied');
		}
		const page = await db
			.insert(pages)
			.values({
				title: '',
				path: '',
				link: false,
				pageCategory: category,
				content: []
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
		type: v.union([
			v.literal('activity'),
			v.literal('club'),
			v.literal('main'),
			v.literal('social')
		]),
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
