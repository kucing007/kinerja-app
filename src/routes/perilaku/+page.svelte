<script lang="ts">
	import { resolve } from '$app/paths';
	import NilaiCard from '$lib/components/NilaiCard.svelte';
	import NpkForm from '$lib/components/NpkForm.svelte';
	import { kalibrasi } from '$lib/calc/kalibrasi';
	import { rating } from '$lib/calc/nkp';
	import { data } from '$lib/state/data.svelte';
	import { fmt, LABEL_PERIODE, npkAwal, TAHUNAN } from '$lib/state/hitung';

	const perPeriode = $derived(LABEL_PERIODE.map((_, p) => npkAwal(data, p)));
	const tahunan = $derived(perPeriode[TAHUNAN]);
</script>

<div class="space-y-5">
	<div>
		<h1 class="judul">Perilaku Kerja (NPK)</h1>
		<p class="text-sm text-muted">
			Nilai perilaku kerja hasil evaluasi 360° dari atasan, rekan kerja, dan bawahan. NPK menyumbang 25% pada NKP
			Awal.
		</p>
	</div>

	<div class="grid gap-3 sm:grid-cols-2">
		<NilaiCard
			judul="NPK Awal tahunan"
			nilai={tahunan}
			catatan="rata-rata NPK triwulanan yang terisi (KMK hal. 139)"
		/>
		<NilaiCard
			judul="NPK setelah kalibrasi 115"
			nilai={tahunan === null ? null : kalibrasi(tahunan)}
			catatan={tahunan === null ? 'belum ada nilai' : `rating: ${rating(kalibrasi(tahunan))}`}
		/>
	</div>

	<section class="card" aria-labelledby="judul-isi">
		<h2 id="judul-isi" class="judul">Isi nilai perilaku</h2>
		<div class="mt-3">
			<NpkForm />
		</div>
	</section>

	<section class="card" aria-labelledby="judul-periode">
		<h2 id="judul-periode" class="judul">NPK per periode</h2>
		<div class="mt-3 overflow-x-auto">
			<table class="tbl min-w-[24rem]">
				<thead>
					<tr>
						<th scope="col">Periode</th>
						<th scope="col">NPK Awal</th>
						<th scope="col">Setelah kalibrasi</th>
						<th scope="col">Rating</th>
					</tr>
				</thead>
				<tbody>
					{#each perPeriode as n, i (i)}
						<tr>
							<th scope="row" class="font-medium text-ink">{LABEL_PERIODE[i]}</th>
							<td>{fmt(n)}</td>
							<td>{fmt(n === null ? null : kalibrasi(n))}</td>
							<td>{n === null ? '–' : rating(kalibrasi(n))}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<p class="mt-2 text-xs text-muted">
			Rating perilaku: &gt;100 Di Atas Ekspektasi, 90–100 Sesuai Ekspektasi, &lt;90 Di Bawah Ekspektasi.
		</p>
	</section>

	<details class="card">
		<summary class="cursor-pointer font-semibold">Panduan rentang nilai perilaku (KMK hal. 134)</summary>
		<ul class="mt-3 space-y-1 text-sm">
			<li>&gt;115–120: konsisten menerapkan ≥ 6 perilaku kunci dan menjadi teladan</li>
			<li>&gt;105–115: konsisten 5 perilaku kunci</li>
			<li>&gt;100–105: konsisten 4 perilaku kunci</li>
			<li>95–100: konsisten 3 perilaku kunci</li>
			<li>90–&lt;95: konsisten 2 perilaku kunci</li>
			<li>70–&lt;90: 1 perilaku kunci atau tidak ada</li>
			<li>&lt;70: dijatuhi hukuman disiplin (Ringan 60–&lt;70, Sedang 50–&lt;60, Berat &lt;50)</li>
		</ul>
		<p class="mt-2 text-xs text-muted">
			Penilaian maksimal 120 dan dikalibrasi menjadi maksimal 115 bagi non-JPTM. Nilai ini ditetapkan evaluator,
			jadi angka di sini adalah perkiraan Anda sendiri.
		</p>
	</details>

	<p class="text-sm">
		<a class="text-brand underline" href={resolve('/')}>Lihat pengaruhnya pada NKP →</a>
	</p>
</div>
