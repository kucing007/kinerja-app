<script lang="ts">
	import { BOBOT_KUALITAS } from '$lib/calc/k3';
	import type { Kendali, Validitas } from '$lib/calc/types';
	import { fmt } from '$lib/state/hitung';

	let { validitas = $bindable(), kendali = $bindable() }: { validitas: Validitas; kendali: Kendali } = $props();

	const V: [Validitas, string][] = [
		['exact', 'Exact'],
		['proxy', 'Proxy'],
		['activity', 'Activity']
	];
	const K: [Kendali, string][] = [
		['low', 'Low'],
		['moderate', 'Moderate'],
		['high', 'High']
	];
</script>

<table class="text-xs">
	<caption class="sr-only">Bobot kualitas IKI berdasarkan validitas dan tingkat kendali</caption>
	<thead>
		<tr>
			<th class="px-1 pb-1 text-left font-medium text-muted">
				<span class="sr-only">Validitas</span><span aria-hidden="true">Kendali →</span>
			</th>
			{#each K as [, label] (label)}<th scope="col" class="px-1 pb-1 font-medium text-muted">{label}</th>{/each}
		</tr>
	</thead>
	<tbody>
		{#each V as [v, vLabel] (v)}
			<tr>
				<th scope="row" class="pr-2 text-left font-medium text-muted">{vLabel}</th>
				{#each K as [k, kLabel] (k)}
					{@const bobot = BOBOT_KUALITAS[v][k]}
					{@const pilih = validitas === v && kendali === k}
					<td class="p-0.5">
						<button
							type="button"
							class="h-9 w-14 rounded-md border text-sm tabular-nums {pilih
								? 'border-brand bg-brand text-white'
								: 'border-line bg-white hover:border-brand'} disabled:cursor-not-allowed disabled:border-dashed disabled:bg-paper disabled:text-muted"
							disabled={bobot === undefined}
							aria-pressed={pilih}
							aria-label={bobot === undefined
								? `${vLabel}, kendali ${kLabel}: tidak diatur KMK`
								: `${vLabel}, kendali ${kLabel}: bobot ${fmt(bobot)}`}
							onclick={() => {
								validitas = v;
								kendali = k;
							}}>{bobot === undefined ? '–' : fmt(bobot)}</button
						>
					</td>
				{/each}
			</tr>
		{/each}
	</tbody>
</table>
<p class="mt-1 text-[11px] text-muted">Kotak bergaris putus: kombinasi tidak diatur KMK.</p>
<details class="mt-2 max-w-xs text-xs text-muted">
	<summary class="cursor-pointer font-medium text-brand">Cara menentukan validitas & kendali</summary>
	<p class="mt-1">
		<b>Proxy</b>: dampak/outcome, tindak lanjut rekomendasi audit eksternal, kecepatan penyelesaian, kadar
		baik-buruk, akurasi/deviasi, nominal rupiah, kebijakan min. setingkat PPTM.
	</p>
	<p class="mt-1">
		<b>Activity</b>: kemajuan tahapan, output tanpa aspek kualitas/waktu, frekuensi pekerjaan.
	</p>
	<p class="mt-1">
		<b>Kendali</b>: Low = hasil banyak dipengaruhi pihak lain (bobot lebih tinggi); High = hasil sepenuhnya di
		tangan pegawai. (KMK hal. 70-71, 123)
	</p>
</details>
