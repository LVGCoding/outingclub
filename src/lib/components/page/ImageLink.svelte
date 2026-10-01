<script lang="ts">
	import { draggable } from '@thisux/sveltednd';
	import Input from '../ui/input/input.svelte';
	import { Label } from '../ui/label';
	import { GripVertical } from 'lucide-svelte';
	import { type ImageLinkT } from './Page.svelte';
	let {
		img = $bindable(),
		editMode,
		rowIndex,
		props
	}: {
		img: ImageLinkT;
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
				id: img.id,
				type: 'image'
			}
		}}
		class="relative">
		{#if editMode}
			<GripVertical class="drag-handle-item absolute top-1 left-1 bg-black" />
		{/if}
		<a
			class="flex justify-center"
			href={img.href || undefined}
			target={img.href ? '_blank' : undefined}>
			<img src={img.url} alt={img.url} />
		</a>
		<Label>Image url: <Input bind:value={img.url} /></Label>
		<Label>Link url: <Input bind:value={img.href} /></Label>
	</div>
{:else}
	<a
		class="flex justify-center"
		href={img.href || undefined}
		target={img.href ? '_blank' : undefined}>
		<img src={img.url} alt={img.url} />
	</a>
{/if}
