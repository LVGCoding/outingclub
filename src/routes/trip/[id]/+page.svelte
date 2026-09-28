<script lang="ts">
	import FormElement from '#lib/components/FormElement.svelte';
	import Button from '#lib/components/ui/button/button.svelte';
	import * as Card from '#lib/components/ui/card';
	import { Separator } from '#lib/components/ui/separator';
	import { page } from '$app/state';
	import { Swal2 } from '#lib/utils';
	import { getTrip, signUp } from '../../query/trips.remote';
	import ActionWrapper from '#lib/components/ActionWrapper.svelte';

	let tripPromise = $derived(getTrip({ id: page.params.id ?? '' }));
	let trip = $derived(await tripPromise);
	let valid = $derived(trip.formElements?.map(() => false) ?? []);
	let responses = $derived(trip.formElements?.map(() => null) ?? []);
</script>

<div class="flex flex-col items-center justify-center">
	<Card.Root class="w-[98%] lg:w-[80%]">
		<Card.Header>
			<Card.Title>{trip.title}: {trip.activity}</Card.Title>
		</Card.Header>
		<Card.Content>
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
			{trip.time?.toLocaleString('default', { weekday: 'long' })},
			{trip.time?.toLocaleString('default', { month: 'short' })}
			{trip.time?.getDate()} at
			{trip.time?.toLocaleString('default', {
				hour: 'numeric',
				minute: 'numeric'
			})}
			<Separator />
			{#if !trip.tripParticipants?.length}
				<h2 class="text-2xl">Sign Up Form</h2>
				{#each trip?.formElements as formEl, i (i)}
					<FormElement
						bind:valid={valid[i]}
						bind:response={responses[i]}
						validate
						element={formEl} />
				{/each}
				<ActionWrapper
					onclick={async () => {
						if (!valid.every((v, i) => (trip.formElements![i].required ? v : true))) {
							Swal2.fire({
								title: 'Form is invalid',
								text: 'Please fill out all required fields.',
								icon: 'warning'
							});
							return;
						}
						signUp({ tripId: page.params.id ?? '', formData: responses }).then((e) => {
							if (typeof e === 'string') {
								Swal2.fire({
									title: 'Error',
									text: e,
									icon: 'error'
								});
								return;
							}
							Swal2.fire({
								title: 'Success',
								text: 'You have successfully signed up for this trip.',
								icon: 'success'
							});
							tripPromise.refresh();
						});
					}}>
					{#snippet children({ props, spinnerIcon })}
						<Button {...props}>{@render spinnerIcon()}Sign Up</Button>
					{/snippet}
				</ActionWrapper>
			{:else}
				<p>You are already signed up for this trip.</p>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
