<script lang="ts">
	import { draggable } from '@thisux/sveltednd';
	import Input from '../ui/input/input.svelte';
	import { Label } from '../ui/label';
	import { GripVertical } from 'lucide-svelte';
	import { type CoolButtonT } from './Page.svelte';
	import { Button } from '../ui/button';
	let {
		coolButton = $bindable(),
		editMode,
		rowIndex,
		props
	}: {
		coolButton: CoolButtonT;
		editMode: boolean;
		rowIndex: number;
		props: Record<string, unknown>;
	} = $props();
</script>

{#if editMode}
	<div
		{...props}
		use:draggable={{
			container: 'item row:' + rowIndex.toString(),
			handle: '.drag-handle-item',
			containerGroup: 'item',
			disabled: !editMode,
			dragData: {
				id: coolButton.id,
				type: 'image'
			}
		}}
		class="relative">
		{#if editMode}
			<GripVertical class="drag-handle-item absolute top-1 left-1 bg-black" />
		{/if}
		<Button
			class="relative z-0 p-8 pr-12 text-2xl"
			variant="secondary"
			href={coolButton.href || undefined}>
			<img class="absolute top-0 right-0 -z-1 w-full" src={coolButton.img} alt={coolButton.img} />
			{coolButton.text}
		</Button>
		<Label>Button Text: <Input bind:value={coolButton.text} /></Label>
		<Label>Image url: <Input bind:value={coolButton.img} /></Label>
		<Label>Link url: <Input bind:value={coolButton.href} /></Label>
	</div>
{:else}
	<Button class="p-4" variant="secondary" href={coolButton.href || undefined}>
		{coolButton.text}
		<img src={coolButton.img} alt={coolButton.img} />
	</Button>
{/if}

<style>
	.cool-button {
		padding: 2rem;
	}
</style>
