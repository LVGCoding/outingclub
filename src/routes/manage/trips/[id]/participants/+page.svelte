<script lang="ts">
	import { Badge } from '#lib/components/ui/badge';
	import * as Card from '#lib/components/ui/card';
	import { Separator } from '#lib/components/ui/separator';
	import * as Select from '#lib/components/ui/select';
	import { Skeleton } from '#lib/components/ui/skeleton';
	import { toast } from 'svelte-sonner';

	import {
		getTripParticipants,
		updateParticipantStatus,
		updateParticipantStatusBulk
	} from '../../../../query/trips.remote';

	import { page } from '$app/state';
	import * as ToggleGroup from '#lib/components/ui/toggle-group/';
	import { goto } from '$app/navigation';
	import ParticipantsData from '#lib/components/ParticipantsData.svelte';

	import {
		filterFn_includesString,
		renderSnippet,
		type ColumnDef,
		type TableFeatures
	} from '@tanstack/svelte-table';
	import type { DataTableColumnMeta } from '#lib/components/dataTable/DataTable.svelte';
	import DataTable from '#lib/components/dataTable/DataTable.svelte';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/';
	import { buttonVariants } from '#lib/components/ui/button/button.svelte';
	import { Swal2 } from '#lib/utils';
	import ActionWrapper from '#lib/components/ActionWrapper.svelte';
	import { Button } from '#lib/components/ui/button/';

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

	const formColumns = $derived.by(() => {
		let columns: ColumnDef<TableFeatures, Participant>[] = [];
		if (!data.current) return [];
		for (const i of data.current.trip.formElements) {
			let column = {
				id: i.label,
				header: i.label,
				accessorFn: (participant: Participant) =>
					String(participant.signup.formData.find((el) => el?.label === i.label)?.value),
				meta: {
					filter: 'text',
					filterPlaceholder: 'Search name or email'
				} as DataTableColumnMeta,
				filterFn: filterFn_includesString
			} as ColumnDef<TableFeatures, Participant>;

			if (i.type === 'checkbox') {
				column.filterFn = (row, columnId, value: { value: string[]; requireAll: boolean }) => {
					if (!value) return true;
					if (!value.value) return true;
					value.value.sort();
					let data = (
						(row.original.signup.formData.find((el) => el?.label === i.label)?.value ??
							[]) as string[]
					).toSorted();
					if (value.requireAll) {
						return value.value.toString() === data.toString();
					}
					return value.value.some((el) => data.includes(el));
				};
				column.meta = {
					filter: 'select',
					filterPlaceholder: 'Any class',
					filterOptions: i.options.map((el) => ({
						label: el.value,
						value: el.value
					})),
					multi: true
				};
			} else if (i.type === 'radio') {
				column.filterFn = (row, columnId, value) => {
					if (!value) return true;
					return value.includes(row.getValue<number>(columnId));
				};
				column.meta = {
					filter: 'select',
					filterPlaceholder: 'Any class',
					filterOptions: i.options.map((el) => ({
						label: el.value,
						value: el.value
					}))
				};
			}

			columns.push(column);
		}
		return columns;
	});

	const columns = $derived([
		{
			id: 'participant',
			header: 'Participant',

			accessorFn: (participant: Participant) => participant.user.name,

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
			header: data.current?.trip.activity + ' trips',

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

				return renderSnippet(Status, participant);
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
		},
		...formColumns
	]) satisfies ColumnDef<TableFeatures, Participant>[];

	async function exportToTable() {
		let elements: {
			number: string;
			name: string;
			email: string;
			phoneNumber: string;
			emergency: string;
			emergencyPhone: string;
		}[] = [
			{
				number: '',
				name: 'Name',
				email: 'RPI Email',
				phoneNumber: 'Phone Number',
				emergency: 'Emergency Contact',
				emergencyPhone: 'Phone Number'
			}
		];
		if (!data.current) return;
		let i = 1;
		for (const el of data.current.trip.leaders) {
			elements.push({
				number: i.toString(),
				name: el.users.name,
				email: el.users.email,
				phoneNumber: el.users.phoneNumber,
				emergency: el.users.emergencyContact,
				emergencyPhone: el.users.emergencyContactNumber
			});
			i++;
		}
		for (const el of data.current.participants) {
			if (el.signup.status === 'accepted') {
				elements.push({
					number: i.toString(),
					name: el.user.name,
					email: el.user.email,
					phoneNumber: el.user.phoneNumber,
					emergency: el.user.emergencyContact,
					emergencyPhone: el.user.emergencyContactNumber
				});
				i++;
			}
		}
		await copyTableToClipboard(elements);
	}

	async function copyTableToClipboard(data: Record<string, string>[]) {
		if (data.length === 0) return;

		const columns = Object.keys(data[0]);

		// HTML table
		const html = `
        <table border="1">
            <tbody>
                ${data
									.map(
										(row) => `
                    <tr>
                        ${columns.map((c) => `<td>${escape(String(row[c] ?? ''))}</td>`).join('')}
                    </tr>
                `
									)
									.join('')}
            </tbody>
        </table>
    `;

		// Plain text fallback (tab-separated)
		const text = [
			columns.join('\t'),
			...data.map((row) => columns.map((c) => row[c] ?? '').join('\t'))
		].join('\n');

		await navigator.clipboard.write([
			new ClipboardItem({
				'text/html': new Blob([html], { type: 'text/html' }),
				'text/plain': new Blob([text], { type: 'text/plain' })
			})
		]);
	}

	function escape(str: string) {
		return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}
</script>

{#snippet Status(participant: Participant)}
	<Select.Root
		type="single"
		value={participant.signup.status}
		onValueChange={(value) => changeStatus(participant.id, value as Status)}>
		<Select.Trigger class="w-32.5" disabled={updatingParticipant === participant.id}>
			<Select.Value>
				{statusLabels[participant.signup.status as Status]}
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
{/snippet}

<div class="flex flex-col items-center justify-center gap-2">
	{#await data}
		<Card.Root class="w-[98%] p-4 lg:w-[90%]">
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
		<Card.Root class="w-[98%] p-4 lg:w-[90%]">
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
						<DropdownMenu.Root>
							<DropdownMenu.Trigger class={buttonVariants({ variant: 'outline', size: 'icon-sm' })}>
								...
							</DropdownMenu.Trigger>
							<DropdownMenu.Content>
								<DropdownMenu.Group>
									<DropdownMenu.Label>Actions</DropdownMenu.Label>
									<ActionWrapper
										onclick={async () => {
											await updateParticipantStatusBulk({
												participantId:
													data.current?.participants.reduce(
														(cur, el) => (el.signup.status === 'pending' ? [...cur, el.id] : cur),
														[] as string[]
													) ?? [],
												status: 'declined'
											});
											data.refresh();
										}}>
										{#snippet children({ props, spinnerIcon })}
											<DropdownMenu.Item {...props}>
												{@render spinnerIcon()} Decline Non Accepted
											</DropdownMenu.Item>
										{/snippet}
									</ActionWrapper>
									<DropdownMenu.Item
										onclick={async () => {
											exportToTable();
											Swal2.fire('Coppied', 'The emails were coppied to your clipboard', 'success');
										}}>
										Copy Trip sheet participants
									</DropdownMenu.Item>
									<DropdownMenu.Item
										onclick={async () => {
											let emails =
												data.current?.participants.reduce(
													(cur, el, i) =>
														cur +
														(el.signup.status === 'accepted'
															? (i !== 0 ? ', ' : '') + el.user.email
															: ''),
													''
												) ?? '';
											await navigator.clipboard.writeText(emails);
											Swal2.fire('Coppied', 'The emails were coppied to your clipboard', 'success');
										}}>
										Copy Accepted Emails
									</DropdownMenu.Item>
									<DropdownMenu.Item
										onclick={async () => {
											let emails =
												data.current?.participants.reduce(
													(cur, el, i) =>
														cur +
														(el.signup.status === 'declined'
															? (i !== 0 ? ', ' : '') + el.user.email
															: ''),
													''
												) ?? '';
											await navigator.clipboard.writeText(emails);
											Swal2.fire('Coppied', 'The emails were coppied to your clipboard', 'success');
										}}>
										Copy Declined Emails
									</DropdownMenu.Item>
								</DropdownMenu.Group>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
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
								<Button
									onclick={() => {
										let element = [
											{
												number: '',
												name: row.original.user.name,
												email: row.original.user.email,
												phoneNumber: row.original.user.phoneNumber,
												emergency: row.original.user.emergencyContact,
												emergencyPhone: row.original.user.emergencyContactNumber
											}
										];
										copyTableToClipboard(element);
									}}>
									Copy User trip form row
								</Button>
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
												{getClassName(participant.user.yearJoined)}
											</div>
										</div>
									</div>
									<!-- extendTailwindMerge contact -->
									<div>
										<h4 class="mb-3 text-sm font-medium">Emergency Contact</h4>

										<div class="space-y-1 text-sm">
											<div>
												{participant.user.emergencyContact}
											</div>

											<div class="text-muted-foreground">
												{participant.user.emergencyContactNumber}
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
