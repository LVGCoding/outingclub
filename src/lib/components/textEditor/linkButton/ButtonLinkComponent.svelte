<script lang="ts">
	import { getEditor } from 'svelte-lexical';
	import { $getNodeByKey as getNodeByKey } from 'lexical';
	import type { ButtonLinkNode } from './ButtonLinkNode';
	import { Button } from '#lib/components/ui/button';
	import * as Popover from '#lib/components/ui/popover';
	import * as Field from '#lib/components/ui/field';
	import { Input } from '#lib/components/ui/input';

	let props: { text: string; url: string; key: string } = $props();
	const editor = getEditor();
	let open: boolean = $state(false);
	let url: string = $derived(props.url);
	let text: string = $derived(props.text);
	function save() {
		editor.update(() => {
			const node = getNodeByKey(props.key) as ButtonLinkNode | null;
			if (node) {
				node.setData(url, text);
			}
		});
		open = false;
	}
</script>

{#if !editor.isEditable()}
	<Button href={props.url} target="_blank">
		{props.text}
	</Button>
{:else}
	<Popover.Root bind:open>
		<Popover.Trigger>
			{#snippet child({ props: cProps })}
				<Button variant="outline" {...cProps} target="_blank">
					{props.text}
				</Button>
			{/snippet}
		</Popover.Trigger>
		<Popover.Content>
			<Field.Field class="my-2">
				<Field.Label for="name">Button Text</Field.Label>
				<Input bind:value={text} id="name" type="text" />
			</Field.Field>
			<Field.Field class="my-2">
				<Field.Label for="name">Url</Field.Label>
				<Input bind:value={url} id="name" type="text" />
			</Field.Field>
			<Button onclick={save}>Save</Button>
		</Popover.Content>
	</Popover.Root>
{/if}
