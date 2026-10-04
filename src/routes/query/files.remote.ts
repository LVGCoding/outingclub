import type { PageContent } from '#lib/components/page/Page.svelte';
import { hasPermission } from '#lib/server/auth';
import { db } from '#lib/server/db/';
import { pages, pageCategoryValid, files } from '#lib/server/db/schema';
import { command, query } from '$app/server';
import { and, eq } from 'drizzle-orm';
import * as v from 'valibot';

export const getFiles = query(async () => {
	const filesR = await db.select().from(files);
	return filesR;
});
