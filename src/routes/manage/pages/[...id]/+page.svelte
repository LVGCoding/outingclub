<script lang="ts">
	import Page from '#lib/components/page/Page.svelte';
	import { page as pageState } from '$app/state';
	import { getPageById } from '../../../query/page.remote';

	let page = await getPageById({ id: pageState.params.id ?? '' });
	let title = $derived(page.title ?? '');
	let path = $derived(page.path ?? '');
	let type = $derived(page.pageCategory ?? '');
	let content = $derived.by(() => {
		let temp = $state(page.content ?? []);
		return temp;
	});
</script>

<div class="page flex flex-col items-center justify-center gap-2">
	<Page id={pageState.params.id} bind:title bind:content bind:type bind:path editMode={true} />
</div>
<div class="h-100"></div>

<style>
	.page :global(> *) {
		width: 98%;
	}
</style>
