<script module lang="ts">
	export type FilterOption = {
		label: string;
		value: string;
	};

	export type DataTableColumnMeta = {
		filter?: 'text' | 'select';
		filterOptions?: FilterOption[];
		filterPlaceholder?: string;
	};
</script>

<script lang="ts" generics="TData extends RowData">
	import {
		createTable,
		createFilteredRowModel,
		createPaginatedRowModel,
		createSortedRowModel,
		createExpandedRowModel,
		FlexRender,
		columnFilteringFeature,
		rowPaginationFeature,
		rowSortingFeature,
		rowExpandingFeature,
		tableFeatures
	} from '@tanstack/svelte-table';

	import type { Column, ColumnDef, Row, RowData } from '@tanstack/svelte-table';

	import type { Snippet } from 'svelte';

	import {
		ArrowDown01,
		ArrowDownUp,
		ArrowUp01,
		ChevronDown,
		ChevronLeft,
		ChevronRight,
		Funnel,
		X
	} from 'lucide-svelte';

	import * as Table from '#lib/components/ui/table';
	import * as Popover from '#lib/components/ui/popover';
	import * as Select from '#lib/components/ui/select';
	import { Button, buttonVariants } from '../ui/button';
	import { Input } from '../ui/input';
	import { cn } from '#lib/utils';

	type DataTableFeatures = ReturnType<typeof tableFeatures>;

	let {
		data,
		columns,
		pageSize = 25,
		emptyMessage = 'No results.',
		expandable = false,
		expandedRow
	}: {
		data: TData[];
		columns: ColumnDef<DataTableFeatures, TData>[];
		pageSize?: number;
		emptyMessage?: string;
		expandable?: boolean;
		expandedRow?: Snippet<
			[
				{
					row: Row<DataTableFeatures, TData>;
				}
			]
		>;
	} = $props();

	const features = tableFeatures({
		columnFilteringFeature,
		rowSortingFeature,
		rowPaginationFeature,
		rowExpandingFeature,

		filteredRowModel: createFilteredRowModel(),
		sortedRowModel: createSortedRowModel(),
		paginatedRowModel: createPaginatedRowModel(),
		expandedRowModel: createExpandedRowModel()
	});

	const table = createTable({
		features,
		columns,

		get data() {
			return data;
		},

		getRowCanExpand: () => expandable,

		initialState: {
			pagination: {
				pageIndex: 0,
				pageSize
			}
		},

		enableMultiSort: true
	});

	const pagination = $derived(table.atoms.pagination.get());
	const rowModel = $derived(table.getRowModel());

	const pageCount = $derived(Math.max(1, Math.ceil(rowModel.rows.length / pagination.pageSize)));

	function getColumnMeta(
		column: (typeof table)['getAllColumns'] extends () => infer C
			? C extends Array<infer U>
				? U
				: never
			: never
	): DataTableColumnMeta {
		return (column.columnDef.meta ?? {}) as DataTableColumnMeta;
	}

	function clearFilter(column: Column<DataTableFeatures, TData, unknown>) {
		column.setFilterValue(undefined);
	}

	function getFilterValue(column: Column<DataTableFeatures, TData, unknown>): unknown {
		const value = column.getFilterValue();

		if (value === undefined || value === null) {
			return '';
		}

		return value;
	}
</script>

<div class="space-y-3">
	<div class="overflow-hidden rounded-md border">
		<Table.Root>
			<Table.Header>
				{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
					<Table.Row>
						{#if expandable}
							<Table.Head class="w-10" />
						{/if}

						{#each headerGroup.headers as header (header.id)}
							<Table.Head>
								{#if !header.isPlaceholder}
									{@const column = header.column}
									{@const meta = getColumnMeta(column)}

									<div class="flex items-center gap-1">
										{#if column.getCanSort()}
											<button
												type="button"
												class="flex min-w-0 items-center gap-1 font-medium hover:text-foreground"
												onclick={column.getToggleSortingHandler()}>
												<span class="truncate">
													<FlexRender {header} />
												</span>

												{#if column.getIsSorted() === 'asc'}
													<span class="flex items-center gap-0.5">
														<ArrowUp01 size={16} />

														{#if column.getSortIndex() !== -1}
															<sup class="text-[10px]">
																{column.getSortIndex() + 1}
															</sup>
														{/if}
													</span>
												{:else if column.getIsSorted() === 'desc'}
													<span class="flex items-center gap-0.5">
														<ArrowDown01 size={16} />

														{#if column.getSortIndex() !== -1}
															<sup class="text-[10px]">
																{column.getSortIndex() + 1}
															</sup>
														{/if}
													</span>
												{:else}
													<span>
														<ArrowDownUp size={16} />
													</span>
												{/if}
											</button>
										{:else}
											<span class="truncate font-medium">
												<FlexRender {header} />
											</span>
										{/if}

										{#if column.getCanFilter() && meta.filter}
											<Popover.Root>
												<Popover.Trigger
													class={cn(
														'size-7 shrink-0',
														buttonVariants({
															variant: column.getIsFiltered() ? 'secondary' : 'ghost',
															size: 'icon'
														})
													)}
													aria-label={`Filter ${String(column.columnDef.header)}`}>
													<Funnel class="size-3.5" />
												</Popover.Trigger>

												<Popover.Content class="w-64" align="start">
													<div class="space-y-3">
														<div class="flex items-center justify-between">
															<div class="text-sm font-medium">Filter</div>

															{#if column.getIsFiltered()}
																<Button
																	variant="ghost"
																	size="sm"
																	class="h-7 px-2"
																	onclick={() => clearFilter(column)}>
																	<X class="mr-1 size-3.5" />
																	Clear
																</Button>
															{/if}
														</div>

														{#if meta.filter === 'text'}
															<Input
																placeholder={meta.filterPlaceholder ??
																	`Filter ${String(column.columnDef.header)}...`}
																value={getFilterValue(column)}
																oninput={(event) =>
																	column.setFilterValue(event.currentTarget.value)} />
														{:else if meta.filter === 'select'}
															<Select.Root
																type="multiple"
																value={getFilterValue(column) as string[]}
																onValueChange={(value) => {
																	column.setFilterValue(value.length ? value : undefined);
																}}>
																<Select.Trigger class="w-full">
																	<Select.Value
																		placeholder={meta.filterPlaceholder ??
																			`Filter ${String(column.columnDef.header)}...`} />
																</Select.Trigger>

																<Select.Content>
																	{#each meta.filterOptions ?? [] as option (option.value)}
																		<Select.Item value={option.value}>
																			{option.label}
																		</Select.Item>
																	{/each}
																</Select.Content>
															</Select.Root>
														{/if}
													</div>
												</Popover.Content>
											</Popover.Root>
										{/if}
									</div>
								{/if}
							</Table.Head>
						{/each}
					</Table.Row>
				{/each}
			</Table.Header>

			<Table.Body>
				{#if rowModel.rows.length === 0}
					<Table.Row>
						<Table.Cell
							colspan={columns.length + (expandable ? 1 : 0)}
							class="h-24 text-center text-muted-foreground">
							{emptyMessage}
						</Table.Cell>
					</Table.Row>
				{:else}
					{#each rowModel.rows as row (row.id)}
						<Table.Row>
							{#if expandable}
								<Table.Cell class="w-10 px-2">
									<Button
										variant="ghost"
										size="icon"
										class="size-8"
										aria-label={row.getIsExpanded() ? 'Collapse row' : 'Expand row'}
										onclick={row.getToggleExpandedHandler()}>
										{#if row.getIsExpanded()}
											<ChevronDown class="size-4" />
										{:else}
											<ChevronRight class="size-4" />
										{/if}
									</Button>
								</Table.Cell>
							{/if}

							{#each row.getAllCells() as cell (cell.id)}
								<Table.Cell>
									<FlexRender {cell} />
								</Table.Cell>
							{/each}
						</Table.Row>

						{#if expandable && row.getIsExpanded() && expandedRow}
							<Table.Row>
								<Table.Cell colspan={columns.length + 1} class="bg-muted/30 p-0">
									<div class="border-t px-6 py-4">
										{@render expandedRow({ row })}
									</div>
								</Table.Cell>
							</Table.Row>
						{/if}
					{/each}
				{/if}
			</Table.Body>
		</Table.Root>
	</div>

	<div class="flex items-center justify-between px-1">
		<div class="text-sm text-muted-foreground">
			{rowModel.rows.length} result{rowModel.rows.length === 1 ? '' : 's'}
		</div>

		<div class="flex items-center gap-2">
			<Button
				variant="outline"
				size="sm"
				disabled={!table.getCanPreviousPage()}
				onclick={() => table.previousPage()}>
				<ChevronLeft class="size-4" />
				Previous
			</Button>

			<span class="text-sm text-muted-foreground">
				Page {pagination.pageIndex + 1} of {pageCount}
			</span>

			<Button
				variant="outline"
				size="sm"
				disabled={!table.getCanNextPage()}
				onclick={() => table.nextPage()}>
				Next
				<ChevronRight class="size-4" />
			</Button>
		</div>
	</div>
</div>
