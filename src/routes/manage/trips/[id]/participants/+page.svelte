<script lang="ts">
	import { Badge } from '#lib/components/ui/badge';
	import * as Card from '#lib/components/ui/card';
	import { Separator } from '#lib/components/ui/separator';
	import * as Select from '#lib/components/ui/select';
	import { Skeleton } from '#lib/components/ui/skeleton';
	import { toast } from 'svelte-sonner';

	import { getTripParticipants, updateParticipantStatus } from '../../../../query/trips.remote';

	import { page } from '$app/state';
	import * as ToggleGroup from '#lib/components/ui/toggle-group/';
	import { goto } from '$app/navigation';
	import ParticipantsData from '#lib/components/ParticipantsData.svelte';

	import type { ColumnDef } from '@tanstack/svelte-table';
	import type { DataTableColumnMeta } from '#lib/components/dataTable/DataTable.svelte';
	import DataTable from '#lib/components/dataTable/DataTable.svelte';

	const data = getTripParticipants({
		id: page.params.id ?? ''
	});

	type Result = NonNullable<typeof data.current>;
	type Participant = Result['participants'][number];

	type Status = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'attended' | 'no_show';

	const statusLabels: Record<Status, string> = {
		pending: 'Pending',
		accepted: 'Accepted',
		declined: 'Declined',
		cancelled: 'Cancelled',
		attended: 'Attended',
		no_show: 'No-show'
	};

	let updatingParticipant = $state<string | null>(null);

	async function changeStatus(participantId: string, status: Status) {
		updatingParticipant = participantId;

		try {
			await updateParticipantStatus({
				participantId,
				status
			});

			data.refresh();

			toast.success('Participant status updated');
		} catch (error) {
			console.error(error);
			toast.error('Failed to update participant status');
		} finally {
			updatingParticipant = null;
		}
	}

	function formatDate(date: Date | null) {
		if (!date) return 'Never';

		return new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		}).format(new Date(date));
	}

	function getInitials(name: string) {
		return name
			.split(' ')
			.map((name) => name[0])
			.join('')
			.slice(0, 2)
			.toUpperCase();
	}

	function getClassName(yearJoined: number) {
		const now = new Date();

		const schoolYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;

		if (schoolYear < 0) {
			return 'Grad Student';
		}

		switch (schoolYear - yearJoined) {
			case 0:
				return 'Freshman';
			case 1:
				return 'Sophomore';
			case 2:
				return 'Junior';
			case 3:
				return 'Senior';
			default:
				return 'Senior+';
		}
	}

	function formatFormValue(value: string | string[]) {
		return Array.isArray(value) ? value.join(', ') : value;
	}

	const columns: ColumnDef<any, Participant>[] = [
		{
			id: 'participant',
			header: 'Participant',

			accessorFn: (participant: Participant) => participant.user.name,

			cell: ({ row }) => {
				const participant = row.original;

				return {
					participant
				};
			},

			filterFn: (row, _columnId, value) => {
				if (!value) return true;

				const search = String(value).toLowerCase();

				return (
					row.original.user.name.toLowerCase().includes(search) ||
					row.original.user.email.toLowerCase().includes(search)
				);
			},

			meta: {
				filter: 'text',
				filterPlaceholder: 'Search name or email'
			} satisfies DataTableColumnMeta
		},

		{
			id: 'trips',
			header: 'Trips',

			accessorFn: (participant: Participant) => participant.history.totalTrips,

			cell: ({ row }) => row.original.history.totalTrips
		},

		{
			id: 'activityTrips',
			header: 'Activity trips',

			accessorFn: (participant: Participant) => participant.history.currentActivityTrips,

			cell: ({ row }) => row.original.history.currentActivityTrips
		},

		{
			id: 'noShows',
			header: 'No-shows',

			accessorFn: (participant: Participant) => participant.history.noShowTrips,

			cell: ({ row }) => row.original.history.noShowTrips
		},

		{
			id: 'cancellations',
			header: 'Cancellations',

			accessorFn: (participant: Participant) => participant.history.cancelledTrips,

			cell: ({ row }) => row.original.history.cancelledTrips
		},

		{
			id: 'status',
			header: 'Status',

			accessorFn: (participant: Participant) => participant.signup.status,

			cell: ({ row }) => {
				const participant = row.original;

				return {
					participant
				};
			},

			filterFn: (row, columnId, value) => {
				if (!value || value.length === 0) {
					return true;
				}

				const status = row.getValue<Status>(columnId);

				if (Array.isArray(value)) {
					return value.includes(status);
				}

				return status === value;
			},

			meta: {
				filter: 'select',
				filterPlaceholder: 'Any status',
				filterOptions: [
					{
						label: 'Pending',
						value: 'pending'
					},
					{
						label: 'Accepted',
						value: 'accepted'
					},
					{
						label: 'Attended',
						value: 'attended'
					},
					{
						label: 'No-show',
						value: 'no_show'
					},
					{
						label: 'Cancelled',
						value: 'cancelled'
					},
					{
						label: 'Declined',
						value: 'declined'
					}
				]
			} satisfies DataTableColumnMeta
		}
	];

	function ParticipantCell({ participant }: { participant: Participant }) {
		return;
	}
</script>

```svelte

<div class="flex flex-col items-center justify-center gap-2">
	{#await data}
		<Card.Root class="w-[98%] lg:w-[80%]">
			<Card.Header>
				<Skeleton class="h-6 w-48" />
			</Card.Header>

			<Card.Content class="space-y-4">
				{#each Array(5), i (i)}
					<div class="flex items-center gap-4">
						<Skeleton class="h-10 w-10 rounded-full" />

						<div class="space-y-2">
							<Skeleton class="h-4 w-32" />
							<Skeleton class="h-3 w-24" />
						</div>
					</div>
				{/each}
			</Card.Content>
		</Card.Root>
	{:then result}
		<Card.Root class="w-[98%] p-4 lg:w-[80%]">
			<Card.Header>
				<div class="flex items-center justify-center">
					<ToggleGroup.Root class="w-80" type="single" value="b">
						<ToggleGroup.Item
							onclick={() => goto('/manage/trips/' + page.params.id)}
							class="flex-1"
							value="a">
							Trip
						</ToggleGroup.Item>

						<ToggleGroup.Item class="flex-1" value="b">Participants</ToggleGroup.Item>
					</ToggleGroup.Root>
				</div>

				<div class="flex items-center justify-between gap-4">
					<div>
						<Card.Title>Participants</Card.Title>

						<p class="mt-1 text-sm text-muted-foreground">
							{result.participants.length}
							{result.participants.length === 1 ? 'participant' : 'participants'}
						</p>
					</div>

					<div class="text-sm text-muted-foreground">
						{result.trip.activity}
					</div>
				</div>
			</Card.Header>

			<Card.Content class="p-0">
				{#if result.participants.length === 0}
					<Card.Root class="m-8 w-full border border-dashed! ring-0">
						<Card.Content>
							<p>No participants have signed up yet.</p>
						</Card.Content>
					</Card.Root>
				{:else}
					<DataTable
						data={result.participants}
						{columns}
						expandable
						pageSize={25}
						emptyMessage="No participants match your filters.">
						{#snippet expandedRow({ row })}
							{@const participant = row.original}

							<div class="space-y-5">
								<div class="grid gap-6 md:grid-cols-3">
									<!-- Contact -->
									<div>
										<h4 class="mb-3 text-sm font-medium">Contact</h4>

										<div class="space-y-1 text-sm">
											<div>
												{participant.user.email}
											</div>

											<div class="text-muted-foreground">
												{participant.user.phoneNumber}
											</div>

											<div class="text-muted-foreground">
												Member since
												{participant.user.yearJoined}
												·
												{getClassName(participant.user.yearJoined)}
											</div>
										</div>
									</div>

									<!-- History -->
									<div>
										<h4 class="mb-3 text-sm font-medium">Trip history</h4>

										<div class="space-y-1 text-sm">
											<div>
												<strong>
													{participant.history.totalTrips}
												</strong>
												attended
											</div>

											<div>
												<strong>
													{participant.history.currentActivityTrips}
												</strong>
												{result.trip.activity}
												{participant.history.currentActivityTrips === 1 ? ' trip' : ' trips'}
											</div>

											<div class="text-muted-foreground">
												First trip:
												{formatDate(participant.history.firstTrip)}
											</div>

											<div class="text-muted-foreground">
												Last trip:
												{formatDate(participant.history.lastTrip)}
											</div>
										</div>
									</div>

									<!-- Reliability -->
									<div>
										<h4 class="mb-3 text-sm font-medium">Reliability</h4>

										<div class="space-y-1 text-sm">
											<div>
												<span class="font-medium">
													{participant.history.cancelledTrips}
												</span>

												{participant.history.cancelledTrips === 1
													? ' cancellation'
													: ' cancellations'}
											</div>

											<div>
												<span class="font-medium">
													{participant.history.noShowTrips}
												</span>

												{participant.history.noShowTrips === 1 ? ' no-show' : ' no-shows'}
											</div>
										</div>
									</div>
								</div>

								<!-- Activity breakdown -->
								{#if participant.history.activityCounts.length > 0}
									<Separator />

									<div>
										<h4 class="mb-3 text-sm font-medium">Activities</h4>

										<div class="flex flex-wrap gap-2">
											{#each participant.history.activityCounts as activity (activity.activity)}
												<Badge variant="outline">
													{activity.activity}

													<span class="ml-1 text-muted-foreground">
														× {activity.count}
													</span>
												</Badge>
											{/each}
										</div>
									</div>
								{/if}

								<!-- Leader notes -->
								{#if participant.user.notes}
									<Separator />

									<div>
										<h4 class="mb-2 text-sm font-medium">Leader notes</h4>

										<p class="text-sm whitespace-pre-wrap text-muted-foreground">
											{participant.user.notes}
										</p>
									</div>
								{/if}

								<!-- Signup information -->
								{#if participant.signup.formData?.length}
									<Separator />

									<div>
										<h4 class="mb-3 text-sm font-medium">Sign-up information</h4>

										<div class="grid gap-x-8 gap-y-3 sm:grid-cols-2">
											{#each participant.signup.formData as response, i (i)}
												{#if response}
													<div class="min-w-0 text-sm">
														<div class="font-medium">
															{response.label}
														</div>

														<div class="mt-0.5 whitespace-pre-wrap text-muted-foreground">
															{formatFormValue(response.value)}
														</div>
													</div>
												{/if}
											{/each}
										</div>
									</div>
								{/if}
							</div>
						{/snippet}

						<!-- Override the default cell rendering for the participant
						     and status columns. -->
						{#snippet cell({ cell })}
							{@const participant = cell.row.original}

							{#if cell.column.id === 'participant'}
								<div class="flex min-w-0 items-center gap-3">
									<div
										class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
										{#if participant.user.image}
											<img
												src={participant.user.image}
												alt={participant.user.name}
												class="h-full w-full object-cover" />
										{:else}
											<span class="text-sm font-medium">
												{getInitials(participant.user.name)}
											</span>
										{/if}
									</div>

									<div class="min-w-0">
										<div class="flex items-center gap-2">
											<span class="truncate font-medium">
												{participant.user.name}
											</span>

											{#if participant.isNewToActivity}
												<Badge variant="secondary" class="hidden sm:inline-flex">
													New to {result.trip.activity}
												</Badge>
											{/if}
										</div>

										<div class="truncate text-sm text-muted-foreground">
											{participant.user.email}
										</div>
									</div>
								</div>
							{:else if cell.column.id === 'status'}
								<div onclick={(event) => event.stopPropagation()}>
									<Select.Root
										type="single"
										value={participant.signup.status}
										onValueChange={(value) => changeStatus(participant.id, value as Status)}>
										<Select.Trigger
											class="w-32.5"
											disabled={updatingParticipant === participant.id}>
											<Select.Value>
												{statusLabels[participant.signup.status]}
											</Select.Value>
										</Select.Trigger>

										<Select.Content>
											<Select.Item value="pending">Pending</Select.Item>

											<Select.Item value="accepted">Accepted</Select.Item>

											<Select.Item value="attended">Attended</Select.Item>

											<Select.Item value="no_show">No-show</Select.Item>

											<Select.Item value="cancelled">Cancelled</Select.Item>

											<Select.Item value="declined">Declined</Select.Item>
										</Select.Content>
									</Select.Root>
								</div>
							{:else}
								<!-- The DataTable currently renders the normal
								     column cell when no custom cell snippet is
								     provided. -->
							{/if}
						{/snippet}
					</DataTable>
				{/if}
			</Card.Content>
		</Card.Root>

		<ParticipantsData participants={data.current?.participants ?? []} />
	{:catch}
		<Card.Root class="w-[98%] p-4 lg:w-[80%]">
			<Card.Content class="p-8 text-center text-destructive">
				Failed to load participants.
			</Card.Content>
		</Card.Root>
	{/await}
</div>
