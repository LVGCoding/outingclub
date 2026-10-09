<script lang="ts" generics="T extends { order: number,id:string|number }">
	import { cn } from '#lib/utils';
	import { untrack, type Snippet } from 'svelte';

	let {
		items = $bindable(),
		card,
		updated: onChange,
		handelOffest = 0,
		width = 100
	}: {
		items: T[];
		width?: number;
		handelOffest?: number;
		card: Snippet<
			[
				{
					item: T;
					index: number;
					cardProps: { class?: string } & Record<string, unknown>;
					handelProps: { class?: string } & Record<string, unknown>;
				}
			]
		>;
		updated?: (items: { id: T['id']; order: number }[]) => void;
	} = $props();
	let dragIndex: number | null = $state(null);
	let dragItem: T | null = $state(null);
	let disabled = $state(false);
	let hoverItemIndex: number | null = $state(null);
	let startDragIndex: number | null = $state(null);
	let draggable = $state(false);
	let yPos = $state(300);
	//Swaps for drag list
	$effect(() => {
		if (dragIndex !== null && hoverItemIndex !== null) {
			let itemsX = untrack(() => items);
			let t = itemsX[dragIndex].order;
			itemsX[dragIndex].order = itemsX[hoverItemIndex].order;
			itemsX[hoverItemIndex].order = t;
			[itemsX[dragIndex], itemsX[hoverItemIndex]] = [itemsX[hoverItemIndex], itemsX[dragIndex]];
			dragIndex = hoverItemIndex;
		}
	});
</script>

{#if dragIndex !== null && dragItem}
	{@render card({
		item: dragItem,
		index: dragIndex,
		handelProps: {
			class: 'cursor-grab'
		},
		cardProps: {
			style: `top:${yPos}px; pointer-events: none; width:${width}px;`,
			class: `fixed`
		}
	})}
{/if}

{#each items as item, i (item.id)}
	{@render card({
		item: items[i],
		index: i,
		handelProps: {
			onmousedown: () => {
				if (disabled) return;
				draggable = true;
			},
			onmouseup: () => {
				draggable = false;
			},
			class: 'cursor-grab'
		},
		cardProps: {
			ondragstart: (e: DragEvent) => {
				e.stopPropagation();
				startDragIndex = i;
				dragIndex = i;
				yPos = e.clientY + window.scrollY + handelOffest;
				dragItem = item;
			},
			ondragover: (e: DragEvent) => {
				e.stopPropagation();
				hoverItemIndex = i;
			},
			ondrag: (e: DragEvent) => {
				e.stopPropagation();
				yPos = e.clientY + window.scrollY + handelOffest;
			},
			ondragend: async (e: DragEvent) => {
				e.stopPropagation();
				draggable = false;
				dragIndex = null;
				hoverItemIndex = null;
				dragItem = null;
				startDragIndex = null;
				if (onChange) {
					const toUpdate: { id: T['id']; order: number }[] = [];
					for (let i = Math.min(hoverItemIndex ?? 0, startDragIndex ?? 0); i < items.length; i++) {
						toUpdate.push({ id: items[i].id, order: i });
					}
					disabled = true;
					await onChange(toUpdate);
					disabled = false;
				}
			},
			draggable: draggable ? 'true' : 'false',
			class: cn('select-none', dragIndex === i ? 'opacity-0' : '')
		}
	})}
{/each}
