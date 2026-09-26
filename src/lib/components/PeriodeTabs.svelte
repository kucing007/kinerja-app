<script lang="ts">
	import { LABEL_PERIODE } from '$lib/state/hitung';

	let { periode = $bindable() }: { periode: number } = $props();
</script>

<div class="inline-flex gap-0.5 rounded-lg border border-line bg-white p-0.5" role="group" aria-label="Periode">
	{#each LABEL_PERIODE as label, i (label)}
		<button
			type="button"
			class="rounded-md px-2.5 py-1 text-sm font-medium whitespace-nowrap {periode === i
				? 'bg-brand text-white'
				: 'text-muted hover:bg-paper hover:text-ink'}"
			aria-pressed={periode === i}
			onclick={() => (periode = i)}>{i < 4 ? `s.d. ${label}` : label}</button
		>
	{/each}
</div>
