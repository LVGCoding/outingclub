<script lang="ts">
	import { getEditor } from 'svelte-lexical';
	import { $getNodeByKey as getNodeByKey } from 'lexical';
	import type { ImageNode, ImageWrapMode, Size } from './ImageNode';
	import { Button } from '#lib/components/ui/button';
	import * as Popover from '#lib/components/ui/popover';
	import * as Field from '#lib/components/ui/field';
	import { Input } from '#lib/components/ui/input';
	import { cn } from 'tailwind-variants';
	import Label from '#lib/components/ui/label/label.svelte';
	import * as RadioGroup from '../../ui/radio-group';

	let props: { caption: string; url: string; wrapMode: ImageWrapMode; size: Size; key: string } =
		$props();
	const editor = getEditor();
	let open: boolean = $state(false);
	let url: string = $derived(props.url);
	let caption: string = $derived(props.caption);
	let wrapMode: ImageWrapMode = $derived(props.wrapMode);
	let size: Size = $derived(props.size);
	function save() {
		editor.update(() => {
			const node = getNodeByKey(props.key) as ImageNode | null;
			if (node) {
				node.setData(url, caption, wrapMode, size);
			}
		});
		open = false;
	}

	$effect(() => {
		if (size.width === -1 || size.height === -1) {
			const img = document.createElement('img');
			img.src = url;
			img.addEventListener('load', () => {
				if (img.width > 300 || img.height > 300) {
					const max = 300 / Math.max(img.width, img.height);
					size = { width: img.width * max, height: img.height * max };
				} else size = { width: img.width, height: img.height };
				save();
			});
			img.addEventListener('error', () => {
				size = { width: 514, height: 233 };
				save();
			});
		}
	});

	let resizing: boolean = $state(false);
	let startX: number = 0;
	let startY: number = 0;
	let startWidth: number = 0;
	let startHeight: number = 0;
	let shift = $state(false);

	function startResize(event: PointerEvent) {
		event.preventDefault();
		event.stopPropagation();

		resizing = true;

		startX = event.clientX;
		startY = event.clientY;
		startWidth = size.width;
		startHeight = size.height;

		window.addEventListener('pointermove', resize);
		window.addEventListener('pointerup', stopResize);
	}

	function resize(event: PointerEvent) {
		if (!resizing) return;
		if (shift) {
			const dx = event.clientX - startX;
			const changeWidth = Math.max(50, startWidth + dx) / startWidth;
			size = {
				width: startWidth * changeWidth,
				height: startHeight * changeWidth
			};
		} else {
			const dx = event.clientX - startX;
			const dy = event.clientY - startY;

			size = {
				width: Math.max(50, startWidth + dx),
				height: Math.max(50, startHeight + dy)
			};
		}
		save();
	}

	function stopResize() {
		resizing = false;

		window.removeEventListener('pointermove', resize);
		window.removeEventListener('pointerup', stopResize);
	}
	let imageRef: HTMLImageElement | null = null;
</script>

<svelte:document
	onkeydown={(e) => {
		if (e.shiftKey) {
			shift = true;
		}
	}}
	onkeyup={() => {
		shift = false;
	}} />

<!-- <div class="image-container" style={`width: ${size.width}px; height: ${size.height}px;`}> -->

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<img
	bind:this={imageRef}
	src={props.url}
	alt={props.caption}
	onclick={() => {
		if (editor.isEditable()) {
			open = !open;
		}
	}}
	class={cn('m-2', {
		'left-image': wrapMode === 'left',
		'inline-image': wrapMode === 'inline',
		'right-image': wrapMode === 'right'
	})}
	style={`width: ${size.width}px; height: ${size.height}px;`}
	onerror={(e) => {
		if (e.target) (e.target as HTMLImageElement).src = '/logo.png';
	}}
	draggable="false" />
{#if editor.isEditable()}
	<button class="resize-handle" aria-label="Resize image" onpointerdown={startResize}></button>
{/if}
<Popover.Root bind:open>
	<Popover.Trigger disabled={!editor.isEditable()}></Popover.Trigger>
	<Popover.Content customAnchor={imageRef} side="right">
		<Field.Field class="my-2">
			<Field.Label for="name">Caption</Field.Label>
			<Input bind:value={caption} id="name" type="text" />
		</Field.Field>
		<Field.Field class="my-2">
			<Field.Label for="name">Url</Field.Label>
			<Input bind:value={url} id="name" type="text" />
		</Field.Field>
		<Field.Field class="my-2">
			<Field.Label for="name">Float mode</Field.Label>
			<RadioGroup.Root bind:value={wrapMode}>
				<div class="flex items-center space-x-2">
					<RadioGroup.Item value="left" id="r1" />
					<Label for="r1">Left</Label>
				</div>
				<div class="flex items-center space-x-2">
					<RadioGroup.Item value="inline" id="r2" />
					<Label for="r2">Inline</Label>
				</div>
				<div class="flex items-center space-x-2">
					<RadioGroup.Item value="right" id="r3" />
					<Label for="r3">Right</Label>
				</div>
			</RadioGroup.Root>
		</Field.Field>
		<Button onclick={save}>Save</Button>
	</Popover.Content>
</Popover.Root>

<!-- </div> -->

<!-- {#if !editor.isEditable()}
	<Button href={props.url} target="_blank">
		{props.caption}
	</Button>
{:else}
	<Popover.Root bind:open>
		<Popover.Trigger>
			{#snippet child({ props: cProps })}
				<Button variant="outline" {...cProps} target="_blank">
					{props.caption}
				</Button>
			{/snippet}
		</Popover.Trigger>
		<Popover.Content>
			<Field.Field class="my-2">
				<Field.Label for="name">Caption</Field.Label>
				<Input bind:value={caption} id="name" type="text" />
			</Field.Field>
			<Field.Field class="my-2">
				<Field.Label for="name">Url</Field.Label>
				<Input bind:value={url} id="name" type="text" />
			</Field.Field>
			<Button onclick={save}>Save</Button>
		</Popover.Content>
	</Popover.Root>
{/if} -->
<style>
	img {
		display: block;
	}

	.resize-handle {
		position: absolute;
		right: -5px;
		bottom: -5px;

		width: 10px;
		height: 10px;

		padding: 0;
		border: 1px solid white;
		border-radius: 2px;
		z-index: 10;

		background: royalblue;
		cursor: nwse-resize;
	}
</style>
