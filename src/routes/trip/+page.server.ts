import type { PageServerLoad } from './$types';
import { renderLexical } from '#lib/components/textEditor/render';
import { getTrips } from '../query/trips.remote';

export const load: PageServerLoad = async () => {
	const trips = await getTrips();
	for (const trip of trips) {
		trip.description = renderLexical(trip.description);
	}
	return { trips };
};
