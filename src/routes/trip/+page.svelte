<script lang="ts">
	import LexicalRenderer from '#lib/components/textEditor/LexicalRenderer.svelte';
	import { Button } from '#lib/components/ui/button/';
	import * as Card from '#lib/components/ui/card/';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
</script>

<div class="flex flex-col items-center justify-center">
	<img src="/logo.png" alt="logo" />
	<Card.Root class="w-[98%] p-4 lg:w-[80%]">
		<Card.Header>
			<Card.Title>Trips</Card.Title>
		</Card.Header>
		<Card.Content>
			{#each data.trips as trip (trip.id)}
				<Card.Root class="gap-1 rounded-md p-2">
					<Card.Header class="p-0">
						<Card.Title>{trip.title}: {trip.activity}</Card.Title>
						<Card.Action class="hidden max-w-40 md:block">
							<Button variant="link" href="/trip/{trip.id}">Sign Up</Button>
						</Card.Action>
					</Card.Header>
					<Card.Content class="p-0 pl-2">
						<Card.Description>
							<LexicalRenderer content={trip.description} />
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
			{#if data.trips.length === 0}
				<Card.Root class="w-full border border-dashed! ring-0">
					<Card.Content>
						<p>No trips are released yet. They will be released during the meeting.</p>
					</Card.Content>
				</Card.Root>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
