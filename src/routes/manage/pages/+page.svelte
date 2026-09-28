<script lang="ts">
	import * as Card from '#lib/components/ui/card/';
	import type { PageProps } from './$types';
	import { createExternalPage, createInternalPage, deletePage } from '../../query/page.remote';
	import Button, { buttonVariants } from '#lib/components/ui/button/button.svelte';
	import { Swal2 } from '#lib/utils';
	import * as Dialog from '#lib/components/ui/dialog/';
	import { Label } from '#lib/components/ui/label/';
	import { Input } from '#lib/components/ui/input/';
	import { goto, invalidate } from '$app/navigation';
	import ActionWrapper from '#lib/components/ActionWrapper.svelte';

	let openExternalDialog = $state(false);
	let socialValue = $state({
		title: '',
		link: '',
		category: 'social' as 'activity' | 'club' | 'main' | 'social'
	});
	let { data }: PageProps = $props();
</script>

<div class="flex flex-col items-center justify-center gap-2">
	{#each Object.entries(data.paths) as [type, pages] (type)}
		<Card.Root class="w-[98%] lg:w-[80%]">
			<Card.Header>
				<Card.Title>
					{type[0].toUpperCase()}{type.slice(1)}
				</Card.Title>
				<Card.Action>
					<ActionWrapper
						onclick={async () => {
							if (type === 'social') {
								socialValue = { title: '', link: '', category: 'social' };
								openExternalDialog = true;
								return;
							}
							let res = await Swal2.fire({
								title: 'What type of page do you want',
								input: 'radio',
								inputOptions: {
									internal: 'Internal',
									external: 'External'
								}
							});
							if (!res.isConfirmed) return;
							if (res.value === 'external') {
								socialValue = {
									title: '',
									link: '',
									category: type as 'activity' | 'club' | 'main' | 'social'
								};
								openExternalDialog = true;
							} else {
								let res = await createInternalPage({
									category: type as 'activity' | 'club' | 'main' | 'social'
								});
								await invalidate('app:paths');
								goto(`/manage/pages/${res}`);
							}
						}}>
						{#snippet children({ spinnerIcon, props })}
							<Button {...props} variant="link">{@render spinnerIcon()} Create Page</Button>
						{/snippet}
					</ActionWrapper>
				</Card.Action>
			</Card.Header>
			<Card.Content>
				{#each pages as page (page.id)}
					<Card.Root class="p-2">
						<Card.Header>
							<Card.Title>
								{page.title}
							</Card.Title>
							<Card.Description>
								Link:
								{page.path}
							</Card.Description>
							<Card.Action>
								{#if !page.link}
									<Button href={`/manage/pages/${page.id}`} variant="link">Edit Page</Button>
								{/if}
								<ActionWrapper
									onclick={async () => {
										let res = await Swal2.fire({
											title: 'Are you sure?',
											text: 'This action cannot be undone.',
											icon: 'warning',
											showCancelButton: true,
											confirmButtonText: 'Delete',
											cancelButtonText: 'Cancel'
										});
										if (!res.isConfirmed) return;
										await deletePage({ id: page.id });
										await invalidate('app:paths');
									}}>
									{#snippet children({ spinnerIcon, props })}
										<Button {...props} variant="link">{@render spinnerIcon()} Delete Page</Button>
									{/snippet}
								</ActionWrapper>
							</Card.Action>
						</Card.Header>
					</Card.Root>
				{/each}
			</Card.Content>
		</Card.Root>
	{/each}
</div>

<Dialog.Root bind:open={openExternalDialog}>
	<Dialog.Content class="sm:max-w-106">
		<Dialog.Header>
			<Dialog.Title>Create External Link Page</Dialog.Title>
		</Dialog.Header>
		<div class="grid gap-4">
			<div class="grid gap-3">
				<Label for="title-1">Title</Label>
				<Input bind:value={socialValue.title} id="title-1" name="title" defaultValue="Youtube" />
			</div>
			<div class="grid gap-3">
				<Label for="link-1">Link (Make sure you have https://)</Label>
				<Input
					bind:value={socialValue.link}
					id="link-1"
					name="link"
					defaultValue="https://youtube.com" />
			</div>
		</div>
		<Dialog.Footer>
			<Dialog.Close type="button" class={buttonVariants({ variant: 'outline' })}>
				Cancel
			</Dialog.Close>
			<ActionWrapper
				onclick={async () => {
					await createExternalPage(socialValue);
					await invalidate('app:paths');
					openExternalDialog = false;
				}}>
				{#snippet children({ spinnerIcon, props })}
					<Button {...props} type="submit">{@render spinnerIcon()}Save changes</Button>
				{/snippet}
			</ActionWrapper>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
