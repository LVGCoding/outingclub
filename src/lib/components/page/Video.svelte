<script lang="ts">
	import { attachDraggable } from '@thisux/sveltednd';
	import Input from '../ui/input/input.svelte';
	import { Label } from '../ui/label';
	import { GripVertical } from 'lucide-svelte';
	import * as Card from '../ui/card';
	import { type VideoT } from './Page.svelte';
	let {
		video = $bindable(),
		editMode,
		rowIndex,
		props
	}: {
		video: VideoT;
		editMode: boolean;
		rowIndex: number;
		props: Record<string, unknown>;
	} = $props();
</script>

{#if editMode}
	<Card.Root
		{...props}
		class="relative "
		style="flex: 1 1 300px;"
		{@attach attachDraggable(() => ({
			container: 'item row:' + rowIndex.toString(),
			handle: '.drag-handle-item',
			containerGroup: 'item',
			disabled: !editMode,
			dragData: {
				id: video.id,
				type: 'card'
			}
		}))}>
		{#if editMode}
			<GripVertical class="drag-handle-item absolute top-1 left-1 bg-black" />
		{/if}<Card.Header>
			<Card.Title><Label>Title: <Input bind:value={video.title} /></Label></Card.Title>
		</Card.Header>
		<Card.Content>
			{#key video.src}
				<video controls>
					<source src={video.src} />

					Download the
					<a href={video.src}>Video</a>
				</video>
			{/key}
			<Label>Video url: <Input bind:value={video.src} /></Label>
		</Card.Content>
	</Card.Root>
{:else}
	<Card.Root>
		<Card.Header><Card.Title>{video.title}</Card.Title></Card.Header>
		<Card.Content>
			<video controls width="250">
				<source src={video.src} />

				Download the
				<a href={video.src}>Video</a>
			</video>
		</Card.Content>
	</Card.Root>
{/if}
