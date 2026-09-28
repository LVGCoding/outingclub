<script lang="ts">
	import { Label } from '#lib/components/ui/label/';
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import { page } from '$app/state';

	import Input from '#lib/components/ui/input/input.svelte';
	import Button from '#lib/components/ui/button/button.svelte';
	import * as Card from '#lib/components/ui/card/';
	import * as Tabs from '#lib/components/ui/tabs/';
	import { Swal2 } from '#lib/utils';
	import * as Select from '#lib/components/ui/select/';

	let { form }: PageProps = $props();
	if (page?.url.searchParams.get('reason') === 'not_logged_in') {
		Swal2.fire({
			title: 'Not logged in',
			text: 'You need to be logged to sign up for trips.',
			icon: 'warning'
		});
	}
	let currentSchoolYear: number =
		new Date().getMonth() >= 6 ? new Date().getFullYear() : new Date().getFullYear() - 1;
	let year: number = $state(currentSchoolYear);
</script>

<form method="post" action="?/signInEmail" use:enhance>
	<div class="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
		<div class="w-full max-w-md">
			<!-- Branding -->
			<div class="mb-8 text-center">
				<div class="mx-auto flex items-center justify-center">
					<img src="/logo.png" alt="Korok" class="w-40 rounded object-contain" />
				</div>

				<h1 class="text-5xl font-black tracking-tight text-foreground">Welcome</h1>

				<p class="mt-3 text-muted-foreground">Sign in to signup for trips.</p>
			</div>

			<!-- Auth Card -->
			<Card.Root class="overflow-hidden border-2 border-border bg-card pt-0 shadow-xl">
				<Tabs.Root value="login">
					<Card.Header class="-m-px border-b-2 border-border bg-secondary/40 px-6 pt-6">
						<Tabs.List class="grid w-full grid-cols-2">
							<Tabs.Trigger value="login" class="font-bold">Login</Tabs.Trigger>

							<Tabs.Trigger value="register" class="font-bold">Register</Tabs.Trigger>
						</Tabs.List>
					</Card.Header>

					<Card.Content class="px-6 py-6">
						<!-- Login -->
						<Tabs.Content value="login">
							<div class="flex flex-col gap-5">
								<div>
									<Label for="login-email">Rpi Email</Label>

									<Input
										id="login-email"
										type="email"
										name="email"
										autocomplete="email"
										placeholder="you@rpi.edu"
										class="mt-2 h-11" />
								</div>

								<div>
									<div class="flex items-center justify-between">
										<Label for="login-password">Password</Label>
									</div>

									<Input
										id="login-password"
										type="password"
										name="password"
										autocomplete="current-password"
										class="mt-2 h-11" />
								</div>

								{#if form?.message}
									<div
										class="rounded-lg border-2 border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
										{form.message}
									</div>
								{/if}

								<Button type="submit" class="h-11 w-full text-base font-bold">Login</Button>
							</div>
						</Tabs.Content>

						<!-- Register -->
						<Tabs.Content value="register">
							<div class="flex flex-col gap-5">
								<div>
									<Label for="register-name">First Name</Label>

									<Input
										id="register-name"
										name="first-name-reg"
										autocomplete="given-name"
										placeholder="first name"
										class="mt-2 h-11" />
								</div>

								<div>
									<Label for="register-name">Last Name</Label>

									<Input
										id="register-name"
										name="last-name-reg"
										autocomplete="family-name"
										placeholder="last name"
										class="mt-2 h-11" />
								</div>

								<div>
									<Label for="register-email">Rpi Email</Label>

									<Input
										id="register-email"
										type="email"
										name="email-reg"
										autocomplete="email"
										placeholder="you@rpi.edu"
										class="mt-2 h-11" />
								</div>
								<div>
									<Label>Class Year</Label>

									<Select.Root
										bind:value={() => year?.toString(), (v) => (year = Number(v))}
										type="single">
										<Select.Trigger class="mt-2 w-full">
											{#if year < 0}
												Grad Student
											{:else if currentSchoolYear - year === 0}
												Freshman
											{:else if currentSchoolYear - year === 1}
												Sophomore
											{:else if currentSchoolYear - year === 2}
												Junior
											{:else if currentSchoolYear - year === 3}
												Senior
											{:else}
												Senior+
											{/if}
										</Select.Trigger>
										<Select.Content>
											<Select.Item value={currentSchoolYear.toString()}>Freshman</Select.Item>
											<Select.Item value={(currentSchoolYear - 1).toString()}>
												Sophomore
											</Select.Item>
											<Select.Item value={(currentSchoolYear - 2).toString()}>Junior</Select.Item>
											<Select.Item value={(currentSchoolYear - 3).toString()}>Senior</Select.Item>
											<Select.Item value={(currentSchoolYear - 4).toString()}>Senior+</Select.Item>
											<Select.Item value="-1">Grad Student</Select.Item>
										</Select.Content>
									</Select.Root>
									<Input
										id="register-year-joined"
										type="number"
										value={year}
										name="year-joined-reg"
										class="mt-2 hidden h-11" />
								</div>
								<div>
									<Label for="register-phone">Phone Number</Label>

									<Input
										id="register-phone"
										type="tel"
										name="phone-reg"
										autocomplete="email"
										placeholder="123-456-7890"
										pattern={'[0-9]{3}-[0-9]{3}-[0-9]{4}'}
										class="mt-2 h-11" />
								</div>

								<div>
									<Label for="register-password">Password</Label>

									<Input
										id="register-password"
										type="password"
										name="password-reg"
										autocomplete="new-password"
										class="mt-2 h-11" />
								</div>
								<div>
									<Label for="register-confirm-password">Confirm Password</Label>

									<Input
										id="register-confirm-password"
										type="password"
										name="confirm-password-reg"
										autocomplete="new-password"
										class="mt-2 h-11" />
								</div>

								{#if form?.message}
									<div
										class="rounded-lg border-2 border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
										{form.message}
									</div>
								{/if}

								<Button
									type="submit"
									formaction="?/signUpEmail"
									class="h-11 w-full text-base font-bold">
									Create Account
								</Button>
							</div>
						</Tabs.Content>
					</Card.Content>

					<Card.Footer class="-mb-6.5 border-t-2 border-border bg-background/40 px-6 py-4">
						<p class="w-full text-center text-xs leading-5 text-muted-foreground">
							Sign up to register for trips
						</p>
					</Card.Footer>
				</Tabs.Root>
			</Card.Root>

			<!-- Bottom decoration -->
			<div
				class="mt-6 flex items-center justify-center gap-3 text-sm font-bold text-muted-foreground">
				<span>Find them all</span>
				<span>•</span>
				<span>Climb the leaderboard</span>
			</div>
		</div>
	</div>
</form>
