<script lang="ts">
	// Sticky bar under the header: one period for every page, plus the live NKP while the user is
	// entering data elsewhere, so no page needs a "see the effect on NKP" detour.
	import { resolve } from '$app/paths';
	import { data } from '$lib/state/data.svelte';
	import { fmt, ringkasan } from '$lib/state/hitung';
	import { tampilan } from '$lib/state/periode.svelte';
	import { selesaiSimulasi, sim } from '$lib/state/simulasi.svelte';
	import PeriodeTabs from './PeriodeTabs.svelte';
	import PredikatBadge from './PredikatBadge.svelte';

	/** false on the Nilai Kinerja page, whose content already is the result */
	let { tampilkanNilai = true }: { tampilkanNilai?: boolean } = $props();

	const r = $derived(ringkasan(data, tampilan.periode));
	const sementara = $derived(r.iki.some((b) => b.dikecualikan));
	const kosong = $derived(
		[r.nhkAwal === null && 'NHK', r.npkAwal === null && 'NPK', r.nko === null && 'NKO'].filter((x) => x !== false)
	);
</script>

<div
	class="sticky top-0 z-20 border-b {sim.aktif ? 'border-amber-300 bg-amber-100' : 'border-line bg-white/95 backdrop-blur'}"
>
	<div class="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2">
		<div class="flex items-center gap-2">
			<span class="text-xs font-medium text-muted">Periode</span>
			<PeriodeTabs bind:periode={tampilan.periode} />
		</div>

		{#if sim.aktif}
			<div class="flex flex-1 flex-wrap items-center justify-between gap-2 text-sm text-amber-900" role="status">
				<span><b>Mode Simulasi.</b> Angka yang diubah di halaman ini tidak disimpan.</span>
				<button type="button" class="btn-ghost" onclick={selesaiSimulasi}>Kembali ke data asli</button>
			</div>
		{:else if tampilkanNilai}
			<a
				href={resolve('/')}
				class="group flex flex-1 flex-wrap items-center gap-x-4 gap-y-1 rounded-lg px-2 py-1 text-sm hover:bg-paper"
			>
				<span class="flex items-baseline gap-1.5">
					<span class="text-xs text-muted">NKP</span>
					<b class="text-lg tabular-nums">{fmt(r.nkp?.nkp)}</b>
				</span>
				<PredikatBadge predikat={r.nkp?.predikat ?? null} kecil />
				<span class="flex gap-3 text-xs text-muted tabular-nums">
					<span>NHK Awal <b class="text-ink">{fmt(r.nhkAwal)}</b>{#if sementara}<span class="text-amber-800">*</span>{/if}</span>
					<span>NPK Awal <b class="text-ink">{fmt(r.npkAwal)}</b></span>
					<span>NKO <b class="text-ink">{fmt(r.nko)}</b></span>
				</span>
				{#if kosong.length}
					<span class="text-xs text-amber-800">Belum diisi: {kosong.join(', ')}</span>
				{:else if sementara}
					<span class="text-xs text-amber-800">* NHK sementara, ada realisasi yang belum diisi</span>
				{/if}
				<span class="ml-auto text-xs font-medium text-brand group-hover:underline"
					><span class="sr-only">Buka rincian Nilai Kinerja</span><span class="hidden xl:inline" aria-hidden="true">Rincian →</span></span
				>
			</a>
		{/if}
	</div>
</div>
