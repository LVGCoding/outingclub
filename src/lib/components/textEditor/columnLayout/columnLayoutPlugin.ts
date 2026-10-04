import {
	$createParagraphNode,
	$getSelection,
	$isRangeSelection,
	KEY_ARROW_DOWN_COMMAND,
	KEY_ARROW_UP_COMMAND,
	KEY_BACKSPACE_COMMAND,
	KEY_DELETE_COMMAND,
	COMMAND_PRIORITY_HIGH,
	type LexicalEditor
} from 'lexical';

import { $isColumnLayoutNode } from './ColumnLayoutNode';

function getColumnLayout(selection: ReturnType<typeof $getSelection>) {
	if (!$isRangeSelection(selection)) {
		return null;
	}

	let node = selection.anchor.getNode();

	while (node) {
		if ($isColumnLayoutNode(node)) {
			return node;
		}
		const parent = node.getParent();
		if (!parent) return null;
		node = parent;
	}

	return null;
}

export function registerColumnLayoutCommands(editor: LexicalEditor) {
	const unregisterBackspace = editor.registerCommand(
		KEY_BACKSPACE_COMMAND,
		(event) => {
			const selection = $getSelection();

			if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
				return false;
			}

			const layout = getColumnLayout(selection);
			if (!layout) return false;

			const node = selection.anchor.getNode();
			const child = layout.getChildAtIndex(0);
			console.log(child?.getKey(), node.getKey());
			if (
				node.getType() !== 'paragraph' ||
				node.getParent() !== layout ||
				node.getTextContentSize() !== 0 ||
				child?.getKey() !== node.getKey()
			) {
				return false;
			}

			layout.remove();

			event?.preventDefault();
			return true;
		},
		COMMAND_PRIORITY_HIGH
	);

	const unregisterDelete = editor.registerCommand(
		KEY_DELETE_COMMAND,
		(event) => {
			const selection = $getSelection();

			if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
				return false;
			}

			const layout = getColumnLayout(selection);
			if (!layout) return false;

			const node = selection.anchor.getNode();

			if (
				node.getType() !== 'paragraph' ||
				node.getParent() !== layout ||
				node.getTextContentSize() !== 0
			) {
				return false;
			}

			layout.remove();

			event?.preventDefault();
			return true;
		},
		COMMAND_PRIORITY_HIGH
	);

	const unregisterArrowUp = editor.registerCommand(
		KEY_ARROW_UP_COMMAND,
		(event) => {
			const selection = $getSelection();

			if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
				return false;
			}

			const layout = getColumnLayout(selection);
			if (!layout) return false;

			const node = selection.anchor.getNode();

			if (
				node.getType() !== 'paragraph' ||
				node.getParent() !== layout ||
				selection.anchor.offset !== 0
			) {
				return false;
			}

			const previous = layout.getPreviousSibling();

			if (previous) {
				previous.selectEnd();
			} else {
				const paragraph = $createParagraphNode();
				layout.insertBefore(paragraph);
				paragraph.select();
			}

			event?.preventDefault();
			return true;
		},
		COMMAND_PRIORITY_HIGH
	);

	const unregisterArrowDown = editor.registerCommand(
		KEY_ARROW_DOWN_COMMAND,
		(event) => {
			const selection = $getSelection();

			if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
				return false;
			}

			const layout = getColumnLayout(selection);
			if (!layout) return false;

			const node = selection.anchor.getNode();

			if (
				node.getType() !== 'paragraph' ||
				node.getParent() !== layout ||
				selection.anchor.offset !== node.getTextContentSize()
			) {
				return false;
			}

			const next = layout.getNextSibling();

			if (next) {
				next.selectStart();
			} else {
				const paragraph = $createParagraphNode();
				layout.insertAfter(paragraph);
				paragraph.select();
			}

			event?.preventDefault();
			return true;
		},
		COMMAND_PRIORITY_HIGH
	);

	return () => {
		unregisterBackspace();
		unregisterDelete();
		unregisterArrowUp();
		unregisterArrowDown();
	};
}
