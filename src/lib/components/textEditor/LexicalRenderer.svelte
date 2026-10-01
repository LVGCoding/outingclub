<script lang="ts">
	let { content }: { content: string | null } = $props();
</script>

<div class="editorStyle editor-shell svelte-lexical text-foreground!">
	<!--eslint-disable-next-line svelte/no-at-html-tags -->
	{@html content}
</div>

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
	.editorStyle :global(.toolbar) {
		scrollbar-width: thin;
	}
	.editorStyle :global(li) {
		margin-left: 1.25em;
	}

	.editorStyle :global(a) {
		color: royalblue;
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
	.editorStyle :global(.table-cell-action-button i) {
		background-color: var(--color-white) !important;
		color: var(--color-card-foreground) !important;
	}
	.editorStyle {
		position: static;
		width: 100%;
		margin: 0 !important;
	}
</style>
