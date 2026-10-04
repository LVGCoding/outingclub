<script lang="ts">
	import FileManager from '#lib/components/fileManager/FileManager.svelte';
</script>

<div class="flex flex-col items-center justify-center gap-2">
	<FileManager type="backgrounds" />
	<FileManager type="images" />
	<FileManager type="pdfs" />
	<FileManager type="goofyImages" />
</div>
