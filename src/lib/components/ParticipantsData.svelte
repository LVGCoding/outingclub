<script lang="ts">
	import * as Table from '#lib/components/ui/table';
	import { Card, CardContent, CardHeader, CardTitle } from '#lib/components/ui/card';
	import { Badge } from '#lib/components/ui/badge';
	import { Separator } from '#lib/components/ui/separator';
	import { Progress } from '#lib/components/ui/progress';
	import * as Select from '#lib/components/ui/select';
	import { BarChart3, Users } from 'lucide-svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import type { formResponse } from './FormElement.svelte';

	type Participant = {
		id: string;
		user: {
			id: string;
			name: string;
		};
		signup: {
			status: string;
			formData: formResponse[];
		};
	};

	let { participants }: { participants: Participant[] } = $props();

	/*
	 * Find every unique form field that occurs in the participant data.
	 *
	 * This intentionally uses the participant responses rather than the
	 * trip's formElements so that it works with the data you already sent
	 * to the client.
	 */
	const fields = $derived.by(() => {
		const map = new SvelteMap<string, string>();

		for (const participant of participants) {
			for (const response of participant.signup.formData ?? []) {
				if (!response) continue;

				if (!map.has(response.label)) {
					map.set(response.label, response.type);
				}
			}
		}

		return [...map.entries()].map(([label, type]) => ({
			label,
			type
		}));
	});

	let selectedField = $state('');

	const currentField = $derived(fields.find((field) => field.label === selectedField) ?? fields[0]);

	/*
	 * Pull all responses for the currently selected field.
	 */
	const responses = $derived.by(() => {
		if (!currentField) return [];

		return participants
			.map((participant) => {
				const response = (participant.signup.formData ?? []).find(
					(response) => response?.label === currentField.label
				);

				return {
					participant,
					response
				};
			})
			.filter(({ response }) => response !== null && response !== undefined);
	});

	/*
	 * Categorical aggregation.
	 *
	 * radio:
	 *   "Yes"      -> 12
	 *   "No"       -> 4
	 *
	 * checkbox:
	 *   "Tent"     -> 8
	 *   "Sleeping bag" -> 14
	 */
	const categoricalResults = $derived.by(() => {
		if (!currentField) return [];

		const counts = new SvelteMap<string, number>();

		for (const { response } of responses) {
			if (!response) continue;

			if (response.type === 'checkbox') {
				for (const value of response.value) {
					counts.set(value, (counts.get(value) ?? 0) + 1);
				}
			} else if (response.type === 'radio') {
				counts.set(response.value, (counts.get(response.value) ?? 0) + 1);
			}
		}

		return [...counts.entries()]
			.map(([value, count]) => ({
				value,
				count,
				percentage: responses.length > 0 ? (count / responses.length) * 100 : 0
			}))
			.sort((a, b) => b.count - a.count);
	});

	/*
	 * Numeric aggregation.
	 */
	const numericResults = $derived.by(() => {
		const values = responses
			.filter(
				(
					response
				): response is {
					participant: Participant;
					response: Extract<
						formResponse,
						{ type: 'text' | 'textarea' | 'date' | 'number' | 'radio' }
					>;
				} => response.response?.type === 'number'
			)
			.map(({ response }) => Number(response?.value))
			.filter(Number.isFinite);

		if (values.length === 0) {
			return null;
		}

		const sum = values.reduce((a, b) => a + b, 0);

		return {
			count: values.length,
			average: sum / values.length,
			min: Math.min(...values),
			max: Math.max(...values),
			sum
		};
	});

	/*
	 * Date aggregation.
	 *
	 * Useful for things such as:
	 * "What day are people arriving?"
	 */
	const dateResults = $derived.by(() => {
		if (currentField?.type !== 'date') return [];

		const counts = new SvelteMap<string, number>();

		for (const { response } of responses) {
			if (!response || response.type !== 'date') continue;

			counts.set(response.value, (counts.get(response.value) ?? 0) + 1);
		}

		return [...counts.entries()]
			.map(([value, count]) => ({
				value,
				count
			}))
			.sort((a, b) => a.value.localeCompare(b.value));
	});

	/*
	 * Free text responses aren't particularly useful as a chart,
	 * so expose them as a list instead.
	 */
	const textResults = $derived.by(() => {
		if (currentField?.type !== 'text' && currentField?.type !== 'textarea') {
			return [];
		}

		return responses
			.filter(({ response }) => response?.type === 'text' || response?.type === 'textarea')
			.map(({ participant, response }) => ({
				name: participant.user.name,
				value: response!.value
			}));
	});

	const maxCategoricalCount = $derived(
		Math.max(...categoricalResults.map((result) => result.count), 1)
	);

	const hasCategoricalData = $derived(
		currentField?.type === 'radio' || currentField?.type === 'checkbox'
	);

	const hasNumericData = $derived(currentField?.type === 'number');

	const hasDateData = $derived(currentField?.type === 'date');

	const hasTextData = $derived(currentField?.type === 'text' || currentField?.type === 'textarea');

	const responseCount = $derived(responses.length);

	const responsePercentage = $derived(
		participants.length > 0 ? Math.round((responseCount / participants.length) * 100) : 0
	);
</script>

<Card class="w-[98%] lg:w-[80%]">
	<CardHeader>
		<div class="flex items-center justify-between gap-4">
			<div>
				<CardTitle class="flex items-center gap-2">
					<BarChart3 class="size-5" />
					Participant Data
				</CardTitle>

				<p class="mt-1 text-sm text-muted-foreground">Aggregate responses from participants</p>
			</div>

			<div class="flex items-center gap-2">
				<Users class="size-4 text-muted-foreground" />

				<Badge variant="secondary">
					{responseCount} / {participants.length} responses
				</Badge>
			</div>
		</div>
	</CardHeader>

	<CardContent class="space-y-6">
		{#if fields.length === 0}
			<div class="py-8 text-center text-muted-foreground">No participant form data available.</div>
		{:else}
			<Select.Root
				type="single"
				value={currentField?.label}
				onValueChange={(value) => {
					if (value) selectedField = value;
				}}>
				<Select.Trigger class="w-full">
					{currentField?.label ?? 'Select a field'}
				</Select.Trigger>

				<Select.Content>
					{#each fields as field, i (i)}
						<Select.Item value={field.label}>
							{field.label}
							<span class="ml-2 text-muted-foreground">
								({field.type})
							</span>
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>

			{#if currentField}
				<div class="flex items-center justify-between">
					<div>
						<h3 class="font-medium">{currentField.label}</h3>

						<p class="text-sm text-muted-foreground capitalize">
							{currentField.type}
						</p>
					</div>

					<Badge variant="outline">
						{responsePercentage}% response rate
					</Badge>
				</div>

				<Separator />

				{#if hasCategoricalData}
					<div class="space-y-4">
						{#if categoricalResults.length === 0}
							<p class="text-sm text-muted-foreground">No responses.</p>
						{:else}
							{#each categoricalResults as result, i (i)}
								<div class="space-y-2">
									<div class="flex items-center justify-between gap-4">
										<span class="truncate text-sm font-medium">
											{result.value}
										</span>

										<span class="shrink-0 text-sm text-muted-foreground">
											{result.count}
											({Math.round(result.percentage)}%)
										</span>
									</div>

									<Progress value={(result.count / maxCategoricalCount) * 100} />
								</div>
							{/each}
						{/if}
					</div>

					<div class="overflow-hidden rounded-md border">
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head>Response</Table.Head>
									<Table.Head class="text-right">Count</Table.Head>
									<Table.Head class="text-right">Percentage</Table.Head>
								</Table.Row>
							</Table.Header>

							<Table.Body>
								{#each categoricalResults as result, i (i)}
									<Table.Row>
										<Table.Cell>{result.value}</Table.Cell>
										<Table.Cell class="text-right">
											{result.count}
										</Table.Cell>
										<Table.Cell class="text-right">
											{Math.round(result.percentage)}%
										</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</div>
				{:else if hasNumericData && numericResults}
					<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
						<div class="rounded-lg border p-4">
							<p class="text-sm text-muted-foreground">Average</p>
							<p class="text-2xl font-semibold">
								{numericResults.average.toFixed(1)}
							</p>
						</div>

						<div class="rounded-lg border p-4">
							<p class="text-sm text-muted-foreground">Minimum</p>
							<p class="text-2xl font-semibold">
								{numericResults.min}
							</p>
						</div>

						<div class="rounded-lg border p-4">
							<p class="text-sm text-muted-foreground">Maximum</p>
							<p class="text-2xl font-semibold">
								{numericResults.max}
							</p>
						</div>

						<div class="rounded-lg border p-4">
							<p class="text-sm text-muted-foreground">Responses</p>
							<p class="text-2xl font-semibold">
								{numericResults.count}
							</p>
						</div>
					</div>
				{:else if hasDateData}
					<div class="overflow-hidden rounded-md border">
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head>Date</Table.Head>
									<Table.Head class="text-right">Responses</Table.Head>
								</Table.Row>
							</Table.Header>

							<Table.Body>
								{#each dateResults as result, i (i)}
									<Table.Row>
										<Table.Cell>
											{result.value}
										</Table.Cell>

										<Table.Cell class="text-right">
											{result.count}
										</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</div>
				{:else if hasTextData}
					<div class="overflow-hidden rounded-md border">
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head>Participant</Table.Head>
									<Table.Head>Response</Table.Head>
								</Table.Row>
							</Table.Header>

							<Table.Body>
								{#each textResults as result, i (i)}
									<Table.Row>
										<Table.Cell class="font-medium">
											{result.name}
										</Table.Cell>

										<Table.Cell class="whitespace-pre-wrap">
											{result.value}
										</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</div>

					{#if textResults.length === 0}
						<p class="text-sm text-muted-foreground">No text responses.</p>
					{/if}
				{:else}
					<p class="text-sm text-muted-foreground">No data available for this field.</p>
				{/if}
			{/if}
		{/if}
	</CardContent>
</Card>
