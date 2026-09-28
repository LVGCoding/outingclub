import { hasPermission } from '#lib/server/auth';
import type { LayoutServerLoad } from './$types';
import { getPaths } from './query/page.remote';

export const load: LayoutServerLoad = async ({ locals, depends }) => {
	depends('app:paths');
	const user = locals.user;
	const paths = await getPaths().then((res) => {
		const categories = {
			activity: [] as typeof res,
			club: [] as typeof res,
			main: [] as typeof res,
			social: [] as typeof res
		} satisfies Record<string, typeof res>;
		for (const path of res) {
			if (categories[path.pageCategory]) {
				categories[path.pageCategory].push(path);
			} else {
				categories[path.pageCategory] = [path];
			}
		}
		return categories;
	});
	return {
		user,
		paths,
		canCreateTrips: await hasPermission({ trip: ['manage'] }, user?.id),
		canViewUsers: await hasPermission({ user: ['view'] }, user?.id),
		canCreatePages: await hasPermission({ page: ['create'] }, user?.id)
	};
};
