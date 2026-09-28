<script module lang="ts">
	import * as Select from '#lib/components/ui/select/';
	import { cn, Swal2 } from '#lib/utils';

	const optionsTab = [
		{ value: 'home', label: 'Home' },
		{ value: 'activity', label: 'Activities' },
		{ value: 'club', label: 'Club' }
	];

	const optionsElements = [
		{ value: 'card', label: 'Card' },
		{ value: 'image', label: 'Image' },
		{ value: 'pdf', label: 'PDF' },
		{ value: 'bio', label: 'Bio' }
	];

	export type dragItem = { id: number; type: string };

	export type PageContent = { id: number } & (
		| {
				type: 'bio';
				title: string;
				image: string;
				name: string;
				email: string;
				bio: string;
		  }
		| {
				type: 'card';
				title: string;
				color: string;
				badge: string;
				content: string;
				shrink: boolean;
		  }
		| {
				type: 'row';
				columns: PageContent[];
		  }
		| {
				type: 'pdf';
				url: string;
				title: string;
		  }
		| {
				type: 'image';
				url: string;
				href: string;
		  }
	);

	type RowT = PageContent & { type: 'row' };
</script>

<script lang="ts">
	import Row from './Row.svelte';
	import { droppable, type DragDropState } from '@thisux/sveltednd';
	import { dndState } from '@thisux/sveltednd';
	import { Button } from '../ui/button';
	import { Separator } from '../ui/separator';
	import { setPageStuff, type PageStuff } from './context';
	import { SaveIcon } from 'lucide-svelte';
	import ActionWrapper from '../ActionWrapper.svelte';
	import { getPageById, updatePage } from '../../../routes/query/page.remote';
	import { invalidate } from '$app/navigation';

	let {
		content = $bindable(),
		editMode = false,
		title = $bindable(),
		path = $bindable(''),
		type = $bindable(),
		id = $bindable()
	}: {
		content: RowT[];
		title: string;
		type: string;
		editMode?: boolean;
		path?: string;
		id?: string;
	} = $props();
	let pageStuff: PageStuff = $state({
		adding: false,
		creatingItem: null,
		content: content
	});
	setPageStuff(pageStuff);
	function handleDrop(state: DragDropState<dragItem>) {
		const { draggedItem, sourceContainer, targetContainer } = state;

		if (draggedItem.type === 'row') {
			const dragIndex = content.findIndex((item) => item.id === draggedItem.id);
			let dropIndex = parseInt(targetContainer?.split(':')[1] ?? '0');
			console.log(state, dropIndex, dropIndex, $state.snapshot(content));
			if (dragIndex !== -1) {
				const [item] = content.splice(dragIndex, 1);
				const adjusted = dragIndex < dropIndex ? dropIndex - 1 : dropIndex;
				content.splice(adjusted, 0, item);
			}
		} else {
			const split = sourceContainer?.split(':');
			const sourceRow = split ? parseInt(split[1]) : 0;
			const dragIndex = content[sourceRow].columns.findIndex((item) => item.id === draggedItem.id);
			const dropIndex = parseInt(targetContainer?.split(':')[1] ?? '0');
			if (dragIndex !== -1) {
				const [item] = content[sourceRow].columns.splice(dragIndex, 1);
				content.splice(dropIndex, 0, {
					type: 'row',
					id: Math.random(),
					columns: [item]
				});
				const adjusted = dropIndex <= sourceRow ? sourceRow + 1 : sourceRow;

				if (content[adjusted].columns.length === 0) {
					console.log('empty');
					content.splice(adjusted, 1);
				}
			}
		}

		// // Simple reordering logic
		// const dragIndex = content.findIndex((item) => item.id === draggedItem);
		// let dropIndex = parseInt(targetContainer ?? '0');
		// console.log(state, dropIndex, dropIndex, $state.snapshot(content));
		// if (dragIndex !== -1) {
		// 	const [item] = content.splice(dragIndex, 1);
		// 	const adjusted = dragIndex < dropIndex ? dropIndex - 1 : dropIndex;
		// 	content.splice(adjusted, 0, item);
		// }
	}
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>
<svelte:document
	onkeydown={(e) => {
		if (e.key === 'Escape') {
			pageStuff.adding = false;
			pageStuff.creatingItem = null;
		}
	}} />

{#if editMode}
	<h1 class="flex flex-col items-center justify-center gap-1 text-2xl font-bold">
		<label>
			Title: <input class="rounded bg-card p-1 text-2xl" placeholder="title" bind:value={title} />
		</label>
		<label>
			Path: <input class="rounded bg-card p-1 text-2xl" placeholder="path" bind:value={path} />
		</label>
		<label class="flex gap-1">
			Category: <Select.Root type="single" items={optionsTab} bind:value={type}>
				<Select.Trigger class="w-45">
					<Select.Value placeholder="Select a type" />
				</Select.Trigger>
				<Select.Content>
					<Select.Group>
						<Select.Label>Select a type</Select.Label>
						{#each optionsTab as type (type.value)}
							<Select.Item value={type.value} label={type.label}>
								{type.label}
							</Select.Item>
						{/each}
					</Select.Group>
				</Select.Content>
			</Select.Root>
		</label>
		<Button
			onclick={async () => {
				let res = await Swal2.fire({
					title: 'Element Type',
					input: 'select',
					confirmButtonText: 'Add Element',
					showCancelButton: true,
					showCloseButton: true,
					inputOptions: {
						...optionsElements?.reduce(
							(acc, option) => ({ ...acc, [option.value]: option.label }),
							{}
						)
					}
				});
				if (res.isConfirmed) {
					pageStuff.adding = true;
					if (res.value === 'card') {
						pageStuff.creatingItem = {
							type: 'card',
							id: Math.random(),
							title: '',
							color: '#0eb100',
							badge: '',
							content: '',
							shrink: false
						};
					} else if (res.value === 'image') {
						pageStuff.creatingItem = {
							type: 'image',
							id: Math.random(),
							url: '',
							href: ''
						};
					} else if (res.value === 'pdf') {
						pageStuff.creatingItem = {
							type: 'pdf',
							id: Math.random(),
							url: '',
							title: ''
						};
					} else if (res.value === 'bio') {
						pageStuff.creatingItem = {
							type: 'bio',
							id: Math.random(),
							title: '',
							image: '',
							name: '',
							email: '',
							bio: ''
						};
					}
				}
			}}>
			Add Element
		</Button>
		<ActionWrapper
			onclick={async () => {
				if (!id) return;
				await updatePage({
					content,
					title,
					path: path ?? '',
					type: type as 'main' | 'activity' | 'club' | 'social',
					id: id
				});
				await getPageById({ id: id }).refresh();
				await invalidate('app:paths');
			}}>
			{#snippet children({ props, spinnerIcon })}
				<Button {...props}><SaveIcon /> Save {@render spinnerIcon()}</Button>
			{/snippet}
		</ActionWrapper>
	</h1>
{:else}
	<h1 class="flex items-center justify-center font-roboto text-4xl font-light text-shadow-md">
		{title}
	</h1>
{/if}
<Separator />

{#snippet moveRow({ i }: { i: number })}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class={cn('my-1 h-5 rounded', {
			draggingHappening: dndState.isDragging,
			'adding-row': pageStuff.adding
		})}
		onclick={() => {
			pageStuff.adding = false;
			if (pageStuff.creatingItem)
				content.splice(i, 0, { type: 'row', id: Math.random(), columns: [pageStuff.creatingItem] });
			pageStuff.creatingItem = null;
		}}
		use:droppable={{
			container: 'row:' + i.toString(),
			callbacks: { onDrop: handleDrop },
			attributes: { dragOverClass: 'drag-over-c' }
		}}>
	</div>
{/snippet}

<div class="container">
	{@render moveRow({ i: 0 })}
	{#each content as item, i (i)}
		{#if item.type === 'row'}
			<Row index={i} page={content} {editMode} bind:row={content[i]} />
		{:else}
			ERROR: unknown type {item.type}
		{/if}
		{@render moveRow({ i: i + 1 })}
	{/each}
</div>

<style>
	.container :global(.drag-over-c) {
		background-color: rgba(0, 0, 0, 0.1);
		height: 50px;
	}
	.container :global(.drag-over-cs) {
		background-color: rgba(0, 0, 0, 0.1);
		width: 50px;
	}
	.container :global(.adding-row) {
		border: gray dashed 4px;
		position: relative;
	}
	.container :global(.adding-row:hover) {
		background-color: rgba(0, 0, 0, 0.1);
	}
	.container :global(.adding-row::after) {
		content: '✚';
		font-size: 24px;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}
	.container :global(.draggingHappening) {
		border: gray dashed 4px;
	}
	.container :global(.draggingHappening::before) {
		display: none;
	}
	.container :global(.draggingHappening::after) {
		display: none;
	}
</style>
