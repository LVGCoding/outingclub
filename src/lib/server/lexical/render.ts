import { JSDOM } from 'jsdom';
import { createEditor } from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';

import { ListNode, ListItemNode } from '@lexical/list';

import { HeadingNode } from '@lexical/rich-text';

import { LinkNode, AutoLinkNode } from '@lexical/link';

import { TableNode, TableRowNode, TableCellNode } from '@lexical/table';

import { HorizontalRuleNode } from '@lexical/extension';

import { LayoutContainerNode, LayoutItemNode } from 'svelte-lexical';

// Your nodes
import { ImageNode } from '#lib/components/textEditor/image/ImageNode';
import { ButtonLinkNode } from '#lib/components/textEditor/linkButton/ButtonLinkNode';
const nodes = [
	ListNode,
	ListItemNode,
	HeadingNode,
	LinkNode,
	AutoLinkNode,
	TableNode,
	TableRowNode,
	TableCellNode,
	HorizontalRuleNode,
	LayoutContainerNode,
	LayoutItemNode,
	ButtonLinkNode,
	ImageNode
];
export function renderLexical(content: string | null): string {
	if (!content) {
		return '';
	}

	const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');

	const previousWindow = globalThis.window;
	const previousDocument = globalThis.document;

	globalThis.window = dom.window as unknown as Window & typeof globalThis;
	globalThis.document = dom.window.document;

	try {
		const editor = createEditor({
			namespace: 'lexical-ssr',
			nodes,
			editable: false,
			onError(error) {
				throw error;
			}
		});

		const editorState = editor.parseEditorState(content);

		editor.setEditorState(editorState);

		return editorState.read(() => {
			return $generateHtmlFromNodes(editor, null);
		});
	} finally {
		globalThis.window = previousWindow;
		globalThis.document = previousDocument;
	}
}
