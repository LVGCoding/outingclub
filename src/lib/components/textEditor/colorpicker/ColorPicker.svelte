<!-- eslint-disable-next-line svelte/no-unused-svelte-ignore -->
<!-- svelte-ignore state_referenced_locally -->
<script lang="ts">
	import { Input } from '#lib/components/ui/input';
	import Label from '#lib/components/ui/label/label.svelte';
	import {
		basicColors,
		transformColor,
		type Position,
		skipAddingToHistoryStack
	} from './helpers.js';
	import MoveWrapper from './MoveWrapper.svelte';

	const WIDTH = 214;
	const HEIGHT = 214;

	interface Props {
		color: string;
		onChange: ((value: string, skipHistoryStack: boolean) => void) | undefined;
	}

	let { color, onChange }: Props = $props();

	let selfColor = $state(
		color === ''
			? { hex: '', rgb: { b: 0, g: 0, r: 0 }, hsv: { h: 0, s: 0, v: 0 } }
			: transformColor('hex', color)
	);
	let inputColor = $state(color);
	let innerDivRef: HTMLDivElement | null = $state(null);

	let saturationPosition = $derived({
		x: (selfColor.hsv.s / 100) * WIDTH,
		y: ((100 - selfColor.hsv.v) / 100) * HEIGHT
	});

	let huePosition = $derived({
		x: (selfColor.hsv.h / 360) * WIDTH
	});

	const onSetHex = (hex: string) => {
		inputColor = hex;
		if (/^#[0-9A-Fa-f]{6}$/i.test(hex)) {
			const newColor = transformColor('hex', hex);
			selfColor = newColor;
		}
		if (onChange) onChange(selfColor.hex, $skipAddingToHistoryStack);
	};

	const onMoveSaturation = ({ x, y }: Position) => {
		const newHsv = {
			...selfColor.hsv,
			s: (x / WIDTH) * 100,
			v: 100 - (y / HEIGHT) * 100
		};
		const newColor = transformColor('hsv', newHsv);
		selfColor = newColor;
		inputColor = newColor.hex;
		if (onChange) onChange(selfColor.hex, $skipAddingToHistoryStack);
	};

	const onMoveHue = ({ x }: Position) => {
		const newHsv = { ...selfColor.hsv, h: (x / WIDTH) * 360 };
		const newColor = transformColor('hsv', newHsv);

		selfColor = newColor;
		inputColor = newColor.hex;
		if (onChange) onChange(selfColor.hex, $skipAddingToHistoryStack);
	};

	// Check if the dropdown is actually active
	// $effect(() => {
	// 	if (innerDivRef !== null && onChange) {
	// 		inputColor = selfColor.hex;
	// 	}
	// });

	$effect(() => {
		if (color) {
			const newColor =
				color === ''
					? { hex: '', rgb: { b: 0, g: 0, r: 0 }, hsv: { h: 0, s: 0, v: 0 } }
					: transformColor('hex', color);
			selfColor = newColor;
			inputColor = newColor.hex;
		}
	});
</script>

<div class="color-picker-wrapper" style="width: {WIDTH}px" bind:this={innerDivRef}>
	<Label>Hex</Label>
	<Input onchange={(e) => onSetHex(e.currentTarget.value)} value={inputColor} width="160px" />
	<div class="color-picker-basic-color">
		<!-- eslint-disable svelte/require-each-key -->
		{#each basicColors as basicColor}
			<!-- svelte-ignore a11y_consider_explicit_label -->
			<button
				type="button"
				class={basicColor === selfColor.hex ? ' active' : ''}
				style="background-color: {basicColor}"
				onclick={() => {
					inputColor = basicColor;
					selfColor = transformColor('hex', basicColor);

					if (onChange) onChange(selfColor.hex, $skipAddingToHistoryStack);
				}}>
			</button>
		{/each}
		<!-- svelte-ignore a11y_consider_explicit_label -->
		<button
			type="button"
			class={'none' + ('' === selfColor.hex ? ' active' : '')}
			style="background-color: none;"
			onclick={() => {
				inputColor = '';
				selfColor = { hex: '', rgb: { b: 0, g: 0, r: 0 }, hsv: { h: 0, s: 0, v: 0 } };
				if (onChange) onChange(selfColor.hex, $skipAddingToHistoryStack);
			}}>
		</button>
	</div>
	<MoveWrapper
		className="color-picker-saturation"
		style="background-color: hsl({selfColor.hsv.h}, 100%, 50%)"
		onChange={onMoveSaturation}>
		<div
			class="color-picker-saturation_cursor"
			style="background-color: {selfColor.hex}; left: {saturationPosition.x}px; top: {saturationPosition.y}px">
		</div>
	</MoveWrapper>
	<MoveWrapper className="color-picker-hue" onChange={onMoveHue}>
		<div
			class="color-picker-hue_cursor"
			style="background-color: hsl({selfColor.hsv.h}, 100%, 50%); left: {huePosition.x}px">
		</div>
	</MoveWrapper>
	<div class="color-picker-color" style="background-color: {selfColor.hex}"></div>
</div>

<style>
	.color-picker-basic-color {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin: 0;
		padding: 0;
	}

	.color-picker-basic-color button {
		border: 1px solid #ccc;
		border-radius: 4px;
		height: 16px;
		width: 16px;
		cursor: pointer;
		list-style-type: none;
	}

	.color-picker-basic-color button.active {
		box-shadow: 0px 0px 2px 2px rgba(0, 0, 0, 0.3);
	}

	.color-picker-saturation_cursor {
		position: absolute;
		width: 20px;
		height: 20px;
		border: 2px solid #ffffff;
		border-radius: 50%;
		box-shadow: 0 0 15px #00000026;
		box-sizing: border-box;
		transform: translate(-10px, -10px);
	}
	.color-picker-hue_cursor {
		position: absolute;
		width: 20px;
		height: 20px;
		border: 2px solid #ffffff;
		border-radius: 50%;
		box-shadow: #0003 0 0 0 0.5px;
		box-sizing: border-box;
		transform: translate(-10px, -4px);
	}

	.color-picker-color {
		border: 1px solid #ccc;
		margin-top: 15px;
		width: 100%;
		height: 20px;
	}

	.none {
		position: relative;
	}

	.none::after {
		content: '';
		position: absolute;

		width: 143%;
		height: 2px;

		background: red;

		bottom: 0;
		left: 0;

		transform: rotate(-45deg);
		transform-origin: bottom left;
	}
</style>
