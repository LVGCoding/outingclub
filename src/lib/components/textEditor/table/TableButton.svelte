<script lang="ts">
	import * as Dialog from '#lib/components/ui/dialog/';
	import { TableIcon } from 'lucide-svelte';
	import { getActiveEditor, insertTable } from 'svelte-lexical';
	import { buttonVariants } from '../../ui/button';
	import { Label } from '../../ui/label';
	import { Input } from '../../ui/input';

	const activeEditor = getActiveEditor();
	let row = $state(2);
	let column = $state(2);
	const onClick = () => {
		insertTable($activeEditor, (column || 2).toString(), (row || 2).toString(), false);
		close();
	};
</script>

<Dialog.Root>
	<Dialog.Trigger>
		{#snippet child({ props })}
			<button {...props} type="button" aria-label="button link" class="toolbar-item mx-1">
				<TableIcon size={15} />
			</button>
		{/snippet}
	</Dialog.Trigger>
	<Dialog.Content class="sm:max-w-106.25">
		<Dialog.Header>
			<Dialog.Title>Create Table</Dialog.Title>
			<Dialog.Description>Select the dimensions of your table</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-4">
			<div class="grid gap-3">
				<Label for="row">Rows</Label>
				<Input id="row" type="number" name="row" bind:value={row} />
			</div>
			<div class="grid gap-3">
				<Label for="column">Columns</Label>
				<Input id="column" type="number" name="column" bind:value={column} />
			</div>
		</div>
		<Dialog.Footer>
			<Dialog.Close type="button" class={buttonVariants({ variant: 'outline' })}>
				Cancel
			</Dialog.Close>
			<Dialog.Close type="button" onclick={onClick} class={buttonVariants({ variant: 'default' })}>
				Save changes
			</Dialog.Close>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
