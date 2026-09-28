<script lang="ts">
	import { $getSelection as getSelection, $insertNodes as insertNodes } from 'lexical';
	import { createButtonLinkNode } from './ButtonLinkNode';
	import { getEditor } from 'svelte-lexical';
	import { Link } from 'lucide-svelte';

	const editor = getEditor();

	function insertButtonLink() {
		editor.update(() => {
			const selection = getSelection();
			if (selection) {
				const node = createButtonLinkNode('https://', 'Unset');
				insertNodes([node]);
			}
		});
	}
</script>

<button type="button" aria-label="button link" onclick={insertButtonLink} class="toolbar-item mx-1">
	<Link size={15} />
</button>
