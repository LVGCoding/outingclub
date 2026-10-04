import type { FileType } from '#lib/server/db/schema';
import { createContext } from 'svelte';

export type FileState = Record<
	FileType,
	{
		id: string;
		name: string;
		url: string;
	}[]
> & { refetch: () => Promise<void> };

export const [getFileContext, setFileContext] = createContext<FileState>();
