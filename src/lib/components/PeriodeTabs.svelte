<script lang="ts">
	import { LABEL_PERIODE } from '$lib/state/hitung';

	let { periode = $bindable() }: { periode: number } = $props();
</script>

<div class="inline-flex flex-wrap gap-1 rounded-lg border border-line bg-white p-1" role="group" aria-label="Periode">
	{#each LABEL_PERIODE as label, i (label)}
		<button
			class="rounded-md px-3 py-1.5 text-sm font-medium {periode === i
				? 'bg-brand text-white'
				: 'text-muted hover:bg-paper'}"
			aria-pressed={periode === i}
			onclick={() => (periode = i)}>{i < 4 ? `s.d. ${label}` : label}</button
		>
	{/each}
</div>
