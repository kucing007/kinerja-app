<script lang="ts">
	import { notifikasi, tutupNotifikasi } from '$lib/state/urungkan.svelte';
</script>

<div class="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4" aria-live="polite">
	{#if notifikasi.pesan}
		{@const p = notifikasi.pesan}
		<div class="pointer-events-auto flex items-center gap-4 rounded-xl bg-ink px-4 py-3 text-sm text-white shadow-xl">
			<span>{p.teks}</span>
			<button
				type="button"
				class="font-semibold text-sky-300 hover:underline"
				onclick={() => {
					p.pulihkan();
					tutupNotifikasi();
				}}>Urungkan</button
			>
			<button type="button" class="text-white/60 hover:text-white" onclick={tutupNotifikasi} aria-label="Tutup pemberitahuan"
				>✕</button
			>
		</div>
	{/if}
</div>
