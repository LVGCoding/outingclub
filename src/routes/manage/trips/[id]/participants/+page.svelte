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
	import { getLayout } from '../../../../context';
	import ParticipantsData from '#lib/components/ParticipantsData.svelte';

	const data = getTripParticipants({ id: page.params.id ?? '' });
	let expandedParticipant = $state<string | null>(null);
	let updatingParticipant = $state<string | null>(null);
	type Status = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'attended' | 'no_show';
	const statusLabels: Record<Status, string> = {
		pending: 'Pending',
		accepted: 'Accepted',
		declined: 'Declined',
		cancelled: 'Cancelled',
		attended: 'Attended',
		no_show: 'No-show'
	};
	$effect(() => {
		getLayout().crumbs = [
			{ href: '/', label: 'Home' },
			{ href: undefined, label: 'Manage' },
			{ href: '/manage/trips', label: 'Trips' },
			{
				href: '/manage/trips/' + page.params.id,
				label: data.current?.trip?.title ?? page.params.id ?? ''
			},
			{ href: '/manage/trips/' + page.params.id + '/participants', label: 'Participants' }
		];
	});

	async function changeStatus(participantId: string, status: Status) {
		updatingParticipant = participantId;
		try {
			await updateParticipantStatus({ participantId, status });
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

	function toggleParticipant(id: string) {
		expandedParticipant = expandedParticipant === id ? null : id;
	}
</script>

<div class="flex flex-col items-center justify-center gap-2">
	{#await data}
		<Card.Root class="w-[98%] lg:w-[80%]">
			<Card.Header><Skeleton class="h-6 w-48" /></Card.Header>
			<Card.Content class="space-y-4">
				{#each Array(5), i (i)}
					<div class="flex items-center gap-4">
						<Skeleton class="h-10 w-10 rounded-full" />
						<div class="space-y-2"><Skeleton class="h-4 w-32" /> <Skeleton class="h-3 w-24" /></div>
					</div>
				{/each}
			</Card.Content>
		</Card.Root>
	{:then result}
		<Card.Root class="w-[98%] lg:w-[80%]">
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
							{result?.participants.length}
							{result?.participants.length === 1 ? 'participant' : 'participants'}
						</p>
					</div>
					<div class="text-sm text-muted-foreground">{result?.trip.activity}</div>
				</div>
			</Card.Header>
			<Card.Content class="p-0">
				{#if result?.participants.length === 0}<Card.Root
						class="m-8 w-full border border-dashed! ring-0">
						<Card.Content>
							<p>No participants have signed up yet.</p>
						</Card.Content>
					</Card.Root>
				{:else}
					<div class="divide-y">
						{#each result?.participants as participant (participant.id)}
							<div>
								<!-- Main participant row -->
								<button
									type="button"
									class="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-muted/50"
									onclick={() => toggleParticipant(participant.id)}>
									<!-- Avatar -->
									<div
										class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
										{#if participant.user.image}
											<img
												src={participant.user.image}
												alt={participant.user.name}
												class="h-full w-full object-cover" />
										{:else}
											<span class="font-medium">
												{participant.user.name
													.split(' ')
													.map((name) => name[0])
													.join('')
													.slice(0, 2)
													.toUpperCase()}
											</span>
										{/if}
									</div>
									<!-- Name / basic info -->
									<div class="min-w-0 flex-1">
										<div class="flex items-center gap-2">
											<span class="truncate font-medium">{participant.user.name}</span>
											{#if participant.isNewToActivity}
												<Badge variant="secondary">New to {result?.trip.activity}</Badge>
											{/if}
										</div>
										<div class="mt-1 flex gap-3 text-sm text-muted-foreground">
											<span>
												{participant.history.totalTrips} previous {participant.history
													.totalTrips === 1
													? 'trip'
													: 'trips'}
											</span>
											{#if participant.history.currentActivityTrips > 0}
												<span>
													{participant.history.currentActivityTrips}
													{result?.trip.activity} trips
												</span>
											{/if}
										</div>
									</div>
									<!-- Reliability -->
									<div class="hidden text-right text-sm md:block">
										<div class="font-medium">{participant.history.totalTrips} attended</div>
										<div class="text-muted-foreground">
											{participant.history.noShowTrips} no-show {participant.history.noShowTrips ===
											1
												? ''
												: 's'} · {participant.history.cancelledTrips} cancelled
										</div>
									</div>
									<!-- Status -->
									<!-- svelte-ignore a11y_click_events_have_key_events -->
									<!-- svelte-ignore a11y_no_static_element_interactions -->
									<div class="shrink-0" onclick={(event) => event.stopPropagation()}>
										<Select.Root
											type="single"
											value={participant.signup.status}
											onValueChange={(value) => changeStatus(participant.id, value as Status)}>
											<Select.Trigger
												class="w-32.5"
												disabled={updatingParticipant === participant.id}>
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
									</div>
									<!-- Expand indicator -->
									<div class="hidden w-5 text-muted-foreground sm:block">
										{expandedParticipant === participant.id ? '−' : '+'}
									</div>
								</button>
								<!-- Expanded details -->
								{#if expandedParticipant === participant.id}
									{@const schoolYear =
										new Date().getMonth() >= 6
											? new Date().getFullYear()
											: new Date().getFullYear() - 1}
									<div class="border-t bg-muted/20 px-4 py-5">
										<div class="grid gap-6 md:grid-cols-3">
											<!-- Contact -->
											<div>
												<h4 class="mb-3 text-sm font-medium">Contact</h4>
												<div class="space-y-1 text-sm">
													<div>{participant.user.email}</div>
													<div class="text-muted-foreground">{participant.user.phoneNumber}</div>
													<div class="text-muted-foreground">
														Member since {participant.user.yearJoined}
														{#if schoolYear < 0}
															Grad Student
														{:else if schoolYear - participant.user.yearJoined === 0}
															Freshman
														{:else if schoolYear - participant.user.yearJoined === 1}
															Sophomore
														{:else if schoolYear - participant.user.yearJoined === 2}
															Junior
														{:else if schoolYear - participant.user.yearJoined === 3}
															Senior
														{:else}
															Senior+
														{/if}
													</div>
												</div>
											</div>
											<!-- History -->
											<div>
												<h4 class="mb-3 text-sm font-medium">Trip history</h4>
												<div class="space-y-1 text-sm">
													<div>
														<strong>{participant.history.totalTrips}</strong>
														attended
													</div>
													<div>
														<strong>{participant.history.currentActivityTrips}</strong>
														{result?.trip.activity}
														{participant.history.currentActivityTrips === 1 ? ' trip' : ' trips'}
													</div>
													<div class="text-muted-foreground">
														First trip: {formatDate(participant.history.firstTrip)}
													</div>
													<div class="text-muted-foreground">
														Last trip: {formatDate(participant.history.lastTrip)}
													</div>
												</div>
											</div>
											<!-- Reliability -->
											<div>
												<h4 class="mb-3 text-sm font-medium">Reliability</h4>
												<div class="space-y-1 text-sm">
													<div>
														<span class="font-medium">{participant.history.cancelledTrips}</span>
														{participant.history.cancelledTrips === 1
															? ' cancellation'
															: ' cancellations'}
													</div>
													<div>
														<span class="font-medium">{participant.history.noShowTrips}</span>
														{participant.history.noShowTrips === 1 ? ' no-show' : ' no-shows'}
													</div>
												</div>
											</div>
										</div>
										<!-- Activity breakdown -->
										{#if participant.history.activityCounts.length > 0}
											<Separator class="my-5" />
											<div>
												<h4 class="mb-3 text-sm font-medium">Activities</h4>
												<div class="flex flex-wrap gap-2">
													{#each participant.history.activityCounts as activity (activity.activity)}
														<Badge variant="outline">
															{activity.activity}
															<span class="ml-1 text-muted-foreground">× {activity.count}</span>
														</Badge>
													{/each}
												</div>
											</div>
										{/if}
										<!-- Leader notes -->
										{#if participant.user.notes}
											<Separator class="my-5" />
											<div>
												<h4 class="mb-2 text-sm font-medium">Leader notes</h4>
												<p class="text-sm whitespace-pre-wrap text-muted-foreground">
													{participant.user.notes}
												</p>
											</div>
										{/if}
										<!-- Form responses -->
										{#if participant.signup.formData}
											<Separator class="my-5" />
											<div>
												<h4 class="mb-2 text-sm font-medium">Sign-up information</h4>
												{#each participant.signup.formData as data, i (i)}
													<div>
														<b>{data?.label}</b>
														: {data?.value}
													</div>
												{/each}
											</div>
										{/if}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
		<ParticipantsData participants={data.current?.participants ?? []}></ParticipantsData>
	{:catch}
		<Card.Root class="w-[98%] lg:w-[80%]">
			<Card.Content class="p-8 text-center text-destructive">
				Failed to load participants.
			</Card.Content>
		</Card.Root>
	{/await}
</div>
