import { renderLexical } from '#lib/server/lexical/render';
import { getPage } from '../../query/page.remote';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const page = await getPage({ path: params.slug, pageCategory: 'club' });
	for (const i of page.content) {
		for (const j of i.columns) {
			if (j.type === 'card') {
				j.content = renderLexical(j.content);
			} else if (j.type === 'bio') {
				j.bio = renderLexical(j.bio);
			}
		}
	}
	return {
		page
	};
};
