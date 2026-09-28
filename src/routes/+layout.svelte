<script lang="ts">
	import './layout.css';
	import { toggleMode, ModeWatcher } from 'mode-watcher';
	import type { LayoutProps } from './$types';
	import Button from '#lib/components/ui/button/button.svelte';
	import { enhance } from '$app/forms';
	import { cn } from '#lib/utils';
	import { page } from '$app/state';
	import { MoonIcon, SunIcon } from 'lucide-svelte';
	import { bgImages } from '#lib/generated/images';
	import { MediaQuery } from 'svelte/reactivity';

	let { children, data }: LayoutProps = $props();

	let manageItems = $derived.by(() => {
		let items = [];
		if (data.canCreateTrips) items.push({ label: 'Manage Trips', href: '/manage/trips' });
		if (data.canViewUsers) items.push({ label: 'Manage Users', href: '/manage/users' });
		if (data.canCreatePages) items.push({ label: 'Manage Pages', href: '/manage/pages' });
		return items;
	});

	const isDesktop = new MediaQuery('(min-width: 64rem)');
</script>

{#snippet link({ label, href }: { label: string; href: string | undefined })}
	<li>
		<a
			class={cn(
				'block border-b-2 border-transparent px-0 py-3 marker:hidden hover:border-accent lg:p-4',
				{
					'border-accent': page.url.pathname === href
				}
			)}
			{href}>
			{label}
		</a>
	</li>
{/snippet}
{#snippet dropdown({
	label,
	href,
	items
}: {
	label: string;
	href: string | undefined;
	items: { label: string; href: string }[];
})}
	{#if isDesktop.current}
		<div class="group/dd relative">
			<a
				type="button"
				{href}
				class={cn(
					'block border-b-2 border-transparent px-0 py-3 marker:hidden hover:border-accent lg:p-4',
					{
						'border-accent': page.url.pathname === href
					}
				)}
				aria-haspopup="true">
				{label}
				<i class="bi bi-chevron-down text-xs transition-transform group-hover/dd:rotate-180"></i>
			</a>
			<div
				class="invisible absolute top-full left-0 z-20 pt-3 opacity-0 transition-opacity duration-200 group-focus-within/dd:visible group-focus-within/dd:opacity-100 group-hover/dd:visible group-hover/dd:opacity-100">
				<ul
					class="min-w-50 rounded-xl border border-white/10 bg-black/80 p-2 text-white backdrop-blur">
					{#each items as item, i (i)}
						<li>
							<a
								href={item.href}
								class="block rounded-md px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white">
								{item.label}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	{:else}
		{#if href}
			{@render link({ href, label })}
		{/if}
		{#each items as item, i (i)}
			{@render link({ href: item.href, label: item.label })}
		{/each}
	{/if}
{/snippet}
<ModeWatcher defaultMode="dark" />
<svelte:head>
	<link rel="icon" href="/ROC_favicon.png" />
	<title>Rpi Outing Trips</title>
</svelte:head>
<header class="dark flex flex-wrap items-center border-b bg-background px-6 py-2 lg:px-16 lg:py-0">
	<div class="flex flex-1 items-center justify-between">
		<a href="/">
			<img style="min-width:48px;" class="h-12" alt="logo" src="/logo.png" />
		</a>
	</div>

	<label for="menu-toggle" class="pointer-cursor block lg:hidden">
		<svg
			class="fill-current text-foreground"
			xmlns="http://www.w3.org/2000/svg"
			width="20"
			height="20"
			viewBox="0 0 20 20">
			<title>menu</title>
			<path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z"></path>
		</svg>
	</label>
	<input class="hidden" type="checkbox" id="menu-toggle" />

	<div class="hidden w-full lg:flex lg:w-auto lg:items-center" id="menu">
		<nav>
			<ul class="items-center justify-between pt-4 text-base text-foreground lg:flex lg:pt-0">
				{@render link({ href: '/', label: 'Home' })}
				{#if data.paths['activity']}
					{@render dropdown({
						label: 'Activities',
						href: undefined,
						items: data.paths['activity'].map((path) => ({
							label: path.title,
							href: `/activities/${path.path}`
						}))
					})}
				{/if}
				{#if data.paths['club']}
					{@render dropdown({
						label: 'Club',
						href: undefined,
						items: data.paths['club'].map((path) => ({
							label: path.title,
							href: `/club/${path.path}`
						}))
					})}
				{/if}
				{#if data.paths['social']}
					{@render dropdown({
						label: 'Social Media',
						href: undefined,
						items: data.paths['social'].map((path) => ({
							label: path.title,
							href: path.path
						}))
					})}
				{/if}
				{@render link({ href: '/trip', label: 'Trips' })}
				{#if manageItems.length > 0}
					{@render dropdown({
						label: 'Manage',
						href: undefined,
						items: manageItems
					})}
				{/if}
				{#if data.user}
					<form
						class="flex flex-1 items-center justify-between pr-2"
						method="post"
						action="/login/?/signOut"
						use:enhance>
						<Button style="margin-top: 10px; margin-bottom: 8px;" variant="outline" type="submit">
							Sign out
						</Button>
					</form>
				{:else}
					{@render link({ href: '/login', label: 'Login/Register' })}
				{/if}
				<Button class="bg-card" onclick={toggleMode} variant="outline" size="icon">
					<SunIcon
						class="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all! dark:scale-0 dark:-rotate-90" />
					<MoonIcon
						class="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all! dark:scale-100 dark:rotate-0" />
					<span class="sr-only">Toggle theme</span>
				</Button>
			</ul>
		</nav>
	</div>
</header>
<div
	class="height-full w-full grow overflow-y-auto p-5 lg:p-10"
	style="background-image: url(/{bgImages[
		Math.floor(Math.random() * bgImages.length)
	]});  background-size: cover;
	background-position: center;
">
	{@render children()}
</div>

<style>
	#menu-toggle:checked + #menu {
		display: block;
	}
</style>
