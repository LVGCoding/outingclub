<script lang="ts">
	import { attachDraggable } from '@thisux/sveltednd';
	import Editor from '../textEditor/Editor.svelte';
	import * as Card from '../ui/card';
	import Separator from '../ui/separator/separator.svelte';
	import { type PageContent } from './Page.svelte';
	import { GripVertical } from 'lucide-svelte';
	import { Button } from '../ui/button';
	import { Swal2 } from '#lib/utils';
	import { getPageStuff } from './context';
	type Bio = PageContent & { type: 'bio' };
	let {
		bio = $bindable(),
		editMode,
		rowIndex
	}: { bio: Bio; editMode: boolean; rowIndex: number } = $props();
	let pageStuff = getPageStuff();
</script>

<Card.Root
	{@attach attachDraggable(() => ({
		container: 'item row:' + rowIndex.toString(),
		handle: '.drag-handle-item',
		containerGroup: 'item',
		disabled: !editMode,
		dragData: {
			id: bio.id,
			type: 'bio'
		}
	}))}
	class="relative w-100">
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
						let column = pageStuff.content[rowIndex].columns.findIndex((e) => e.id === bio.id);
						pageStuff.content[rowIndex].columns.splice(column, 1);
					}
				}
			}}
			variant="destructive"
			class="drag-handle absolute top-1 right-1">
			Del
		</Button>
	{/if}
	<Card.Header>
		<Card.Title>
			{#if editMode}
				<input
					title="title"
					class="rounded bg-card p-1"
					placeholder="title"
					bind:value={bio.title} />
			{:else}
				{bio.title}
			{/if}
		</Card.Title>
		<Separator></Separator>
	</Card.Header>
	<Card.Content>
		<img class="w-full" src={bio.image} alt={bio.title} />

		{#if editMode}
			Image Url:
			<input
				title="bio image url"
				class="rounded bg-card p-1"
				placeholder="bio image url"
				bind:value={bio.image} />
		{/if}
		{#if editMode}
			<input title="name" class="rounded bg-card p-1" placeholder="name" bind:value={bio.name} />
		{:else}
			{bio.name}
		{/if}
		Email:
		{#if editMode}
			<input title="email" class="rounded bg-card p-1" placeholder="email" bind:value={bio.email} />
		{:else}
			{bio.email}
		{/if}
		Bio:
		<Card.Description>
			<Editor bind:content={bio.bio} editable={editMode} />
		</Card.Description>
	</Card.Content>
</Card.Root>
