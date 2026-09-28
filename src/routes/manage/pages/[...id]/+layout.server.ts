import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { hasPermission } from '#lib/server/auth';

export const load: LayoutServerLoad = async () => {
	if (!(await hasPermission({ trip: ['manage'] }))) {
		return redirect(302, '/');
	}
};
