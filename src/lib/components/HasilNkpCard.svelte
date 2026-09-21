<script lang="ts">
	import type { HasilNkp } from '$lib/calc/nkp';
	import { fmt, warnaStatus } from '$lib/state/hitung';
	import PredikatBadge from './PredikatBadge.svelte';

	let { judul, hasil }: { judul: string; hasil: HasilNkp | null } = $props();

	const WARNA = {
		merah: 'border-l-red-500',
		kuning: 'border-l-amber-400',
		hijau: 'border-l-emerald-500',
		netral: 'border-l-line'
	};
	const persen = (b: number) => `${fmt(b * 100, 0)}%`;
</script>

<div class="card border-l-4 {WARNA[warnaStatus(hasil?.nkp)]}">
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div>
			<div class="text-xs font-medium text-muted">{judul}</div>
			<div class="text-4xl font-semibold tracking-tight tabular-nums">{fmt(hasil?.nkp)}</div>
			<div class="mt-1 text-xs text-muted">
				{hasil ? `NKP Awal ${fmt(hasil.nkpAwal)} · bobot NKO ${persen(hasil.bobotNko)}` : 'Belum bisa dihitung'}
			</div>
		</div>
		<div class="sm:text-right">
			<div class="mb-1 text-xs text-muted">Predikat Kinerja</div>
			<PredikatBadge predikat={hasil?.predikat ?? null} />
		</div>
	</div>
	{#if hasil}
		<dl class="mt-4 grid gap-2 sm:grid-cols-2">
			<div class="stat">
				<dt>Rating Hasil Kerja</dt>
				<dd class="text-sm">
					{hasil.nhk.rating} <span class="font-normal text-muted">({fmt(hasil.nhk.akhir)})</span>
				</dd>
			</div>
			<div class="stat">
				<dt>Rating Perilaku Kerja</dt>
				<dd class="text-sm">
					{hasil.npk.rating} <span class="font-normal text-muted">({fmt(hasil.npk.akhir)})</span>
				</dd>
			</div>
		</dl>
	{/if}
</div>
