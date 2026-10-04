<script lang="ts">
	import type { FileType } from '#lib/server/db/schema';
	import { getFileContext } from '../../../routes/fileState';
	import Button, { buttonVariants } from '../ui/button/button.svelte';
	import * as Card from '../ui/card';
	import * as DropdownMenu from '../ui/dropdown-menu';
	import * as Dialog from '../ui/dialog';
	import * as Field from '../ui/field';
	import { Label } from '../ui/label';
	import { Input } from '../ui/input';

	let { type }: { type: FileType } = $props();

	let files = getFileContext();
	let open = $state(false);
	let currentFile: {
		id: string;
		name: string;
		url: string;
	} | null = $state(null);
</script>

<Card.Root class="w-[98%] p-4 lg:w-[80%]">
	<Card.Header>
		<Card.Title>Manage Files ({type})</Card.Title>
		<Card.Action>
			<Button
				variant="link"
				onclick={() => {
					open = true;
					currentFile = null;
				}}>
				Add File
			</Button>
		</Card.Action>
	</Card.Header>
	<Card.Content>
		{#each files[type] as file (file.id)}
			<div class="flex gap-2">
				{file.name}: {file.url}
				<div class="grow"></div>

				<DropdownMenu.Root>
					<DropdownMenu.Trigger
						class={buttonVariants({
							variant: 'outline',
							size: 'sm'
						})}>
						...
					</DropdownMenu.Trigger>

					<DropdownMenu.Content>
						<DropdownMenu.Group>
							<DropdownMenu.Label>User Actions</DropdownMenu.Label>

							<DropdownMenu.Separator />

							<DropdownMenu.Item
								onclick={() => {
									open = true;
									currentFile = { ...file };
								}}>
								Change File
							</DropdownMenu.Item>
							<form method="POST" action="/manage/files/?/delete">
								<input type="hidden" name="id" value={file.id} />
								<DropdownMenu.Item>
									{#snippet child({ props })}
										<Button type="submit" variant="destructive" {...props}>Delete File</Button>
									{/snippet}
								</DropdownMenu.Item>
							</form>
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
		{/each}
	</Card.Content>
</Card.Root>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-sm">
		<form
			method="POST"
			action={currentFile === null ? '/manage/files/?/create' : '/manage/files/?/swap'}
			enctype="multipart/form-data">
			<Dialog.Header>
				<Dialog.Title>{currentFile !== null ? 'Edit File' : 'Create File'}</Dialog.Title>
				<Dialog.Description>Upload a file to the server.</Dialog.Description>
			</Dialog.Header>
			<Field.Group>
				{#if currentFile !== null}
					<input type="hidden" name="id" value={currentFile.id} />
				{:else}
					<input type="hidden" name="type" value={type} />
					<Field.Field>
						<Label for="name">Name</Label>
						<Input id="name" name="name" placeholder="name" />
					</Field.Field>
				{/if}
				<Field.Field>
					<Label for="file">File</Label>
					<Input type="file" id="file" name="file" required />
				</Field.Field>
			</Field.Group>
			<Dialog.Footer>
				<Dialog.Close type="button" class={buttonVariants({ variant: 'outline' })}>
					Cancel
				</Dialog.Close>
				<Button type="submit">Save changes</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
