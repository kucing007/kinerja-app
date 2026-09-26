<script lang="ts">
	import NumInput from '$lib/components/NumInput.svelte';
	import { enterPindahBaris } from '$lib/components/grid';
	import { kalibrasi } from '$lib/calc/kalibrasi';
	import { CORE_VALUES } from '$lib/calc/npk';
	import { rating } from '$lib/calc/nkp';
	import { data } from '$lib/state/data.svelte';
	import { fmt, LABEL_PERIODE, npkAwal, TAHUNAN, warnaStatus } from '$lib/state/hitung';
	import { tampilan } from '$lib/state/periode.svelte';

	const Q = [0, 1, 2, 3];
	const perPeriode = $derived(LABEL_PERIODE.map((_, p) => npkAwal(data, p)));
	const MODE = [
		['langsung', 'NPK per triwulan'],
		['coreValue', 'Dari 7 core value']
	] as const;
	const WARNA_RATING = { merah: 'text-red-700', kuning: 'text-ink', hijau: 'text-emerald-700', netral: 'text-muted' };
</script>

<div class="space-y-5">
	<div class="flex flex-wrap items-end justify-between gap-4">
		<div>
			<h1 class="judul">Perilaku Kerja (NPK) tahun {data.tahun}</h1>
			<p class="max-w-2xl text-sm text-muted">
				Nilai perilaku hasil evaluasi 360° dari atasan, rekan kerja, dan bawahan; menyumbang 25% pada NKP Awal. Nilai
				ditetapkan evaluator, jadi angka di sini adalah perkiraan Anda sendiri.
			</p>
		</div>
		<div class="inline-flex rounded-lg border border-line bg-white p-0.5" role="radiogroup" aria-label="Cara mengisi NPK">
			{#each MODE as [nilai, teks] (nilai)}
				<button
					type="button"
					role="radio"
					aria-checked={data.npk.mode === nilai}
					class="rounded-md px-3 py-1.5 text-sm font-medium {data.npk.mode === nilai
						? 'bg-brand text-white'
						: 'text-muted hover:bg-paper hover:text-ink'}"
					onclick={() => (data.npk.mode = nilai)}>{teks}</button
				>
			{/each}
		</div>
	</div>

	<div class="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
		<section class="card overflow-x-auto" aria-label="Nilai perilaku per triwulan">
			{#if data.npk.mode === 'langsung'}
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
				<table class="tbl min-w-[32rem]" onkeydown={enterPindahBaris}>
					<thead>
						<tr>
							<th scope="col">Periode</th>
							<th scope="col" class="w-40">NPK Awal</th>
							<th scope="col">Setelah kalibrasi 115</th>
							<th scope="col">Rating</th>
						</tr>
					</thead>
					<tbody>
						{#each Q as q (q)}
							<tr class={q === tampilan.periode ? 'bg-brand-soft/50' : ''}>
								<th scope="row" class="font-medium text-ink"><label for="npk-{q}">{LABEL_PERIODE[q]}</label></th>
								<td class="py-1.5"><NumInput id="npk-{q}" bind:value={data.npk.langsung[q]} data-kol="npk" /></td>
								<td>{fmt(perPeriode[q] === null ? null : kalibrasi(perPeriode[q]))}</td>
								<td class={WARNA_RATING[warnaStatus(perPeriode[q] === null ? null : kalibrasi(perPeriode[q]))]}>
									{perPeriode[q] === null ? '–' : rating(kalibrasi(perPeriode[q]))}
								</td>
							</tr>
						{/each}
					</tbody>
					<tfoot>
						<tr class="border-t-2 border-line {tampilan.periode === TAHUNAN ? 'bg-brand-soft/50' : ''}">
							<th scope="row" class="px-2 py-2 text-left font-semibold">Tahunan</th>
							<td class="px-2 py-2 font-semibold tabular-nums">{fmt(perPeriode[TAHUNAN])}</td>
							<td class="px-2 py-2 font-semibold tabular-nums">
								{fmt(perPeriode[TAHUNAN] === null ? null : kalibrasi(perPeriode[TAHUNAN]))}
							</td>
							<td class="px-2 py-2 font-semibold">
								{perPeriode[TAHUNAN] === null ? '–' : rating(kalibrasi(perPeriode[TAHUNAN]))}
							</td>
						</tr>
					</tfoot>
				</table>
				<p class="mt-2 text-xs text-muted">NPK tahunan = rata-rata NPK triwulanan yang terisi (KMK hal. 139).</p>
			{:else}
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
				<table class="tbl min-w-[40rem]" onkeydown={enterPindahBaris}>
					<thead>
						<tr>
							<th scope="col">Core value</th>
							{#each Q as q (q)}<th scope="col" class={q === tampilan.periode ? 'text-brand' : ''}>{LABEL_PERIODE[q]}</th>{/each}
						</tr>
					</thead>
					<tbody>
						{#each CORE_VALUES as cv, c (cv)}
							<tr>
								<th scope="row" class="font-normal text-ink">{cv}</th>
								{#each Q as q (q)}
									<td class="py-1.5">
										<NumInput bind:value={data.npk.coreValue[q][c]} label="{cv} {LABEL_PERIODE[q]}" data-kol="cv{q}" />
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
					<tfoot>
						<tr class="border-t-2 border-line">
							<th scope="row" class="px-2 py-2 text-left font-semibold">NPK triwulan</th>
							{#each Q as q (q)}<td class="px-2 py-2 font-semibold tabular-nums">{fmt(perPeriode[q])}</td>{/each}
						</tr>
						<tr>
							<th scope="row" class="px-2 py-1 text-left text-xs font-normal text-muted">Setelah kalibrasi</th>
							{#each Q as q (q)}
								<td class="px-2 py-1 text-xs text-muted tabular-nums">
									{fmt(perPeriode[q] === null ? null : kalibrasi(perPeriode[q]))}
								</td>
							{/each}
						</tr>
					</tfoot>
				</table>
				<p class="mt-2 text-xs text-muted">
					NPK triwulan = rata-rata nilai seluruh core value pada triwulan itu (KMK hal. 138). NPK tahunan
					<b class="text-ink tabular-nums">{fmt(perPeriode[TAHUNAN])}</b>, setelah kalibrasi
					<b class="text-ink tabular-nums">{fmt(perPeriode[TAHUNAN] === null ? null : kalibrasi(perPeriode[TAHUNAN]))}</b>.
				</p>
			{/if}
		</section>

		<aside class="card text-sm" aria-labelledby="judul-panduan">
			<h2 id="judul-panduan" class="text-base font-semibold">Panduan rentang nilai (KMK hal. 134)</h2>
			<dl class="mt-3 space-y-1.5">
				{#each [['>115–120', '≥ 6 perilaku kunci konsisten, menjadi teladan'], ['>105–115', '5 perilaku kunci konsisten'], ['>100–105', '4 perilaku kunci konsisten'], ['95–100', '3 perilaku kunci konsisten'], ['90–<95', '2 perilaku kunci konsisten'], ['70–<90', '1 perilaku kunci atau tidak ada'], ['<70', 'dijatuhi hukuman disiplin']] as [rentang, arti] (rentang)}
					<div class="grid grid-cols-[5.5rem_1fr] gap-2">
						<dt class="font-semibold tabular-nums">{rentang}</dt>
						<dd class="text-muted">{arti}</dd>
					</div>
				{/each}
			</dl>
			<p class="mt-3 border-t border-line pt-3 text-xs text-muted">
				Rating: &gt;100 Di Atas Ekspektasi, 90–100 Sesuai Ekspektasi, &lt;90 Di Bawah Ekspektasi. Nilai maksimal 120,
				dikalibrasi menjadi maksimal 115 bagi non-JPTM. Hukdis: Ringan 60–&lt;70, Sedang 50–&lt;60, Berat &lt;50.
			</p>
		</aside>
	</div>
</div>
