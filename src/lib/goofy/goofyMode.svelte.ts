import { goofyImages } from '#lib/generated/images';

const STORAGE_KEY = 'goofy-mode';

let enabled = $state(false);

const originalSources = new WeakMap<HTMLImageElement, string>();

let observer: MutationObserver | undefined;

function getRandomGoofyImage() {
	return goofyImages[Math.floor(Math.random() * goofyImages.length)];
}

function goofyifyImage(image: HTMLImageElement) {
	if (!originalSources.has(image)) {
		originalSources.set(image, image.src);
	}

	if (!image.dataset.goofy) {
		image.src = getRandomGoofyImage();
		image.dataset.goofy = 'true';
	}
}

function goofyifyImages() {
	document.querySelectorAll<HTMLImageElement>('img').forEach(goofyifyImage);
}

function restoreImages() {
	document.querySelectorAll<HTMLImageElement>('img').forEach((image) => {
		const original = originalSources.get(image);

		if (original) {
			image.src = original;
		}

		delete image.dataset.goofy;
	});
}

function startObserver() {
	if (observer || typeof document === 'undefined') return;

	observer = new MutationObserver((mutations) => {
		if (!enabled) return;

		for (const mutation of mutations) {
			for (const node of mutation.addedNodes) {
				if (!(node instanceof Element)) continue;

				if (node instanceof HTMLImageElement) {
					goofyifyImage(node);
				}

				node.querySelectorAll<HTMLImageElement>('img').forEach(goofyifyImage);
			}
		}
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true
	});
}

function apply() {
	if (typeof document === 'undefined') return;

	if (enabled) {
		goofyifyImages();
		startObserver();
	} else {
		restoreImages();
		observer?.disconnect();
		observer = undefined;
	}
}

function initialize() {
	if (typeof window === 'undefined') return;

	enabled = localStorage.getItem(STORAGE_KEY) === 'true';

	requestAnimationFrame(apply);
}

function toggle() {
	enabled = !enabled;

	localStorage.setItem(STORAGE_KEY, String(enabled));

	apply();
}

function set(value: boolean) {
	enabled = value;

	localStorage.setItem(STORAGE_KEY, String(value));

	apply();
}

export const goofyMode = {
	get enabled() {
		return enabled;
	},

	toggle,
	set,
	initialize
};
