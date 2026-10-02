<script lang="ts">
	import FormElement from '#lib/components/FormElement.svelte';
	import Button from '#lib/components/ui/button/button.svelte';
	import * as Card from '#lib/components/ui/card';
	import { Separator } from '#lib/components/ui/separator';
	import { page } from '$app/state';
	import { Swal2 } from '#lib/utils';
	import {
		addLeader,
		deleteTrip,
		getLeaders,
		getTripLeader,
		removeLeader,
		updateFormElements,
		updateTrip
	} from '../../../query/trips.remote';
	import DraggableList from '#lib/components/draggableList/DraggableList.svelte';
	import { CheckIcon, ChevronsUpDownIcon, GripVertical } from 'lucide-svelte';
	import { cn } from '#lib/utils';
	import * as Select from '#lib/components/ui/select/index.js';
	import Input from '#lib/components/ui/input/input.svelte';
	import * as Popover from '#lib/components/ui/popover';
	import * as Command from '#lib/components/ui/command/';
	import { tick } from 'svelte';
	import DateTimePicker from '#lib/components/DateTimePicker.svelte';
	import { fromDate, getLocalTimeZone } from '@internationalized/date';
	import { Badge } from '#lib/components/ui/badge';
	import ActionWrapper from '#lib/components/ActionWrapper.svelte';
	import { goto } from '$app/navigation';
	import * as ToggleGroup from '#lib/components/ui/toggle-group/';
	import Editor from '#lib/components/textEditor/Editor.svelte';

	let tripPromise = $derived(getTripLeader({ id: page.params.id ?? '' }));
	let leadersPromise = $derived(getLeaders());
	let leaders = $derived(leadersPromise.current);
	$inspect(leaders);
	let trip = $derived.by(() => {
		let temp = $state(tripPromise.current);

		return temp;
	});
	let formElements = $derived.by(() => {
		let proxified = $state(trip?.formElements ?? []);
		return proxified;
	});
	let activityOpen = $state(false);
	let triggerRef: HTMLButtonElement | null = $state(null);
	let activities = [
		'Kayaking',
		'Backpacking',
		'Caving',
		'Rock Climbing',
		'Bouldering',
		'Rafting',
		'Canoeing',
		'Ice Climbing',
		'XC Skiing',
		'Winter mountaineering',
		'Hammocking'
	];
	let rect: HTMLDivElement | null = $state(null);
	function closeAndFocusTrigger() {
		activityOpen = false;
		tick().then(() => {
			triggerRef?.focus();
		});
	}
</script>

<div class="flex flex-col items-center justify-center" bind:this={rect}>
	{#if trip}
		<Card.Root class="w-[98%] p-4 lg:w-[80%]">
			<div class="flex items-center justify-center">
				<ToggleGroup.Root class="w-80" type="single" value="a">
					<ToggleGroup.Item class="flex-1" value="a">Trip</ToggleGroup.Item>
					<ToggleGroup.Item
						class="flex-1"
						onclick={() => goto('/manage/trips/' + trip.id + '/participants')}
						value="b">
						Participants
					</ToggleGroup.Item>
				</ToggleGroup.Root>
			</div>
			<Card.Header>
				<Card.Title>
					Title <Input bind:value={trip.title} />
				</Card.Title>
				<Card.Action>
					<ActionWrapper
						onclick={async () => {
							const confirm = await Swal2.fire({
								title: 'Delete Trip',
								text: 'Are you sure you want to delete this trip?',
								icon: 'warning',
								showCancelButton: true,
								confirmButtonText: 'Delete',
								cancelButtonText: 'Cancel'
							});
							if (!confirm.isConfirmed) return;
							let result = await deleteTrip({ id: trip.id ?? '' });
							if (result) {
								Swal2.fire('Success', 'Trip deleted successfully', 'success');
								goto('/manage/trips');
							}
						}}>
						{#snippet children({ props, spinnerIcon })}
							<Button {...props} variant="destructive">{@render spinnerIcon()}Delete Trip</Button>
						{/snippet}
					</ActionWrapper>
				</Card.Action>
			</Card.Header>
			<Card.Content>
				Activity <Popover.Root bind:open={activityOpen}>
					<Popover.Trigger bind:ref={triggerRef}>
						{#snippet child({ props })}
							<Button variant="outline" class="w-50 justify-between" {...props} role="combobox">
								{trip.activity || 'Select an Activity'}
								<ChevronsUpDownIcon class="ms-2 size-4 shrink-0 opacity-50" />
							</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class="w-50 p-0">
						<Command.Root>
							<Command.Input placeholder="Search Activity..." />
							<Command.List>
								<Command.Empty>No activity found.</Command.Empty>
								<Command.Group>
									{#each activities as activity, i (i)}
										<Command.Item
											value={activity}
											onSelect={() => {
												trip.activity = activity;
												closeAndFocusTrigger();
											}}>
											<CheckIcon
												class={cn(
													'me-2 size-4',
													trip.activity !== activity && 'text-transparent'
												)} />
											{activity}
										</Command.Item>
									{/each}
									<Command.Item
										onSelect={async () => {
											closeAndFocusTrigger();
											let result = await Swal2.fire({
												title: 'Custom Activity',
												input: 'text',
												inputPlaceholder: 'Enter custom activity...',
												showCancelButton: true,
												confirmButtonText: 'Save',
												cancelButtonText: 'Cancel'
											});
											if (result.isConfirmed) {
												trip.activity = result.value;
											}
										}}>
										Custom
									</Command.Item>
								</Command.Group>
							</Command.List>
						</Command.Root>
					</Popover.Content>
				</Popover.Root>
				Description:
				<Editor editable={true} bind:content={trip.description} />
				<DateTimePicker
					bind:value={
						() => fromDate(trip.time ?? new Date(), getLocalTimeZone()),
						(e) => (trip.time = e.toDate())
					} />
				<ActionWrapper
					onclick={async () => {
						let result = await updateTrip({
							id: trip.id ?? '',
							title: trip.title ?? '',
							activity: trip.activity ?? '',
							description: trip.description ?? '',
							time: trip.time ?? new Date()
						});
						if (result) {
							Swal2.fire('Success', 'Trip updated successfully', 'success');
						} else {
							Swal2.fire('Error', 'Failed to update trip', 'error');
						}
					}}>
					{#snippet children({ props, spinnerIcon })}
						<Button {...props}>{@render spinnerIcon()}Save Trip Info</Button>
					{/snippet}
				</ActionWrapper>
				<div class="flex gap-2">
					<p class="pr-1 font-bold">Leaders:</p>
					{#each trip.leaders as leader, index (index)}
						<Badge>
							{leader.users.name}
							<ActionWrapper
								onclick={async () => {
									let res = await Swal2.fire({
										title: 'Remove Leader',
										text: 'Are you sure you want to remove this leader?',
										icon: 'warning',
										showCancelButton: true,
										confirmButtonText: 'Remove'
									});
									if (res.isConfirmed) {
										let res2 = await removeLeader({
											tripId: trip.id ?? '',
											userId: leader.users.id
										});
										if (!res2) {
											Swal2.fire('Error', 'Failed to remove leader', 'error');
											return;
										}
										tripPromise.refresh();
									}
								}}>
								{#snippet children({ props, spinnerIcon })}
									<Button class="rounded-full" variant="destructive" {...props}>
										{@render spinnerIcon()}-
									</Button>
								{/snippet}
							</ActionWrapper>
						</Badge>
					{/each}
					<ActionWrapper
						onclick={async () => {
							let res = await Swal2.fire({
								title: 'Add Leader',
								input: 'select',
								confirmButtonText: 'Add user',
								showCancelButton: true,
								showCloseButton: true,
								inputOptions: {
									...leaders?.reduce((acc, leader) => ({ ...acc, [leader.id]: leader.name }), {})
								}
							});
							if (res.isConfirmed) {
								let res2 = await addLeader({ userId: res.value, tripId: trip.id ?? '' });
								if (!res2) {
									Swal2.fire({
										title: 'Error',
										text: 'Failed to add leader',
										icon: 'error'
									});
									return;
								}
								tripPromise.refresh();
							}
						}}>
						{#snippet children({ props, spinnerIcon })}
							<Button
								{...props}
								size="xs"
								class="cursor-pointer bg-primary text-primary-foreground">
								{@render spinnerIcon()}
								+ Add Leader
							</Button>
						{/snippet}
					</ActionWrapper>
				</div>
				<Separator />
				<h2 class="text-2xl">Sign Up Form</h2>
				<DraggableList
					items={formElements}
					handelOffest={-60}
					width={(rect?.getBoundingClientRect().width ?? 100) * 0.98}>
					{#snippet card({ cardProps, handelProps, index })}
						<Card.Root {...cardProps} class={cn('relative flex', cardProps.class)}>
							<GripVertical
								{...handelProps}
								class={cn(
									'absolute top-[50%] left-0 mr-1 translate-y-[-50%]',
									handelProps.class
								)} />
							<Card.Header>
								<FormElement response={null} editMode bind:element={formElements[index]} />
								<Card.Action>
									<Select.Root
										value={formElements[index].type}
										onValueChange={(type) => {
											if (type === 'radio' || type === 'checkbox') {
												formElements[index] = {
													id: formElements[index].id,
													order: formElements[index].order,
													label: formElements[index].label,
													required: formElements[index].required,
													type: type as
														'text' | 'number' | 'date' | 'textarea' | 'radio' | 'checkbox',
													//@ts-expect-error dumb
													options: formElements[index]?.options ?? []
												};
											} else {
												formElements[index] = {
													type: type as 'text' | 'number' | 'date' | 'textarea',
													id: formElements[index].id,
													order: formElements[index].order,
													label: formElements[index].label,
													required: formElements[index].required
												};
											}
										}}
										type="single">
										<Select.Trigger class="w-45">
											<Select.Value placeholder="Select type" />
										</Select.Trigger>
										<Select.Content>
											<Select.Item value="text">Text</Select.Item>
											<Select.Item value="number">Number</Select.Item>
											<Select.Item value="date">Date</Select.Item>
											<Select.Item value="textarea">Textarea</Select.Item>
											<Select.Item value="radio">Radio Buttons</Select.Item>
											<Select.Item value="checkbox">Checkboxes</Select.Item>
										</Select.Content>
									</Select.Root>
									<Button
										class="mt-2 w-full"
										variant="destructive"
										onclick={() => formElements.splice(index, 1)}>
										Delete
									</Button>
								</Card.Action>
							</Card.Header>
							<Card.Content></Card.Content>
						</Card.Root>
					{/snippet}
				</DraggableList>
				{#if formElements.length === 0}
					<Card.Root class="w-full border border-dashed! ring-0">
						<Card.Content>
							<p>No form elements have been created.</p>
						</Card.Content>
					</Card.Root>
				{/if}
				<Card.Root class={cn('relative flex')}>
					<Card.Header><Card.Title>Add a new form element</Card.Title></Card.Header>
					<Card.Content>
						<Button
							onclick={() =>
								formElements.push({
									id: Math.random(),
									order: formElements.length,
									type: 'text',
									label: '',
									required: false
								})}>
							Add New Element
						</Button>
					</Card.Content>
				</Card.Root>
				<ActionWrapper
					onclick={async () => {
						const uniqueValues = new Set(formElements.map((obj) => obj.label));
						if (uniqueValues.size < formElements.length) {
							Swal2.fire(
								'Warning',
								"You can't have multiple form elements with the same label.",
								'warning'
							);
							return;
						}
						let result = await updateFormElements({ id: trip.id ?? '', formElements });
						if (result) {
							Swal2.fire('Success', 'Form elements updated successfully', 'success');
						} else {
							Swal2.fire('Error', 'Failed to update form elements', 'error');
						}
					}}>
					{#snippet children({ props, spinnerIcon })}
						<Button {...props}>{@render spinnerIcon()}Save Form</Button>
					{/snippet}
				</ActionWrapper>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
