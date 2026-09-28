<script lang="ts">
	import Page from '#lib/components/page/Page.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let title = $derived(data.page.title ?? '');
	let type = $derived(data.page.pageCategory ?? '');
	let content = $derived.by(() => {
		let temp = $state(data.page.content ?? []);
		return temp;
	});
</script>

<div class="page flex flex-col items-center justify-center gap-2">
	<Page {title} {content} {type} editMode={false} />
</div>
<div class="h-100"></div>

<style>
	.page :global(> *) {
		width: 98%;
	}
</style>
