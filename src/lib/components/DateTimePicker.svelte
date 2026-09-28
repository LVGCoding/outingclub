<script lang="ts">
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { getLocalTimeZone } from '@internationalized/date';
	import * as Popover from '#lib/components/ui/popover/';
	import Calendar from '#lib/components/ui/calendar/calendar.svelte';
	import { Button } from '#lib/components/ui/button/';
	import { Input } from '#lib/components/ui/input/';
	import { Label } from '#lib/components/ui/label/';
	import type { CalendarDate, ZonedDateTime } from '@internationalized/date';

	const id = $props.id();

	let { value = $bindable() }: { value: ZonedDateTime | undefined } = $props();

	let open = $state(false);
</script>

<div class="flex gap-4">
	<div class="flex flex-col gap-3">
		<Label for="{id}-date" class="px-1">Date</Label>
		<Popover.Root bind:open>
			<Popover.Trigger id="{id}-date">
				{#snippet child({ props })}
					<Button {...props} variant="outline" class="w-32 justify-between font-normal">
						{value ? value.toDate().toLocaleDateString() : 'Select date'}
						<ChevronDownIcon />
					</Button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content class="w-auto overflow-hidden p-0" align="start">
				<Calendar
					type="single"
					bind:value
					onValueChange={() => {
						open = false;
					}}
					captionLayout="dropdown" />
			</Popover.Content>
		</Popover.Root>
	</div>
	<div class="flex flex-col gap-3">
		<Label for="{id}-time" class="px-1">Time</Label>
		<Input
			type="time"
			id="{id}-time"
			step="1"
			onblur={(e) => {
				console.log(e.currentTarget.value);
				const [hour, minute] = e.currentTarget.value.split(':');
				if (!value) return;
				value = value.set({ hour: parseInt(hour), minute: parseInt(minute) });
			}}
			value={String(value?.hour).padStart(2, '0') + ':' + String(value?.minute).padStart(2, '0')}
			class="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none" />
	</div>
</div>
