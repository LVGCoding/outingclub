import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { hasPermission } from '#lib/server/auth';

export const load: LayoutServerLoad = async (event) => {
	const userId = event.locals.user?.id;
	if (!userId || !(await hasPermission({ page: ['create'] }, userId))) {
		return redirect(302, '/');
	}
};
