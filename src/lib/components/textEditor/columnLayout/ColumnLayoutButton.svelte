<script lang="ts">
	import { $getSelection as getSelection, $insertNodes as insertNodes } from 'lexical';
	import { $createColumnLayoutNode as createColumnLayoutNode } from './ColumnLayoutNode';
	import { getEditor } from 'svelte-lexical';
	import { Columns3Cog } from 'lucide-svelte';
	import * as Popover from '#lib/components/ui/popover/';
	import PopoverContent from '#lib/components/ui/popover/popover-content.svelte';
	import Input from '#lib/components/ui/input/input.svelte';
	import Label from '#lib/components/ui/label/label.svelte';
	import { Button } from '../../ui/button';

	const editor = getEditor();

	let columns = $state(2);

	function insertButtonLink() {
		editor.update(() => {
			const selection = getSelection();
			if (selection) {
				const node = createColumnLayoutNode(columns);
				insertNodes([node]);
			}
		});
	}
</script>

<Popover.Root>
	<Popover.Trigger>
		{#snippet child({ props })}
			<button {...props} type="button" aria-label="button link" class="toolbar-item mx-1">
				<Columns3Cog size="15" />
			</button>
		{/snippet}
	</Popover.Trigger>
	<PopoverContent>
		<Label>
			Columns: <Input type="number" bind:value={columns} />
		</Label>
		<Button onclick={insertButtonLink}>Create Column Layout</Button>
	</PopoverContent>
</Popover.Root>
