<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Input from './ui/input/input.svelte';
	import parsePhoneNumber from 'libphonenumber-js';

	let { value = $bindable(), onchange }: HTMLInputAttributes = $props();
</script>

<Input
	{value}
	onchange={(e) => {
		console.log('in');
		const phoneNumber = parsePhoneNumber(e.currentTarget.value, { defaultCallingCode: 'US' });
		value = phoneNumber?.formatInternational();
		console.log(phoneNumber?.formatInternational());
		if (onchange) onchange(e);
	}} />
