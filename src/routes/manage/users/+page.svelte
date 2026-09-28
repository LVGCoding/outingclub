<script lang="ts">
	import { Button } from '#lib/components/ui/button';
	import { Input } from '#lib/components/ui/input';
	import { Label } from '#lib/components/ui/label';
	import { Textarea } from '#lib/components/ui/textarea';
	import { Badge } from '#lib/components/ui/badge';
	import * as Card from '#lib/components/ui/card';
	import * as Dialog from '#lib/components/ui/dialog';
	import * as Select from '#lib/components/ui/select';
	import { toast } from 'svelte-sonner';
	import {
		deleteUser,
		getUsers,
		updateUser,
		updateUserNotes,
		updateUserPassword
	} from '../../query/trips.remote';
	import type { PageProps } from './$types';
	import { Swal2 } from '#lib/utils';

	let pageData: PageProps = $props();

	const data = getUsers();
	type User = NonNullable<typeof data.current>[number];
	let search = $state('');
	let editingUser = $state<User | null>(null);
	let saving = $state(false);

	let name = $state('');
	let email = $state('');
	let phoneNumber = $state('');
	let notes = $state('');
	let role = $state('member');
	let year = $state(new Date().getFullYear());
	let password = $state('');

	let currentSchoolYear: number =
		new Date().getMonth() >= 6 ? new Date().getFullYear() : new Date().getFullYear() - 1;

	const filteredUsers = $derived.by(() => {
		const users = data.current ?? [];

		const searchTerm = search.trim().toLowerCase();

		if (!searchTerm) {
			return users;
		}

		return users.filter((user) =>
			[user.name, user.email, user.phoneNumber, user.notes]
				.filter(Boolean)
				.some((value) => value.toLowerCase().includes(searchTerm))
		);
	});

	function openEdit(user: User) {
		editingUser = user;

		name = user.name;
		email = user.email;
		phoneNumber = user.phoneNumber;
		notes = user.notes ?? '';
		role = user.role ?? 'viewer';
		year = user.yearJoined;

		// Never populate this from the server.
		password = '';
	}

	function closeEdit() {
		editingUser = null;
		password = '';
	}

	function className(year: number) {
		if (year < 0) {
			return 'Grad Student';
		}

		const difference = currentSchoolYear - year;

		if (difference === 0) return 'Freshman';
		if (difference === 1) return 'Sophomore';
		if (difference === 2) return 'Junior';
		if (difference === 3) return 'Senior';

		return 'Senior+';
	}
	async function saveUser() {
		if (!editingUser) return;

		saving = true;

		try {
			if (pageData.data.editUser) {
				await updateUser({
					id: editingUser.id,
					name,
					email,
					phoneNumber,
					notes,
					role: role as 'member' | 'admin',
					yearJoined: year
				});
			} else {
				await updateUserNotes({
					id: editingUser.id,
					notes
				});
			}
			if (password.length > 0) {
				await updateUserPassword({ userId: editingUser.id, password });
			}

			toast.success('User updated');

			closeEdit();

			// Refresh the remote query.
			await data.refresh();
		} catch (error) {
			console.error(error);
			toast.error(error instanceof Error ? error.message : 'Failed to update user');
		} finally {
			saving = false;
		}
	}
</script>

<div class="flex flex-col items-center justify-center">
	<Card.Root class="w-[98%] lg:w-[80%]">
		<Card.Header>
			<Card.Title>User Management</Card.Title>
			<Card.Description>Manage club members and their information.</Card.Description>
			<Card.Action>
				<Input bind:value={search} placeholder="Search users..." class="w-64" />
			</Card.Action>
		</Card.Header>

		<Card.Content class="p-0">
			{#await data}
				<div class="p-8 text-center text-muted-foreground">Loading users...</div>
			{:then}
				{#if filteredUsers.length === 0}
					<Card.Root class="w-full border border-dashed! ring-0">
						<Card.Content>
							<p>
								No users found. Honestly I dont know how we got here if there are no users how are
								you here. An account is required in order to be here
							</p>
						</Card.Content>
					</Card.Root>
				{:else}
					<div class="overflow-x-auto">
						<table class="w-full text-sm">
							<thead class="border-y bg-muted/50">
								<tr>
									<th class="px-4 py-3 text-left font-medium">Name</th>

									<th class="px-4 py-3 text-left font-medium">Email</th>

									<th class="px-4 py-3 text-left font-medium">Class</th>

									<th class="px-4 py-3 text-left font-medium">Role</th>

									<th class="px-4 py-3 text-left font-medium">Phone</th>

									<th class="px-4 py-3 text-left font-medium">Notes</th>

									<th class="w-24 px-4 py-3"></th>
								</tr>
							</thead>

							<tbody class="divide-y">
								{#each filteredUsers as user (user.id)}
									<tr class="hover:bg-muted/30">
										<td class="px-4 py-3">
											<div class="font-medium">
												{user.name}
											</div>
										</td>

										<td class="px-4 py-3 text-muted-foreground">
											{user.email}
										</td>

										<td class="px-4 py-3">
											{className(user.yearJoined)}
										</td>

										<td class="px-4 py-3">
											{#if user.role === 'admin'}
												<Badge>Admin</Badge>
											{:else}
												<Badge variant="secondary">Member</Badge>
											{/if}
										</td>

										<td class="px-4 py-3 text-muted-foreground">
											{user.phoneNumber}
										</td>

										<td class="px-4 py-3 text-muted-foreground">
											{user.notes}
										</td>

										<td class="flex gap-2 px-4 py-3 text-right">
											{#if pageData.data.updateNotes}
												<Button variant="outline" size="sm" onclick={() => openEdit(user)}>
													Notes
												</Button>
											{/if}
											{#if pageData.data.editUser}
												<Button variant="outline" size="sm" onclick={() => openEdit(user)}>
													Edit
												</Button>
											{/if}
											{#if pageData.data.deleteUser}
												<Button
													variant="outline"
													size="sm"
													onclick={async () => {
														const confirm = await Swal2.fire({
															title: 'Delete User',
															text: 'Are you sure you want to delete this sser?',
															icon: 'warning',
															showCancelButton: true,
															confirmButtonText: 'Delete',
															cancelButtonText: 'Cancel'
														});
														if (!confirm.isConfirmed) return;

														deleteUser({ userId: user.id });
														data.refresh();
													}}>
													Delete
												</Button>
											{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			{/await}
		</Card.Content>
	</Card.Root>
</div>

<Dialog.Root
	open={editingUser !== null}
	onOpenChange={(open) => {
		if (!open) closeEdit();
	}}>
	<Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title>Edit User</Dialog.Title>

			<Dialog.Description>
				Update this user's club information and account settings.
			</Dialog.Description>
		</Dialog.Header>

		<div class="flex flex-col gap-4 space-y-5 py-4">
			{#if pageData.data.editUser}
				<!-- Name -->
				<div>
					<Label for="name">Name</Label>

					<Input id="name" bind:value={name} class="mt-2" />
				</div>

				<!-- Email -->
				<div>
					<Label for="email">Email</Label>

					<Input id="email" type="email" bind:value={email} class="mt-2" />
				</div>

				<!-- Phone -->
				<div>
					<Label for="phone">Phone Number</Label>

					<Input id="phone" type="tel" bind:value={phoneNumber} class="mt-2" />
				</div>

				<!-- Class -->
				<div>
					<Label>Class</Label>

					<Select.Root bind:value={() => year?.toString(), (v) => (year = Number(v))} type="single">
						<Select.Trigger class="mt-2 w-full">
							{className(year)}
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

				<!-- Role -->
				<div>
					<Label>Role</Label>

					<Select.Root type="single" bind:value={() => role, (v) => (role = v)}>
						<Select.Trigger class="mt-2 w-full">
							{role[0].toUpperCase() + role.substring(1)}
						</Select.Trigger>

						<Select.Content>
							<Select.Item value="member">Member</Select.Item>
							<Select.Item value="admin">Admin</Select.Item>
							<Select.Item value="viewer">Viewer</Select.Item>
							<Select.Item value="leader">Leader</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>

				<!-- Password -->
				<div>
					<Label for="password">New Password</Label>

					<Input
						id="password"
						type="password"
						bind:value={password}
						placeholder="Leave blank to keep current password"
						class="mt-2" />

					<p class="mt-1 text-xs text-muted-foreground">
						Only enter a password if you want to change it.
					</p>
				</div>
			{/if}
			<!-- Notes -->
			<div>
				<Label for="notes">Leader Notes</Label>

				<Textarea
					id="notes"
					bind:value={notes}
					placeholder="Important information for trip leaders..."
					class="mt-2 min-h-24" />

				<p class="mt-1 text-xs text-muted-foreground">These notes are visible to trip leaders.</p>
			</div>
		</div>

		<Dialog.Footer>
			<Button variant="outline" onclick={closeEdit} disabled={saving}>Cancel</Button>

			<Button onclick={saveUser} disabled={saving}>
				{saving ? 'Saving...' : 'Save Changes'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
