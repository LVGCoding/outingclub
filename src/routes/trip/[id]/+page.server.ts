import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { hasPermission } from '#lib/server/auth';

export const load: PageServerLoad = async () => {
	if (!(await hasPermission({ trip: ['signup'] }))) {
		return redirect(302, '/login?reason=not_logged_in');
	}
};
