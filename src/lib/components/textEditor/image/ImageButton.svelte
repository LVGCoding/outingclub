<script lang="ts">
	import { $getSelection as getSelection, $insertNodes as insertNodes } from 'lexical';
	import { createImageNode } from './ImageNode';
	import { getEditor } from 'svelte-lexical';
	import { ImageIcon } from 'lucide-svelte';
	import { Swal2 } from '#lib/utils';

	const editor = getEditor();

	async function insertImage() {
		let res = await Swal2.fire({
			title: 'Image URL',
			showCancelButton: true,
			confirmButtonText: 'OK',
			input: 'text',
			inputPlaceholder: 'image URL'
		});
		if (res.isConfirmed) {
			editor.update(() => {
				const selection = getSelection();
				if (selection) {
					const node = createImageNode(res.value, 'Unset', 'inline', { width: -1, height: -1 });
					insertNodes([node]);
				}
			});
		}
	}
</script>

<button type="button" aria-label="Image" onclick={insertImage} class="toolbar-item mx-1">
	<ImageIcon size={15} />
</button>
