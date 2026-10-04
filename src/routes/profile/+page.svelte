<script lang="ts">
	import ActionWrapper from '#lib/components/ActionWrapper.svelte';
	import { Button } from '#lib/components/ui/button/';
	import * as Card from '#lib/components/ui/card/';
	import { Input } from '#lib/components/ui/input';
	import { Label } from '#lib/components/ui/label';
	import * as Select from '#lib/components/ui/select/';
	import { getCurrentUserQuery, updateCurrentUser } from '../query/trips.remote';

	let user = $state(await getCurrentUserQuery());
	let currentSchoolYear: number =
		new Date().getMonth() >= 6 ? new Date().getFullYear() : new Date().getFullYear() - 1;
</script>

<div class="flex flex-col items-center justify-center gap-2">
	<Card.Root class="w-[98%] p-4 lg:w-[80%]">
		<div class="flex flex-col gap-5">
			{#if user}
				<div>
					<Label for="register-name">Name</Label>

					<Input
						id="register-name"
						name="name-reg"
						autocomplete="name"
						placeholder="name"
						bind:value={user.name}
						class="mt-2 h-11" />
				</div>

				<div>
					<Label for="register-email">Rpi Email</Label>

					<Input
						id="register-email"
						type="email"
						bind:value={user.email}
						name="email-reg"
						autocomplete="email"
						placeholder="you@rpi.edu"
						class="mt-2 h-11" />
				</div>
				<div>
					<Label>Class Year</Label>

					<Select.Root
						bind:value={() => user.yearJoined.toString(), (v) => (user.yearJoined = Number(v))}
						type="single">
						<Select.Trigger class="mt-2 w-full">
							{#if user.yearJoined < 0}
								Grad Student
							{:else if currentSchoolYear - user.yearJoined === 0}
								Freshman
							{:else if currentSchoolYear - user.yearJoined === 1}
								Sophomore
							{:else if currentSchoolYear - user.yearJoined === 2}
								Junior
							{:else if currentSchoolYear - user.yearJoined === 3}
								Senior
							{:else}
								Senior+
							{/if}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value={currentSchoolYear.toString()}>Freshman</Select.Item>
							<Select.Item value={(currentSchoolYear - 1).toString()}>Sophomore</Select.Item>
							<Select.Item value={(currentSchoolYear - 2).toString()}>Junior</Select.Item>
							<Select.Item value={(currentSchoolYear - 3).toString()}>Senior</Select.Item>
							<Select.Item value={(currentSchoolYear - 4).toString()}>Senior+</Select.Item>
							<Select.Item value="-1">Grad Student</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>
				<div>
					<Label for="register-phone">Phone Number</Label>

					<Input
						id="register-phone"
						type="tel"
						name="phone-reg"
						autocomplete="billing home tel-local"
						bind:value={user.phoneNumber}
						placeholder="123-456-7890"
						class="mt-2 h-11" />
				</div>
				<div>
					<Label for="register-phone">Emergency Contact Name</Label>

					<Input
						id="emergency-register-name"
						type="text"
						name="name-reg-emergency"
						bind:value={user.emergencyContact}
						placeholder="Example Name"
						class="mt-2 h-11" />
				</div>
				<div>
					<Label for="register-phone">Emergency Contact Phone Number</Label>

					<Input
						id="emergency-register-phone"
						type="tel"
						name="phone-reg-emergency"
						bind:value={user.emergencyContactNumber}
						placeholder="123-456-7890"
						class="mt-2 h-11" />
				</div>

				<ActionWrapper
					onclick={async () => {
						await updateCurrentUser({
							name: user.name,
							email: user.email,
							yearJoined: user.yearJoined,
							phoneNumber: user.phoneNumber,
							emergencyContact: user.emergencyContact,
							emergencyContactNumber: user.emergencyContactNumber
						});
					}}>
					{#snippet children({ props, spinnerIcon })}
						<Button {...props} formaction="?/signUpEmail" class="h-11 w-full text-base font-bold">
							{@render spinnerIcon()}
							Update Account
						</Button>
					{/snippet}
				</ActionWrapper>
			{/if}
		</div>
	</Card.Root>
</div>
