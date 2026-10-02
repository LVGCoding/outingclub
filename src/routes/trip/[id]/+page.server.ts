import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { hasPermission } from '#lib/server/auth';
import { getTrip } from '../../query/trips.remote';
import { renderLexical } from '#lib/components/textEditor/render';

export const load: PageServerLoad = async ({ params, depends }) => {
	depends('app:trip');
	const trip = await getTrip({ id: params.id ?? '' });
	if (!(await hasPermission({ trip: ['signup'] }))) {
		return redirect(302, '/login?reason=not_logged_in');
	}
	return { trip: { ...trip, description: renderLexical(trip.description ?? '') } };
};
