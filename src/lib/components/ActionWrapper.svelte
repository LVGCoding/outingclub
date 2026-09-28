<script lang="ts">
	import { Spinner } from './ui/spinner';
	import type { Snippet } from 'svelte';
	import { Swal2 } from '#lib/utils';

	type prop = {
		onclick: (e: MouseEvent) => Promise<void>;
		keyBinding?: { key: string; ctrl: boolean; shift: boolean };
		icon?: string;
		disabled?: boolean;
		children: Snippet<[{ spinnerIcon: Snippet<[]>; props: Record<string, unknown> }]>;
	};

	let props: prop = $props();
	let runningAction = $state(false);

	const click = async (e: MouseEvent) => {
		if (!runningAction) {
			runningAction = true;
			try {
				await props.onclick(e);
			} catch (err) {
				console.error(err);
				Swal2.fire({
					title: 'Error',
					text: 'This action failed. Please try again later.',
					icon: 'error'
				});
			} finally {
				runningAction = false;
			}
		}
	};
</script>

<svelte:document
	onkeydown={(e) => {
		if (
			!runningAction &&
			props.keyBinding &&
			e.key === props.keyBinding.key &&
			e.ctrlKey == props.keyBinding.ctrl &&
			e.shiftKey == props.keyBinding.shift
		) {
			e.preventDefault();
			click(e as unknown as MouseEvent);
		}
	}}></svelte:document>

{#snippet spinnerIcon()}
	{#if runningAction}
		<Spinner />
	{:else if props.icon}
		<i class={props.icon}></i>
	{/if}
{/snippet}

{@render props.children({
	spinnerIcon,
	props: { disabled: props.disabled || runningAction, onclick: click }
})}
<!--
{#if props.as === 'card'}
	<Card {...props} onclick={click}>
		{#if props.children}
			{@render props.children()}
		{/if}
		{#if runningAction}
			<Spinner />
		{/if}
	</Card>
{:else if props.as === 'ContextMenu'}
	<ContextMenu.Item {...props} disabled={props.disabled || runningAction} onclick={click}>
		{#if props.children}
			{@render props.children()}
		{/if}
		{#if runningAction}
			<Spinner />
		{/if}
	</ContextMenu.Item>
{:else if props.as === 'Dropdown'}
	<DropdownMenu.Item {...props} disabled={props.disabled || runningAction} onclick={click}>
		{#if props.icon}
			{#if runningAction}
				<Spinner />
			{:else}
				<i class={props.icon}></i>
			{/if}
		{:else if runningAction}
			<Spinner />
		{/if}
		{#if props.children}
			{@render props.children()}
		{/if}
	</DropdownMenu.Item>
{:else}
	<Button {...props} disabled={props.disabled || runningAction} onclick={click}>
		{#if props.icon}
			{#if runningAction}
				<Spinner />
			{:else}
				<i class={props.icon}></i>
			{/if}
		{:else if runningAction}
			<Spinner />
		{/if}
		{#if props.children}
			{@render props.children()}
		{/if}
	</Button>
{/if} -->
