<script lang="ts">
	import { writable } from 'svelte/store';
	import { setContext, type Snippet } from 'svelte';
	import { getEditor, StateStoreRichTextUpdator, type LexicalEditor } from 'svelte-lexical';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '#lib/utils';
	let {
		children,
		class: className,
		...props
	}: {
		children: Snippet<
			[
				{
					editor: LexicalEditor;
					activeEditor: LexicalEditor;
					blockType: string;
				}
			]
		>;
	} & HTMLAttributes<HTMLDivElement> = $props();
	const editor = getEditor();
	const activeEditor = writable(editor);
	setContext('activeEditor', activeEditor);
	setContext('isBold', writable(false));
	setContext('isItalic', writable(false));
	setContext('isUnderline', writable(false));
	setContext('isStrikethrough', writable(false));
	setContext('isSubscript', writable(false));
	setContext('isSuperscript', writable(false));
	setContext('isCode', writable(false));
	const blockType = writable('paragraph');
	setContext('blockType', blockType);
	setContext('selectedElementKey', writable(null));
	setContext('fontSize', writable('15px'));
	setContext('fontFamily', writable('Arial'));
	setContext('fontColor', writable('#000'));
	setContext('bgColor', writable('#fff'));
	setContext('isRTL', writable(false));
	setContext('codeLanguage', writable(''));
	setContext('codeTheme', writable('one-light'));
	setContext('isLink', writable(false));
	setContext('isImageCaption', writable(false));
</script>

<StateStoreRichTextUpdator />
<div class={cn('toolbar', className)} {...props}>
	{@render children?.({
		editor,
		activeEditor: $activeEditor,
		blockType: $blockType
	})}
</div>
