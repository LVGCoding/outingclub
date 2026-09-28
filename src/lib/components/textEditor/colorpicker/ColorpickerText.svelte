<script lang="ts">
	import * as Popover from '#lib/components/ui/popover/';
	import { $patchStyleText as patchStyleText } from '@lexical/selection';
	import { $getSelection as getSelection, HISTORIC_TAG } from 'lexical';
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';
	import ColorPicker from './ColorPicker.svelte';
	import { getActiveEditor } from 'svelte-lexical';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';

	const activeEditor = getActiveEditor();
	const fontColor = getContext<Writable<string>>('fontColor');
</script>

<Popover.Root>
	<Popover.Trigger>
		{#snippet child({ props: cProps })}
			<button
				{...cProps}
				type="button"
				aria-label="text color picker"
				class="toolbar-item color-picker">
				<p
					style:color={$fontColor === '#000' ? 'var(--color-forground)' : $fontColor}
					class="font-bold">
					A
				</p>
				<ChevronDown size={15} />
			</button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="flex flex-row justify-center">
		<ColorPicker
			color={$fontColor === '#000' ? '' : $fontColor}
			onChange={(value, skipHistoryStack) => {
				$activeEditor.update(
					() => {
						const selection = getSelection();
						if (selection !== null) {
							patchStyleText(selection, { color: value });
						}
					},
					skipHistoryStack ? { tag: HISTORIC_TAG } : {}
				);
			}}></ColorPicker>
	</Popover.Content>
</Popover.Root>
