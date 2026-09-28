import { createContext } from 'svelte';
import type { PageContent } from './Page.svelte';

type RowT = PageContent & { type: 'row' };
export interface PageStuff {
	adding: boolean;
	creatingItem: PageContent | null;
	content: RowT[];
}

export const [getPageStuff, setPageStuff] = createContext<PageStuff>();
