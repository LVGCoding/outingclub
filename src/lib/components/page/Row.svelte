<script lang="ts">
	import { dndState, draggable, droppable, type DragDropState } from '@thisux/sveltednd';
	import Bio from './Bio.svelte';
	import Card from './Card.svelte';
	import ImageLink from './ImageLink.svelte';
	import { type dragItem, type PageContent } from './Page.svelte';
	import Pdf from './Pdf.svelte';
	import { cn } from '#lib/utils';
	import { GripVertical } from 'lucide-svelte';
	import { getPageStuff } from './context';
	type RowT = PageContent & { type: 'row' };
	type BioT = PageContent & { type: 'bio' };
	type PdfT = PageContent & { type: 'pdf' };
	type CardT = PageContent & { type: 'card' };
	type ImageLinkT = PageContent & { type: 'image' };
	let {
		row = $bindable(),
		editMode,
		page,
		index
	}: { row: RowT; editMode: boolean; page: RowT[]; index: number } = $props();
	let meDragging = $derived(
		(dndState.draggedItem as dragItem).id === row.id &&
			(dndState.draggedItem as dragItem).type === 'row'
	);
	function handleDropCol(state: DragDropState<dragItem>) {
		const { draggedItem, sourceContainer, targetContainer } = state;
		let split = targetContainer?.split(':') ?? [];
		let targetRowIndex = Number(split[1]);
		let targetColIndex = Number(split[2]);
		if (draggedItem.type === 'row') {
			let draggedRowIndex = page.findIndex((r) => r.id === (draggedItem as dragItem).id);
			page[targetRowIndex].columns.splice(targetColIndex, 0, ...page[draggedRowIndex].columns);
			page.splice(draggedRowIndex, 1);
		} else {
			console.log(sourceContainer);
			let splitS = sourceContainer.split(':');
			let draggedRowIndex = Number(splitS[1]);
			let draggedColIndex = page[draggedRowIndex].columns.findIndex(
				(c) => c.id === (draggedItem as dragItem).id
			);
			let [item] = page[draggedRowIndex].columns.splice(draggedColIndex, 1);
			let adjustedColIndex =
				draggedRowIndex === targetRowIndex && draggedColIndex < targetColIndex
					? targetColIndex - 1
					: targetColIndex;
			page[targetRowIndex].columns.splice(adjustedColIndex, 0, item);
			if (page[draggedRowIndex].columns.length === 0) {
				page.splice(draggedRowIndex, 1);
			}
		}
	}
	let pageStuff = getPageStuff();
</script>

{#snippet moveCol({ i }: { i: number })}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class={cn('mx-1 inline-block w-5 rounded', {
			draggingHappening: dndState.isDragging && !meDragging,
			'adding-row': pageStuff.adding
		})}
		onclick={() => {
			pageStuff.adding = false;
			if (pageStuff.creatingItem) page[index].columns.splice(i, 0, pageStuff.creatingItem);
			pageStuff.creatingItem = null;
		}}
		use:droppable={{
			disabled: dndState.isDragging && meDragging,
			container: 'col:' + index + ':' + i,
			callbacks: { onDrop: handleDropCol },
			attributes: { dragOverClass: 'drag-over-cs' }
		}}>
	</div>
{/snippet}

<div
	role="row"
	tabindex={index}
	use:draggable={{
		disabled: !editMode,
		container: index.toString(),
		containerGroup: 'group',
		handle: '.drag-handle',
		dragData: {
			id: row.id,
			type: 'row'
		}
	}}
	style="row-gap: 1.5rem;"
	class={cn('relative flex flex-wrap justify-center', {
		'rounded border-4 bg-card/10': editMode,
		'bg-card': dndState.isDragging && meDragging,
		'gap-6': !editMode
	})}>
	{#if editMode}
		<GripVertical class="drag-handle absolute top-1 left-1" />
	{/if}
	{#if editMode}
		{@render moveCol({ i: 0 })}
	{/if}
	{#each row.columns as item, i (i)}
		{#if item.type === 'row'}
			Error Cant have row in row
		{:else if item.type === 'bio'}
			<Bio rowIndex={index} {editMode} bind:bio={row.columns[i] as BioT} />
		{:else if item.type === 'card'}
			<Card rowIndex={index} {editMode} bind:card={row.columns[i] as CardT} />
		{:else if item.type === 'image'}
			<ImageLink rowIndex={index} {editMode} bind:img={row.columns[i] as ImageLinkT} />
		{:else if item.type === 'pdf'}
			<Pdf rowIndex={index} {editMode} bind:pdf={row.columns[i] as PdfT} />
		{/if}
		{#if editMode}
			{@render moveCol({ i: i + 1 })}
		{/if}
	{/each}
</div>
