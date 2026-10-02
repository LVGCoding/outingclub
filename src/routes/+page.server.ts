import { getPage } from './query/page.remote';
import type { PageServerLoad } from './$types';
import { renderLexical } from '#lib/components/textEditor/render';

export const load: PageServerLoad = async () => {
	const page = await getPage({ path: '/', pageCategory: 'main' });
	for (const i of page.content) {
		for (const j of i.columns) {
			if (j.type === 'card') {
				j.content = renderLexical(j.content);
			} else if (j.type === 'bio') {
				j.bio = renderLexical(j.bio);
			}
		}
	}
	return { page };
};
