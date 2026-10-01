<script lang="ts">
	import { attachDraggable } from '@thisux/sveltednd';
	import Editor from '../textEditor/Editor.svelte';
	import * as Card from '../ui/card';
	import Separator from '../ui/separator/separator.svelte';
	import { type BioT } from './Page.svelte';
	import { GripVertical } from 'lucide-svelte';
	import LexicalRenderer from '../textEditor/LexicalRenderer.svelte';
	let {
		bio = $bindable(),
		editMode,
		rowIndex,
		props
	}: { bio: BioT; editMode: boolean; rowIndex: number; props: Record<string, unknown> } = $props();
</script>

<Card.Root
	{...props}
	class="relative max-w-90 py-0"
	{@attach attachDraggable(() => ({
		container: 'item row:' + rowIndex.toString(),
		handle: '.drag-handle-item',
		containerGroup: 'item',
		disabled: !editMode,
		dragData: {
			id: bio.id,
			type: 'bio'
		}
	}))}>
	{#if editMode}
		<GripVertical class="drag-handle-item absolute top-1 left-1" />
	{/if}
	<div style="border-color: royalblue;" class="flex h-full w-full flex-col border-l-5 p-6">
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
				<input
					title="email"
					class="rounded bg-card p-1"
					placeholder="email"
					bind:value={bio.email} />
			{:else}
				{bio.email}
			{/if}
			Bio:
			{#if editMode}
				<Card.Description>
					<Editor bind:content={bio.bio} editable={editMode} />
				</Card.Description>
			{:else}
				<Card.Description>
					<LexicalRenderer content={bio.bio} />
				</Card.Description>
			{/if}
		</Card.Content>
	</div>
</Card.Root>
