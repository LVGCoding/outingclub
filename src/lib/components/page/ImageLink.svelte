<script lang="ts">
	import { draggable } from '@thisux/sveltednd';
	import Input from '../ui/input/input.svelte';
	import { Label } from '../ui/label';
	import { type PageContent } from './Page.svelte';
	import { GripVertical } from 'lucide-svelte';
	import { Button } from '../ui/button';
	import { Swal2 } from '#lib/utils';
	import { getPageStuff } from './context';
	type Image = PageContent & { type: 'image' };
	let {
		img = $bindable(),
		editMode,
		rowIndex
	}: { img: Image; editMode: boolean; rowIndex: number } = $props();
	let pageStuff = getPageStuff();
</script>

{#if editMode}
	<div
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
			<Button
				onclick={async () => {
					let res = await Swal2.fire({
						icon: 'warning',
						title: 'Are you sure you want to delete this card?',
						showCloseButton: true,
						showCancelButton: true
					});
					if (res.isConfirmed) {
						if (pageStuff.content[rowIndex].columns.length === 1) {
							pageStuff.content.splice(rowIndex, 1);
						} else {
							let column = pageStuff.content[rowIndex].columns.findIndex((e) => e.id === img.id);
							pageStuff.content[rowIndex].columns.splice(column, 1);
						}
					}
				}}
				variant="destructive"
				class="drag-handle absolute top-1 right-1">
				Del
			</Button>
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
