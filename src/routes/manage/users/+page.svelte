<script lang="ts">
	import {
		createTable,
		FlexRender,
		tableFeatures,
		rowSortingFeature,
		columnFilteringFeature,
		globalFilteringFeature,
		rowPaginationFeature,
		createSortedRowModel,
		createFilteredRowModel,
		createPaginatedRowModel,
		type ColumnDef,
		type FilterFn
	} from '@tanstack/svelte-table';

	import { Button, buttonVariants } from '#lib/components/ui/button';
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
		removeOldUsers,
		updateUser,
		updateUserNotes,
		updateUserPaid,
		updateUserPassword
	} from '../../query/trips.remote';

	import type { PageProps } from './$types';
	import { Swal2 } from '#lib/utils';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/';
	import ActionWrapper from '#lib/components/ActionWrapper.svelte';
	import { ArrowDown01, ArrowDownUp, ArrowUp01 } from 'lucide-svelte';

	let pageData: PageProps = $props();

	const data = getUsers();

	type User = NonNullable<typeof data.current>[number];

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

	function isPaid(user: User) {
		return semestersPaid(user).length > 0;
	}

	function roleValue(user: User) {
		return user.role ?? 'viewer';
	}

	function roleLabel(role: User['role']) {
		const value = role ?? 'viewer';

		return value.charAt(0).toUpperCase() + value.substring(1);
	}

	const roleFilter: FilterFn<typeof features, User> = (row, columnId, value) => {
		if (!value) return true;

		return row.getValue<string>(columnId) === value;
	};

	const classFilter: FilterFn<typeof features, User> = (row, columnId, value) => {
		if (!value) return true;

		return row.getValue<string>(columnId) === value;
	};

	const paidFilter: FilterFn<typeof features, User> = (row, columnId, value) => {
		if (!value) return true;

		const paid = isPaid(row.original);

		if (value === 'paid') {
			return paid;
		}

		if (value === 'unpaid') {
			return !paid;
		}

		return true;
	};

	const features = tableFeatures({
		rowSortingFeature,
		columnFilteringFeature,
		globalFilteringFeature,
		rowPaginationFeature,

		sortedRowModel: createSortedRowModel(),
		filteredRowModel: createFilteredRowModel(),
		paginatedRowModel: createPaginatedRowModel()
	});

	const columns: ColumnDef<typeof features, User>[] = [
		{
			accessorKey: 'name',
			header: 'Name'
		},

		{
			accessorKey: 'email',
			header: 'Email'
		},

		{
			id: 'class',
			accessorFn: (user) => className(user.yearJoined),
			header: 'Class',

			filterFn: classFilter,

			sortFn: (rowA, rowB) => {
				return rowA.original.yearJoined - rowB.original.yearJoined;
			}
		},

		{
			id: 'role',
			accessorFn: (user) => roleValue(user),
			header: 'Role',

			filterFn: roleFilter
		},

		{
			accessorKey: 'phoneNumber',
			header: 'Phone'
		},

		{
			accessorKey: 'notes',
			header: 'Notes'
		},

		{
			id: 'paid',
			accessorFn: (user) => isPaid(user),
			header: 'Paid',

			filterFn: paidFilter,

			sortFn: (rowA, rowB) => {
				return Number(isPaid(rowA.original)) - Number(isPaid(rowB.original));
			}
		},

		{
			id: 'actions',
			header: '',
			enableSorting: false,
			enableColumnFilter: false,
			enableGlobalFilter: false
		}
	];

	const table = createTable({
		features,
		columns,

		get data() {
			return data.current ?? [];
		},
		initialState: {
			pagination: {
				pageIndex: 0,
				pageSize: 25
			}
		}
	});

	const pagination = $derived(table.atoms.pagination.get());

	const globalFilter = $derived(table.atoms.globalFilter?.get() ?? '');

	const columnFilters = $derived(table.atoms.columnFilters.get());

	const roleFilterValue = $derived(
		String(columnFilters.find((filter) => filter.id === 'role')?.value ?? '')
	);

	const classFilterValue = $derived(
		String(columnFilters.find((filter) => filter.id === 'class')?.value ?? '')
	);

	const paidFilterValue = $derived(
		String(columnFilters.find((filter) => filter.id === 'paid')?.value ?? '')
	);

	const rows = $derived(table.getRowModel().rows);

	const filteredRowCount = $derived(table.getFilteredRowModel().rows.length);

	function clearFilters() {
		table.setGlobalFilter('');
		table.resetColumnFilters();
	}

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

<div class="flex flex-col items-center justify-center">
	<Card.Root class="w-[98%] lg:w-[80%]">
		<Card.Header>
			<Card.Title>User Management</Card.Title>

			<Card.Description>
				Manage club members and their information.
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
							<Button {...props}>{@render spinnerIcon()} Remove Old users</Button>
						{/snippet}
					</ActionWrapper>
				{/if}
			</Card.Description>

			<Card.Action>
				<div class="flex flex-wrap gap-2">
					<Input
						value={globalFilter}
						oninput={(event) => {
							table.setGlobalFilter(event.currentTarget.value);
						}}
						placeholder="Search users..."
						class="w-64" />

					<Select.Root
						type="single"
						value={roleFilterValue}
						onValueChange={(value) => {
							table.getColumn('role')?.setFilterValue(value ?? '');
						}}>
						<Select.Trigger class="w-32">
							{roleFilterValue ? roleLabel(roleFilterValue as User['role']) : 'All Roles'}
						</Select.Trigger>

						<Select.Content>
							<Select.Item value="">All Roles</Select.Item>
							<Select.Item value="member">Member</Select.Item>
							<Select.Item value="leader">Leader</Select.Item>
							<Select.Item value="admin">Admin</Select.Item>
							<Select.Item value="viewer">Viewer</Select.Item>
						</Select.Content>
					</Select.Root>

					<Select.Root
						type="single"
						value={classFilterValue}
						onValueChange={(value) => {
							table.getColumn('class')?.setFilterValue(value ?? '');
						}}>
						<Select.Trigger class="w-36">
							{classFilterValue || 'All Classes'}
						</Select.Trigger>

						<Select.Content>
							<Select.Item value="">All Classes</Select.Item>

							<Select.Item value="Freshman">Freshman</Select.Item>

							<Select.Item value="Sophomore">Sophomore</Select.Item>

							<Select.Item value="Junior">Junior</Select.Item>

							<Select.Item value="Senior">Senior</Select.Item>

							<Select.Item value="Senior+">Senior+</Select.Item>

							<Select.Item value="Grad Student">Grad Student</Select.Item>
						</Select.Content>
					</Select.Root>

					<Select.Root
						type="single"
						value={paidFilterValue}
						onValueChange={(value) => {
							table.getColumn('paid')?.setFilterValue(value ?? '');
						}}>
						<Select.Trigger class="w-32">
							{paidFilterValue === 'paid'
								? 'Paid'
								: paidFilterValue === 'unpaid'
									? 'Unpaid'
									: 'All Payment'}
						</Select.Trigger>

						<Select.Content>
							<Select.Item value="">All Payment</Select.Item>

							<Select.Item value="paid">Paid</Select.Item>

							<Select.Item value="unpaid">Unpaid</Select.Item>
						</Select.Content>
					</Select.Root>

					{#if globalFilter || roleFilterValue || classFilterValue || paidFilterValue}
						<Button variant="ghost" size="sm" onclick={clearFilters}>Clear</Button>
					{/if}
				</div>
			</Card.Action>
		</Card.Header>

		<Card.Content class="p-0">
			{#await data}
				<div class="p-8 text-center text-muted-foreground">Loading users...</div>
			{:then}
				{#if rows.length === 0}
					<Card.Root class="w-full border border-dashed! ring-0">
						<Card.Content>
							<p>No users found.</p>
						</Card.Content>
					</Card.Root>
				{:else}
					<div class="overflow-x-auto">
						<table class="w-full text-sm">
							<thead class="border-y bg-muted/50">
								{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
									<tr>
										{#each headerGroup.headers as header (header.id)}
											<th class="px-4 py-3 text-left font-medium">
												{#if !header.isPlaceholder}
													{#if header.column.getCanSort()}
														<button
															class="flex items-center gap-1 hover:text-foreground"
															onclick={header.column.getToggleSortingHandler()}>
															<FlexRender {header} />

															{#if header.column.getIsSorted() === 'asc'}
																<span><ArrowUp01 size={16} /></span>
															{:else if header.column.getIsSorted() === 'desc'}
																<span><ArrowDown01 size={16} /></span>
															{:else}
																<span><ArrowDownUp size={16} /></span>
															{/if}
														</button>
													{:else}
														<FlexRender {header} />
													{/if}
												{/if}
											</th>
										{/each}
									</tr>
								{/each}
							</thead>

							<tbody class="divide-y">
								{#each rows as row (row.id)}
									<tr class="hover:bg-muted/30">
										{#each row.getAllCells() as cell (cell.id)}
											<td class="px-4 py-3">
												{#if cell.column.id === 'name'}
													<div class="font-medium">
														{row.original.name}
													</div>
												{:else if cell.column.id === 'email'}
													<span class="text-muted-foreground">
														{row.original.email}
													</span>
												{:else if cell.column.id === 'class'}
													{className(row.original.yearJoined)}
												{:else if cell.column.id === 'role'}
													{#if row.original.role === 'admin'}
														<Badge variant="destructive">Admin</Badge>
													{:else if row.original.role === 'leader'}
														<Badge>Leader</Badge>
													{:else if row.original.role === 'member'}
														<Badge variant="secondary">Member</Badge>
													{:else}
														<Badge variant="outline">Viewer</Badge>
													{/if}
												{:else if cell.column.id === 'phoneNumber'}
													<span class="text-muted-foreground">
														{row.original.phoneNumber}
													</span>
												{:else if cell.column.id === 'notes'}
													<span class="text-muted-foreground">
														{row.original.notes}
													</span>
												{:else if cell.column.id === 'paid'}
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
												{:else if cell.column.id === 'actions'}
													<div class="flex gap-2 text-right">
														{#if pageData.data.updateNotes}
															<Button
																variant="outline"
																size="sm"
																onclick={() => openEdit(row.original)}>
																Notes
															</Button>
														{/if}

														{#if pageData.data.editUser}
															<Button
																variant="outline"
																size="sm"
																onclick={() => openEdit(row.original)}>
																Edit
															</Button>
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
																				<DropdownMenu.Item
																					{...props}
																					title="User paid for 2 semesters">
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
																				<DropdownMenu.Item
																					{...props}
																					title="User paid for 1 semester">
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
																				<DropdownMenu.Item
																					{...props}
																					title="Set this user to unpaid">
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
													</div>
												{:else}
													<FlexRender {cell} />
												{/if}
											</td>
										{/each}
									</tr>
								{/each}
							</tbody>
						</table>
					</div>

					<!-- Pagination -->
					<div class="flex items-center justify-between border-t px-4 py-3">
						<div class="text-sm text-muted-foreground">
							Showing
							{rows.length}
							of
							{filteredRowCount}
							users
						</div>

						<div class="flex items-center gap-2">
							<Select.Root
								type="single"
								value={String(pagination.pageSize)}
								onValueChange={(value) => {
									table.setPageSize(Number(value));
								}}>
								<Select.Trigger class="w-24">
									{pagination.pageSize}
								</Select.Trigger>

								<Select.Content>
									<Select.Item value="10">10</Select.Item>

									<Select.Item value="25">25</Select.Item>

									<Select.Item value="50">50</Select.Item>

									<Select.Item value="100">100</Select.Item>
								</Select.Content>
							</Select.Root>

							<Button
								variant="outline"
								size="sm"
								disabled={!table.getCanPreviousPage()}
								onclick={() => table.previousPage()}>
								Previous
							</Button>

							<span class="min-w-20 text-center text-sm">
								Page
								{pagination.pageIndex + 1}
								of
								{table.getPageCount()}
							</span>

							<Button
								variant="outline"
								size="sm"
								disabled={!table.getCanNextPage()}
								onclick={() => table.nextPage()}>
								Next
							</Button>
						</div>
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
