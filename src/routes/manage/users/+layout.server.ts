import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { hasPermission } from '#lib/server/auth';

export const load: LayoutServerLoad = async (event) => {
	const userId = event.locals.user?.id;
	if (!userId || !(await hasPermission({ user: ['view'] }, userId))) {
		return redirect(302, '/');
	}
	return {
		updateNotes: await hasPermission({ user: ['updateNotes'] }, userId),
		editUser: await hasPermission({ user: ['update'] }, userId),
		deleteUser: await hasPermission({ user: ['delete'] }, userId)
	};
};
