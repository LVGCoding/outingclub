<script lang="ts">
	import { Button, buttonVariants } from '#lib/components/ui/button/';
	import * as Card from '#lib/components/ui/card/';
	import {
		createTrip,
		deleteTrip,
		getTripsLeader,
		updateTripStatus
	} from '../../query/trips.remote';
	const tripsPromise = getTripsLeader();
	const trips = $derived(await tripsPromise);
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/';
	import ActionWrapper from '#lib/components/ActionWrapper.svelte';
	import { Swal2 } from '#lib/utils';
	import Badge from '#lib/components/ui/badge/badge.svelte';
	import { goto } from '$app/navigation';
</script>

<div class="flex flex-col items-center justify-center">
	<img src="/logo.png" alt="logo" />
	<Card.Root class="w-[98%] lg:w-[80%]">
		<Card.Header>
			<Card.Title>Trips</Card.Title>
		</Card.Header>
		<Card.Content>
			{#each trips as trip (trip.id)}
				<Card.Root class="gap-1 rounded-md p-2">
					<Card.Header class="p-0">
						<Card.Title>{trip.title}: {trip.activity}</Card.Title>
						<Badge class="bg-blue-600 text-white">{trip.status}</Badge>
						<Card.Action class="hidden max-w-40 flex-row md:block">
							<Button variant="link" href="/manage/trips/{trip.id}">Manage trip</Button>
							<DropdownMenu.Root>
								<DropdownMenu.Trigger class={buttonVariants({ variant: 'outline' })}>
									...
								</DropdownMenu.Trigger>
								<DropdownMenu.Content>
									<DropdownMenu.Group>
										<DropdownMenu.Label>Trip Actions</DropdownMenu.Label>
										<DropdownMenu.Separator />
										<ActionWrapper
											onclick={async () => {
												await updateTripStatus({ id: trip.id, status: 'pending' });
												await tripsPromise.refresh();
											}}>
											{#snippet children({ props, spinnerIcon })}
												<DropdownMenu.Item
													{...props}
													title="Makes the trip public and visible to all users.">
													{@render spinnerIcon()}
													Publish
												</DropdownMenu.Item>
											{/snippet}
										</ActionWrapper>
										<ActionWrapper
											onclick={async () => {
												await updateTripStatus({ id: trip.id, status: 'hidden' });
												await tripsPromise.refresh();
											}}>
											{#snippet children({ props, spinnerIcon })}
												<DropdownMenu.Item {...props} title="Makes the trip hidden to all users.">
													{@render spinnerIcon()}
													Hide
												</DropdownMenu.Item>
											{/snippet}
										</ActionWrapper>
										<ActionWrapper
											onclick={async () => {
												await updateTripStatus({ id: trip.id, status: 'completed' });
												await tripsPromise.refresh();
											}}>
											{#snippet children({ props, spinnerIcon })}
												<DropdownMenu.Item
													{...props}
													title="Marks the trip as complete and removes it from the public view.">
													{@render spinnerIcon()} Mark Complete
												</DropdownMenu.Item>
											{/snippet}
										</ActionWrapper>
										<ActionWrapper
											onclick={async () => {
												await updateTripStatus({ id: trip.id, status: 'cancelled' });
												await tripsPromise.refresh();
											}}>
											{#snippet children({ props, spinnerIcon })}
												<DropdownMenu.Item
													{...props}
													title="Marks the trip as cancelled and removes it from the public view.">
													{@render spinnerIcon()} Mark Cancelled
												</DropdownMenu.Item>
											{/snippet}
										</ActionWrapper>
										<ActionWrapper
											onclick={async () => {
												let res = await Swal2.fire({
													title: 'Delete Trip',
													text: 'Are you sure you want to delete this trip?',
													icon: 'warning',
													showCancelButton: true,
													confirmButtonText: 'Delete',
													cancelButtonText: 'Cancel'
												});
												if (res.isConfirmed) {
													await deleteTrip({ id: trip.id });
													tripsPromise.refresh();
												}
											}}>
											{#snippet children({ props, spinnerIcon })}
												<DropdownMenu.Item {...props} title="Deletes the trip permanently.">
													{@render spinnerIcon()} Delete
												</DropdownMenu.Item>
											{/snippet}
										</ActionWrapper>
									</DropdownMenu.Group>
								</DropdownMenu.Content>
							</DropdownMenu.Root>
						</Card.Action>
					</Card.Header>
					<Card.Content class="p-0 pl-2">
						<Card.Description>
							{trip.description}
							<div class="">
								<p class="pr-1 font-bold">Leaders:</p>
								{#each trip.leaders as leader, index (index)}
									{#if index}
										,
									{/if}
									{leader.users.name}
								{/each}
							</div>
							{trip.time.toLocaleString('default', { weekday: 'long' })},
							{trip.time.toLocaleString('default', { month: 'short' })}
							{trip.time.getDate()} at
							{trip.time.toLocaleString('default', {
								hour: 'numeric',
								minute: 'numeric'
							})}
						</Card.Description>
					</Card.Content>
				</Card.Root>
			{/each}
			{#if trips?.length === 0}
				<Card.Root class="w-full border border-dashed! ring-0">
					<Card.Content>
						<p>No trips have been created yet.</p>
					</Card.Content>
				</Card.Root>
			{/if}
			<Card.Root class="gap-1 rounded-md p-2">
				<Card.Header class="p-0">
					<Card.Title>Create Trip</Card.Title>
				</Card.Header>
				<Card.Content class="p-0 pl-2">
					<ActionWrapper
						onclick={async () => {
							let res = await createTrip();
							if (res) {
								goto(`/manageTrips/${res}`);
							}
						}}>
						{#snippet children({ props, spinnerIcon })}
							<Button {...props}>{@render spinnerIcon()}Create trip</Button>
						{/snippet}
					</ActionWrapper>
				</Card.Content>
			</Card.Root>
		</Card.Content>
	</Card.Root>
</div>
