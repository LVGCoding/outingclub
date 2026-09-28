<script module lang="ts">
	export type formElement =
		| {
				type: 'text' | 'textarea' | 'date' | 'number';
				label: string;
				id: number;
				order: number;
				required: boolean;
		  }
		| {
				type: 'checkbox' | 'radio';
				label: string;
				id: number;
				order: number;
				options: { value: string; order: number; id: number }[];
				required: boolean;
		  };
	export type formResponse =
		| null
		| {
				type: 'text' | 'textarea' | 'date' | 'number' | 'radio';
				label: string;
				value: string;
		  }
		| {
				type: 'number';
				label: string;
				value: string;
		  }
		| {
				type: 'checkbox';
				label: string;
				value: string[];
		  };
</script>

<script lang="ts">
	import { cn, includes } from '#lib/utils';
	import * as RadioGroup from '#lib/components/ui/radio-group';

	import Input from './ui/input/input.svelte';
	import { Label } from './ui/label';
	import Textarea from './ui/textarea/textarea.svelte';
	import { Checkbox } from './ui/checkbox';
	import { Switch } from './ui/switch';
	import DraggableList from './draggableList/DraggableList.svelte';
	import { GripVertical } from 'lucide-svelte';
	import { Button } from './ui/button';

	// eslint-disable-next-line svelte/no-unused-props
	let {
		editMode = false,
		element = $bindable(),
		response = $bindable(),
		validate = false,
		valid = $bindable(false)
	}: {
		editMode?: boolean;
		element: formElement;
		response: formResponse;
		validate?: boolean;
		valid?: boolean;
	} = $props();
	let touched = $derived(false);
</script>

<Label class="">
	{#if editMode}
		<input placeholder="title" class="rounded bg-card p-1" bind:value={element.label} />

		<Label><Switch bind:checked={element.required} />Required</Label>
	{:else}
		{element.label}
		{#if element.required}<p class="text-red-700" title="required">*</p>{/if}
	{/if}
</Label>
{#if touched && !valid && validate}
	<p class="text-red-700">This field is required</p>
{/if}
{#if element.type === 'text' || element.type === 'date' || element.type === 'number'}
	<Input
		onblur={() => (touched = true)}
		disabled={editMode}
		onchange={(e) => {
			valid = e.currentTarget.value.trim().length > 0;
			if (!includes(['text', 'date', 'number'] as const, element.type)) return;
			response = {
				label: element.label,
				type: element.type,
				value: e.currentTarget.value
			};
		}}
		value={response?.value ?? ''}
		type={element.type} />
{:else if element.type === 'textarea'}
	<Textarea
		disabled={editMode}
		onblur={() => (touched = true)}
		onchange={(e) => {
			valid = e.currentTarget.value.trim().length > 0;
			if (element.type !== 'textarea') return;
			response = {
				label: element.label,
				type: element.type,
				value: e.currentTarget.value
			};
		}}
		value={response?.value ?? ''} />
{:else if element.type === 'radio' && !Array.isArray(response?.value)}
	<RadioGroup.Root
		onValueChange={(value) => {
			if (element.type !== 'radio') return;
			valid = true;
			response = { label: element.label, type: element.type, value };
		}}
		value={response?.value ?? ''}>
		{#if editMode}
			<DraggableList bind:items={element.options}>
				{#snippet card({ cardProps, item, handelProps, index })}
					<div {...cardProps} class={cn('flex items-center space-x-2', cardProps.class)}>
						<GripVertical {...handelProps} class={cn('mr-1', handelProps.class)} />
						<RadioGroup.Item disabled={editMode} value={item.value} id={`r${cardProps.index}`} />
						<Label for={`r${cardProps.index}`}>
							<input class="rounded bg-card p-1" bind:value={item.value} />
						</Label>
						<Button
							size="xs"
							variant="outline"
							onclick={() => {
								element.options.splice(index, 1);
							}}>
							-
						</Button>
					</div>
				{/snippet}
			</DraggableList>
			<div class={cn('flex items-center space-x-2')}>
				<Button
					size="xs"
					variant="outline"
					onclick={() => {
						element.options.push({ value: '', id: Math.random(), order: element.options.length });
					}}>
					+
				</Button>
				<Label>Add Element</Label>
			</div>
		{:else}
			{#each element.options as option, i (i)}
				<div class="flex items-center space-x-2">
					<RadioGroup.Item value={option.value} id={`r${i}`} />
					<Label for={`r${i}`}>{option.value}</Label>
				</div>
			{/each}
		{/if}
	</RadioGroup.Root>
{:else if element.type === 'checkbox'}
	{#if editMode}
		<DraggableList bind:items={element.options}>
			{#snippet card({ cardProps, item, handelProps, index })}
				<div {...cardProps} class={cn('flex items-center space-x-2', cardProps.class)}>
					<GripVertical {...handelProps} class={cn('mr-1', handelProps.class)} />
					<Checkbox disabled={editMode} value={item.value} id={`r${cardProps.index}`} />
					<Label for={`r${cardProps.index}`}>
						<input class="rounded bg-card p-1" bind:value={item.value} />
					</Label>
					<Button
						size="xs"
						variant="outline"
						onclick={() => {
							element.options.splice(index, 1);
						}}>
						-
					</Button>
				</div>
			{/snippet}
		</DraggableList>
		<div class={cn('flex items-center space-x-2')}>
			<Button
				size="xs"
				variant="outline"
				onclick={() => {
					element.options.push({ value: '', id: Math.random(), order: element.options.length });
				}}>
				+
			</Button>
			<Label>Add Element</Label>
		</div>
	{:else}
		{#each element.options as option, i (i)}
			<div class="flex items-center space-x-2">
				<Checkbox
					disabled={editMode}
					checked={response?.value?.includes(option.value)}
					onCheckedChange={(e) => {
						touched = true;
						valid = true;
						if (!response) response = { label: element.label, type: 'checkbox', value: [] };
						if (element.type !== 'checkbox' || !Array.isArray(response?.value)) return;
						response.value = e
							? [...response.value, option.value]
							: response.value.filter((o) => o !== option.value);
					}}
					id={`r${i}`} />
				<Label for={`r${i}`}>{option.value}</Label>
			</div>
		{/each}
	{/if}
{/if}
