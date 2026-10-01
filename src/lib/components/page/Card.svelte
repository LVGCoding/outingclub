<script lang="ts">
	import { attachDraggable } from '@thisux/sveltednd';
	import Editor from '../textEditor/Editor.svelte';
	import Badge from '../ui/badge/badge.svelte';
	import * as Card from '../ui/card';
	import Input from '../ui/input/input.svelte';
	import { Label } from '../ui/label';
	import Separator from '../ui/separator/separator.svelte';
	import { type CardT } from './Page.svelte';
	import { GripVertical } from 'lucide-svelte';
	import { cn } from '#lib/utils';
	import { Switch } from '../ui/switch';
	import LexicalRenderer from '../textEditor/LexicalRenderer.svelte';
	let {
		card = $bindable(),
		editMode,
		rowIndex,
		props
	}: {
		card: CardT;
		editMode: boolean;
		rowIndex: number;
		props: Record<string, unknown>;
	} = $props();
</script>

<Card.Root
	{...props}
	style={card.shrink
		? 'flex: 0 0 auto; min-width: ' + card.minWidth + 'rem; max-width: 100%;'
		: 'flex: 1 1 300px;'}
	class={cn('relative min-w-80 bg-card/95 p-0', {})}
	{@attach attachDraggable(() => ({
		container: 'item row:' + rowIndex.toString(),
		handle: '.drag-handle-item',
		containerGroup: 'item',
		disabled: !editMode,
		dragData: {
			id: card.id,
			type: 'card'
		}
	}))}>
	{#if editMode}
		<GripVertical class="drag-handle-item absolute top-1 left-1" />
	{/if}
	<div style="border-color: {card.color};" class="flex h-full w-full flex-col border-l-4 p-6">
		{#if editMode || card.title || card.badge}
			<Card.Header class="">
				<Card.Title class="text-2xl">
					{#if editMode}
						<input
							title="title"
							class="rounded bg-card p-1"
							placeholder="title"
							bind:value={card.title} />
						<div class="flex items-center space-x-2">
							<Switch bind:checked={card.shrink} id="shrink" />
							<Label for="shrink">Shrink</Label>
						</div>
						{#if card.shrink}
							<input
								title="minWidth"
								class="rounded bg-card p-1"
								placeholder="minWidth"
								bind:value={card.minWidth} />
						{/if}
					{:else}
						{card.title}
					{/if}
				</Card.Title>
				{#if card.badge || editMode}
					<Card.Action>
						<Badge
							style={card.badge
								? 'background-color: rgb(51, 102, 51);'
								: 'background-color: transparent'}
							class="mb-1 h-auto rounded px-5 text-lg text-white">
							{#if editMode}
								<input
									title="Badge"
									size="1"
									class="w-auto rounded border bg-transparent p-1"
									placeholder="Badge"
									bind:value={card.badge} />
							{:else if card.badge}
								{card.badge}
							{/if}
						</Badge>
					</Card.Action>
				{/if}
			</Card.Header>
		{/if}
		<Card.Content>
			{#if editMode || card.title || card.badge}
				<Separator></Separator>
			{/if}
			{#if editMode}
				<Label>Side Color: <Input type="color" bind:value={card.color} /></Label>
				<Editor bind:content={card.content} editable={editMode} />
			{:else}
				<LexicalRenderer content={card.content} />
			{/if}
		</Card.Content>
	</div>
</Card.Root>
