<script module>
	export const defaultText =
		'{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}';
</script>

<script lang="ts">
	import {
		BoldButton,
		Divider,
		ItalicButton,
		UnderlineButton,
		StrikethroughButton,
		FormatCodeButton,
		DropDownAlign,
		FontFamilyDropDown,
		FontSizeDropDown,
		Composer,
		ContentEditable,
		RichTextPlugin,
		ListPlugin,
		ListNode,
		ListItemNode,
		BlockFormatDropDown,
		ParagraphDropDownItem,
		HeadingDropDownItem,
		BulletDropDrownItem,
		NumberDropDrownItem,
		HeadingNode,
		OnChangePlugin,
		LinkNode,
		LinkPlugin,
		AutoLinkPlugin,
		InsertLink,
		AutoLinkNode,
		FloatingLinkEditorPlugin,
		HistoryPlugin,
		TablePlugin,
		TableNode,
		TableRowNode,
		TableCellNode,
		TableCellResizerPlugin,
		HorizontalRuleNode,
		HorizontalRulePlugin,
		InsertDropDown,
		InsertHRDropDownItem,
		InsertColumnLayoutDropDownItem,
		ColumnLayoutPlugin,
		LayoutContainerNode,
		LayoutItemNode,
		InsertColumnsDialog
	} from 'svelte-lexical';
	import { theme } from 'svelte-lexical/dist/themes/default';
	import { onMount, type ComponentProps } from 'svelte';
	import ColorpickerText from './colorpicker/ColorpickerText.svelte';
	import ColorPickerBack from './colorpicker/ColorPickerBack.svelte';
	import { browser } from '$app/env';
	import { cn } from '#lib/utils';
	import { ButtonLinkNode } from './linkButton/ButtonLinkNode';
	import ButtonLinkButton from './linkButton/ButtonLinkButton.svelte';
	import ImageButton from './image/ImageButton.svelte';
	import { ImageNode } from './image/ImageNode';
	import TableButton from './table/TableButton.svelte';
	import TableActionPlugin from './table/TableActionPlugin.svelte';
	import Toolbar from './Toolbar.svelte';
	import { ColumnLayoutNode } from './columnLayout/ColumnLayoutNode';
	import ColumnLayoutButton from './columnLayout/ColumnLayoutButton.svelte';

	let {
		content = $bindable(),
		onChange,
		editable
	}: {
		content?: string | null;
		onChange?: (value: string) => void;
		editable?: boolean;
	} = $props();
	const initialConfig: ComponentProps<typeof Composer>['initialConfig'] = {
		theme: theme,
		namespace: 'my_demo',
		nodes: [
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
			ImageNode,
			ColumnLayoutNode
		],
		onError: (error: Error) => {
			throw error;
		},
		editorState: (editor) => {
			if (!content) {
				editor.setEditorState(editor.parseEditorState(defaultText));
			} else {
				editor.setEditorState(editor.parseEditorState(content));
			}
		},
		// eslint-disable-next-line svelte/no-unused-svelte-ignore
		// svelte-ignore state_referenced_locally
		editable: editable
	};

	let editorContainer: HTMLDivElement | undefined = $state();
	let change = false;
	let composer: Composer | undefined = $state();
	$effect(() => {
		if (!composer) return;
		const currentContent = content; // Establish dependency on content
		if (!change) {
			const editor = composer.getEditor();
			if (!currentContent) {
				editor.setEditorState(editor.parseEditorState(defaultText));
			} else {
				editor.setEditorState(editor.parseEditorState(currentContent));
			}
		}
		change = false;
	});

	function fixDropdown(el: HTMLDivElement) {
		let temp = el.style.getPropertyValue('top');
		el.style.top = Number(temp.substring(0, temp.length - 2)) + window.scrollY + 'px';
	}

	onMount(() => {
		if (browser && !document.body.classList.contains('observed')) {
			document.body.classList.add('observed');
			let el = document.querySelector('.svelte-lexical.dropdown') as HTMLDivElement;
			if (el) {
				fixDropdown(el);
			}

			const observer = new MutationObserver(() => {
				let el = document.querySelector('.svelte-lexical.dropdown') as HTMLDivElement;
				if (el) {
					fixDropdown(el);
				}
			});

			observer.observe(document.body, {
				childList: true,
				subtree: true
			});
		}
	});
	$effect(() => {
		if (!composer) return;
		const editor = composer.getEditor();
		editor.setEditable(editable ?? false);
	});
</script>

<svelte:document
	onkeypress={(e) => {
		if (e.altKey) {
			console.log('Alt+A pressed');
		}
	}}></svelte:document>
{#if true}
	<Composer bind:this={composer} {initialConfig}>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class={cn('ul editorStyle editor-shell svelte-lexical m-0! rounded-4xl', {
				notEditable: !editable,
				editable: editable
			})}
			oncontextmenu={(e) => e.stopPropagation()}>
			{#if browser}
				<FloatingLinkEditorPlugin anchorElem={editorContainer} />
			{/if}
			{#if editable}
				<div class="relative h-9">
					<Toolbar class="absolute! top-0 left-0 w-full">
						<!-- {#snippet children({ editor, activeEditor, blockType })} -->
						<FontFamilyDropDown />
						<FontSizeDropDown />
						<Divider />
						<BoldButton />
						<ItalicButton />
						<UnderlineButton />
						<StrikethroughButton />
						<FormatCodeButton />
						<ColorpickerText />
						<ColorPickerBack />
						<InsertLink />
						<DropDownAlign />
						<ImageButton />
						<InsertDropDown>
							<InsertHRDropDownItem />
							<InsertColumnLayoutDropDownItem />
						</InsertDropDown>
						<TableButton />
						<ButtonLinkButton />
						<BlockFormatDropDown>
							<ParagraphDropDownItem />
							<HeadingDropDownItem headingSize="h1" />
							<HeadingDropDownItem headingSize="h2" />
							<HeadingDropDownItem headingSize="h3" />
							<BulletDropDrownItem />
							<NumberDropDrownItem />
						</BlockFormatDropDown>
						<InsertColumnsDialog />
						<ColumnLayoutButton />
					</Toolbar>
				</div>
			{/if}
			<div class="editor-container border-border! bg-transparent! text-card-foreground">
				<div class="editor-scroller">
					<div class="editor" role="textbox" tabindex="-1" bind:this={editorContainer}>
						<ContentEditable />
					</div>
				</div>
				<RichTextPlugin />
				<ListPlugin />
				<LinkPlugin />
				<AutoLinkPlugin />
				<HistoryPlugin />
				<ColumnLayoutPlugin />
				<TablePlugin />
				<HorizontalRulePlugin />
				<TableActionPlugin anchorElem={editorContainer} />
				<TableCellResizerPlugin />
				<OnChangePlugin
					ignoreHistoryMergeTagChange={false}
					ignoreSelectionChange={true}
					onChange={(e) => {
						let string = JSON.stringify(e.toJSON());

						content = string;
						change = true;
						if (onChange) onChange(string);
					}} />
			</div>
		</div>
	</Composer>
{/if}

<style>
	.editorStyle :global(ul) {
		display: block;
		list-style-type: disc;
		margin-block-start: 0.25em;
		margin-block-end: 0.25em;
		padding-inline-start: 0;
		unicode-bidi: isolate;
	}

	.editorStyle :global(ol) {
		display: block;
		list-style-type: decimal;
		margin-block-start: 0.45em;
		margin-block-end: 0.25em;
		padding-inline-start: 0;
		unicode-bidi: isolate;
	}

	.editorStyle :global(li) {
		margin-left: 1em;
	}

	.editorStyle :global(.toolbar) {
		scrollbar-width: thin;
	}

	.editable :global(a) {
		pointer-events: none;
	}

	.editor-shell :global(td) {
		overflow: hidden;
	}

	.editor-shell :global(input) {
		border-radius: var(--radius-md);
		background-color: var(--color-card);
	}

	.editor-shell :global(.dialog-dropdown) {
		border-radius: var(--radius-md);
		background-color: var(--color-card) !important;
	}

	.editor-shell :global(.Button__root) {
		border-radius: var(--radius-md);
		background-color: var(--color-primary) !important;
		color: var(--color-primary-foreground) !important;
	}

	.editorStyle :global(.toolbar) {
		scrollbar-width: thin;
		border-color: var(--border);
	}

	.notEditable :global(.SL_Theme__layoutItem) {
		border: none !important;
	}

	.notEditable :global(.editor-container) {
		border: none !important;
	}

	.editorStyle {
		position: static;
		width: 100%;
		max-width: unset;
	}
</style>
