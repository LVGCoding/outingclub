<script lang="ts">
	import { attachDraggable } from '@thisux/sveltednd';
	import { Button } from '../ui/button';
	import * as Card from '../ui/card';
	import { type PageContent } from './Page.svelte';
	import { GripVertical } from 'lucide-svelte';
	import { Swal2 } from '#lib/utils';
	import { getPageStuff } from './context';
	type Pdf = PageContent & { type: 'pdf' };
	let {
		pdf = $bindable(),
		editMode,
		rowIndex
	}: { pdf: Pdf; editMode: boolean; rowIndex: number } = $props();
	let expanded = $state(false);
	let pageStuff = getPageStuff();
</script>

<Card.Root
	{@attach attachDraggable(() => ({
		container: 'item row:' + rowIndex.toString(),
		handle: '.drag-handle-item',
		containerGroup: 'item',
		disabled: !editMode,
		dragData: {
			id: pdf.id,
			type: 'pdf'
		}
	}))}
	class="relative flex-1 p-0">
	{#if editMode}
		<GripVertical class="drag-handle-item absolute top-1 left-1" />
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
						let column = pageStuff.content[rowIndex].columns.findIndex((e) => e.id === pdf.id);
						pageStuff.content[rowIndex].columns.splice(column, 1);
					}
				}
			}}
			variant="destructive"
			class="drag-handle absolute top-1 right-1">
			Del
		</Button>
	{/if}
	<div style="border-color: blue;" class="expand flex h-full w-full flex-col border-l-4 p-6">
		<Card.Header class="text-2xl">
			<Card.Title>
				{#if editMode}
					<input
						title="title"
						class="rounded bg-card p-1"
						placeholder="title"
						bind:value={pdf.title} />
				{:else}
					{pdf.title}
				{/if}
			</Card.Title>
			<Card.Action>
				<Button variant="secondary" onclick={() => (expanded = !expanded)}>Expand/Collapse</Button>
			</Card.Action>
		</Card.Header>
		<Card.Content class="expand">
			{#if editMode}
				Link: <input
					title="pdf link"
					class="rounded bg-card p-1"
					placeholder="pdf link"
					bind:value={pdf.url} />
			{/if}
			<a class="text-xl text-blue-500" href={pdf.url} target="_blank">Download PDF</a>
			<iframe
				style="max-height: {expanded ? '1000px' : 0};"
				class="expand h-250"
				title={pdf.title}
				src={pdf.url}>
			</iframe>
		</Card.Content>
	</div>
</Card.Root>

<style>
	.expand {
		overflow: hidden;
		transition: max-height 0.5s ease-out;
	}
</style>
