<script lang="ts">
	import { filterFn_includesString, renderSnippet } from '@tanstack/svelte-table';
	import type { ColumnDef, Row, TableFeatures } from '@tanstack/svelte-table';

	import {
		deleteUser,
		getUsers,
		removeOldUsers,
		updateUser,
		updateUserNotes,
		updateUserPaid,
		updateUserPassword
	} from '../../query/trips.remote';
	import DataTable from '#lib/components/dataTable/DataTable.svelte';
	import * as Card from '#lib/components/ui/card/';
	import type { PageProps } from './$types';
	import ActionWrapper from '#lib/components/ActionWrapper.svelte';
	import { Swal2 } from '#lib/utils';
	import { Button, buttonVariants } from '#lib/components/ui/button/index';
	import Badge from '#lib/components/ui/badge/badge.svelte';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/';
	import * as Dialog from '#lib/components/ui/dialog/';
	import { Label } from '#lib/components/ui/label/';
	import { Input } from '#lib/components/ui/input/';
	import * as Select from '#lib/components/ui/select/';
	import { Textarea } from '#lib/components/ui/textarea/';
	import { toast } from 'svelte-sonner';

	const data = getUsers();
	type User = NonNullable<typeof data.current>[number];
	let pageData: PageProps = $props();

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

	function semestersPaid(user: User) {
		const split = user.paidDuesEnd.split('/');

		const paidYear = Number(split[0]);
		const paidMonth = Number(split[1]);

		const currentMonth = new Date().getMonth();
		const currentYear = new Date().getFullYear();

		if (paidYear < currentYear) {
			return [];
		}

		if (paidYear === currentYear) {
			if (paidMonth < currentMonth) {
				return [];
			}

			if (paidMonth === 4) {
				return ['Spring ' + currentYear];
			}

			if (paidMonth === 7) {
				return ['Summer ' + currentYear];
			}

			if (paidMonth === 11) {
				return ['Fall ' + currentYear];
			}
		}

		if (paidYear > currentYear) {
			return ['Fall ' + currentYear, 'Spring ' + paidYear];
		}

		return [];
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
	const columns = [
		{
			header: 'Name',
			accessorKey: 'name',
			filterFn: filterFn_includesString,
			meta: {
				filter: 'text',
				filterPlaceholder: 'Search names...'
			}
		},

		{
			header: 'Email',
			accessorKey: 'email',
			filterFn: filterFn_includesString,
			meta: {
				filter: 'text',
				filterPlaceholder: 'Search emails...'
			}
		},

		{
			id: 'class',
			header: 'Class',
			accessorKey: 'yearJoined',
			cell: ({ row }) => className(row.original.yearJoined),

			filterFn: (row, columnId, value) => {
				if (!value) return true;
				console.log(value, row.getValue<number>(columnId));
				return value.includes(row.getValue<number>(columnId));
			},

			meta: {
				filter: 'select',
				filterPlaceholder: 'Any class',
				filterOptions: [
					{ label: 'Freshman', value: 'Freshman' },
					{ label: 'Sophomore', value: 'Sophomore' },
					{ label: 'Junior', value: 'Junior' },
					{ label: 'Senior', value: 'Senior' },
					{ label: 'Senior+', value: 'Senior+' },
					{ label: 'Grad Student', value: 'Grad Student' }
				]
			}
		},

		{
			header: 'Role',
			accessorKey: 'role',

			filterFn: (row, columnId, value) => {
				if (!value) return true;
				return value.includes(row.getValue<string>(columnId));
			},
			cell: ({ row }) => {
				return renderSnippet(Role, { role: row.original.role ?? '' });
			},
			meta: {
				filter: 'select',
				filterPlaceholder: 'Any role',
				filterOptions: [
					{ label: 'Member', value: 'member' },
					{ label: 'Admin', value: 'admin' },
					{ label: 'Leader', value: 'leader' },
					{ label: 'Viewer', value: 'viewer' }
				]
			}
		},

		{
			header: 'Phone',
			accessorKey: 'phoneNumber',
			filterFn: filterFn_includesString,
			meta: {
				filter: 'text',
				filterPlaceholder: 'Search phone numbers...'
			}
		},

		{
			header: 'Notes',
			accessorKey: 'notes',
			filterFn: filterFn_includesString,
			meta: {
				filter: 'text',
				filterPlaceholder: 'Search notes...'
			}
		},

		{
			id: 'paid',
			header: 'Paid',
			accessorKey: 'paidDues',
			cell: ({ row }) => {
				return renderSnippet(Paid, row);
			},

			filterFn: (row, columnId, value) => {
				if (!value) return true;

				return value.includes(row.original.paidDues);
			},

			meta: {
				filter: 'select',
				filterPlaceholder: 'Any payment status',
				filterOptions: [
					{ label: 'Paid', value: true },
					{ label: 'Unpaid', value: false }
				]
			}
		},

		{
			id: 'actions',
			header: '',
			enableSorting: false,
			enableColumnFilter: false,

			cell: ({ row }) => {
				// Keep your existing edit/delete/payment menu here.
				// I would move that menu into UserActions.svelte as well.
				return renderSnippet(Actions, row);
			}
		}
	] satisfies ColumnDef<TableFeatures, User>[];

	const userData = $derived(data.current ?? []);

	function openEdit(user: User) {
		editingUser = user;

		name = user.name;
		email = user.email;
		phoneNumber = user.phoneNumber;
		notes = user.notes ?? '';
		role = user.role ?? 'viewer';
		year = user.yearJoined;

		password = '';
	}

	function closeEdit() {
		editingUser = null;
		password = '';
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
				await updateUserPassword({
					userId: editingUser.id,
					password
				});
			}

			toast.success('User updated');

			closeEdit();

			await data.refresh();
		} catch (error) {
			console.error(error);

			toast.error(error instanceof Error ? error.message : 'Failed to update user');
		} finally {
			saving = false;
		}
	}
</script>

{#snippet Role({ role }: { role: string })}
	{#if role === 'admin'}
		<Badge variant="destructive">Admin</Badge>
	{:else if role === 'leader'}
		<Badge>Leader</Badge>
	{:else if role === 'member'}
		<Badge variant="secondary">Member</Badge>
	{:else}
		<Badge variant="outline">Viewer</Badge>
	{/if}
{/snippet}

{#snippet Paid(row: Row<TableFeatures, User>)}
	{@const sems = semestersPaid(row.original)}

	<div class="flex flex-col gap-1">
		{#if sems.length === 0}
			<Badge>Not Paid</Badge>
		{:else}
			{#each sems as sem, i (i)}
				<Badge>
					{sem}
				</Badge>
			{/each}
		{/if}
	</div>
{/snippet}

{#snippet Actions(row: Row<TableFeatures, User>)}
	{#if pageData.data.updateNotes}
		<Button variant="outline" size="sm" onclick={() => openEdit(row.original)}>Notes</Button>
	{/if}

	{#if pageData.data.editUser}
		<Button variant="outline" size="sm" onclick={() => openEdit(row.original)}>Edit</Button>
	{/if}

	{#if pageData.data.deleteUser}
		<DropdownMenu.Root>
			<DropdownMenu.Trigger
				class={buttonVariants({
					variant: 'outline',
					size: 'sm'
				})}>
				...
			</DropdownMenu.Trigger>

			<DropdownMenu.Content>
				<DropdownMenu.Group>
					<DropdownMenu.Label>User Actions</DropdownMenu.Label>

					<DropdownMenu.Separator />

					<ActionWrapper
						onclick={async () => {
							await updateUserPaid({
								id: row.original.id,
								paid: true,
								semesters: 2
							});

							data.refresh();
						}}>
						{#snippet children({ props, spinnerIcon })}
							<DropdownMenu.Item {...props} title="User paid for 2 semesters">
								{@render spinnerIcon()}
								Paid 2 semesters
							</DropdownMenu.Item>
						{/snippet}
					</ActionWrapper>

					<ActionWrapper
						onclick={async () => {
							await updateUserPaid({
								id: row.original.id,
								paid: true,
								semesters: 1
							});

							data.refresh();
						}}>
						{#snippet children({ props, spinnerIcon })}
							<DropdownMenu.Item {...props} title="User paid for 1 semester">
								{@render spinnerIcon()}
								Paid 1 semester
							</DropdownMenu.Item>
						{/snippet}
					</ActionWrapper>

					<ActionWrapper
						onclick={async () => {
							await updateUserPaid({
								id: row.original.id,
								paid: false,
								semesters: 1
							});

							data.refresh();
						}}>
						{#snippet children({ props, spinnerIcon })}
							<DropdownMenu.Item {...props} title="Set this user to unpaid">
								{@render spinnerIcon()}
								Mark user unpaid
							</DropdownMenu.Item>
						{/snippet}
					</ActionWrapper>

					<ActionWrapper
						onclick={async () => {
							const confirm = await Swal2.fire({
								title: 'Delete User',
								text: 'Are you sure you want to delete this user?',
								icon: 'warning',
								showCancelButton: true,
								confirmButtonText: 'Delete',
								cancelButtonText: 'Cancel'
							});

							if (!confirm.isConfirmed) {
								return;
							}

							await deleteUser({
								userId: row.original.id
							});

							data.refresh();
						}}>
						{#snippet children({ props, spinnerIcon })}
							<DropdownMenu.Item {...props} title="Delete this user">
								{@render spinnerIcon()}
								Delete
							</DropdownMenu.Item>
						{/snippet}
					</ActionWrapper>
				</DropdownMenu.Group>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	{/if}
{/snippet}

<div class="flex flex-col items-center justify-center">
	<Card.Root class="w-[98%] p-4 lg:w-[80%]">
		<Card.Header>
			<Card.Title>User Management</Card.Title>

			<Card.Description>
				Manage club members and their information.
				<br />
				You can shift click the sort icon to sort by multiple columns.
			</Card.Description>

			<Card.Action>
				{#if pageData.data.deleteUser}
					<ActionWrapper
						onclick={async () => {
							const con = await Swal2.fire({
								icon: 'warning',
								title: 'Are you sure.',
								text: 'Are your sure you want to remove all users older than 2 years',
								showDenyButton: true
							});
							if (con.isConfirmed) {
								await removeOldUsers();
								data.refresh();
							}
						}}>
						{#snippet children({ props, spinnerIcon })}
							<Button variant="link" size="sm" {...props}>
								{@render spinnerIcon()} Remove Old users
							</Button>
						{/snippet}
					</ActionWrapper>
				{/if}
			</Card.Action>
		</Card.Header>

		<Card.Content class="p-0">
			<DataTable data={userData} {columns} pageSize={25} emptyMessage="No users found." />
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
				<div>
					<Label for="name">Name</Label>

					<Input id="name" bind:value={name} class="mt-2" />
				</div>

				<div>
					<Label for="email">Email</Label>

					<Input id="email" type="email" bind:value={email} class="mt-2" />
				</div>

				<div>
					<Label for="phone">Phone Number</Label>

					<Input id="phone" type="tel" bind:value={phoneNumber} class="mt-2" />
				</div>

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
