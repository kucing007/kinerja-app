<script lang="ts">
	import { bobotKualitasIki, nilaiK3, rentangTargetK3, syaratTargetMaks, type ZonaTarget } from '$lib/calc/k3';
	import type { Iki } from '$lib/calc/types';
	import { fmt } from '$lib/state/hitung';

	let { iki }: { iki: Iki } = $props();

	const angka = (n: number | null) => (n === null ? '–' : n.toLocaleString('id-ID', { maximumFractionDigits: 4 }));

	const target = $derived(iki.target[3]);
	const bobotKualitas = $derived(bobotKualitasIki(iki.validitas, iki.kendali));
	const bobotTetap = $derived(
		iki.targetMaksimal ? 1.2 : iki.jenis === 'baruTanpaHistoris' || iki.polarisasi === 'stabilize' ? 1 : null
	);
	// IKI baru dengan data historis: historis target disamakan dengan historis realisasi
	const t1 = $derived(iki.jenis === 'baruHistoris' ? iki.realisasiY1 : iki.targetY1);
	const r1 = $derived(iki.realisasiY1);
	const polarisasi = $derived(iki.polarisasi === 'minimize' ? 'minimize' : 'maximize');

	const zona = $derived(
		bobotTetap === null && t1 !== null && r1 !== null
			? rentangTargetK3(t1, r1, polarisasi).map((z) => ({
					...z,
					bobot: iki.jenis === 'mandatory' ? Math.max(1, z.bobot) : z.bobot
				}))
			: []
	);
	const syarat = $derived(t1 !== null && r1 !== null ? syaratTargetMaks(t1, r1, polarisasi) : null);

	const cocok = (z: ZonaTarget, x: number | null) =>
		x !== null &&
		(z.titik
			? Math.abs(x - (z.dari as number)) < 1e-9
			: (z.dari === null || x > z.dari) && (z.sampai === null || x < z.sampai));

	const rentang = (z: ZonaTarget) =>
		z.titik
			? `Target = ${angka(z.dari)}`
			: z.dari === null
				? `Target < ${angka(z.sampai)}`
				: z.sampai === null
					? `Target > ${angka(z.dari)}`
					: `${angka(z.dari)} < Target < ${angka(z.sampai)}`;

	const WARNA: Record<string, string> = {
		'1.2': 'bg-emerald-600',
		'1.1': 'bg-emerald-400',
		'1': 'bg-sky-400',
		'0.9': 'bg-amber-400',
		'0.8': 'bg-red-400'
	};
</script>

<div class="rounded-lg border border-line bg-paper/60 p-3">
	<div class="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">Peta target → K3</div>

	{#if bobotKualitas === null}
		<p class="text-sm text-red-700">Kombinasi validitas/kendali tidak diatur KMK.</p>
	{:else if bobotTetap !== null}
		<p class="text-sm">
			Bobot kualitas target tetap <b>{fmt(bobotTetap)}</b> berapa pun targetnya → K3
			<b>{fmt(nilaiK3(bobotKualitas, bobotTetap))}</b>.
		</p>
	{:else if zona.length === 0}
		<p class="text-sm text-muted">
			Isi {iki.jenis === 'baruHistoris' ? 'realisasi' : 'target dan realisasi'} tahun sebelumnya (Y-1) untuk melihat
			peta target.
		</p>
	{:else}
		{#if syarat}
			<p class="mb-2 text-sm">
				Agar bobot target maksimal (1,20): <b>Target {syarat.arah} {angka(syarat.batas)}</b> → K3
				<b>{fmt(nilaiK3(bobotKualitas, 1.2))}</b>
			</p>
		{/if}
		<ul class="space-y-1">
			{#each zona as z, i (i)}
				{@const aktif = cocok(z, target)}
				<li
					class="flex items-center gap-2 rounded-md px-2 py-1 text-sm {aktif
						? 'bg-white ring-2 ring-brand'
						: ''}"
				>
					<span class="h-2.5 w-2.5 shrink-0 rounded-full {WARNA[String(z.bobot)]}"></span>
					<span class="flex-1">{rentang(z)}</span>
					<span class="tabular-nums text-muted">target {fmt(z.bobot)}</span>
					<span class="w-16 text-right font-semibold tabular-nums">K3 {fmt(nilaiK3(bobotKualitas, z.bobot))}</span>
				</li>
			{/each}
		</ul>
		{#if target === null}
			<p class="mt-2 text-xs text-muted">Ketik target tahun depan untuk menandai zonanya.</p>
		{/if}
	{/if}
</div>
