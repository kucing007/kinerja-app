<script lang="ts">
	import { tick } from 'svelte';
	import NumInput from '$lib/components/NumInput.svelte';
	import RincianIki from '$lib/components/RincianIki.svelte';
	import { enterPindahBaris } from '$lib/components/grid';
	import { konsolidasi, konsolidasiSampai, targetTahunan } from '$lib/calc/capaian';
	import { k3Iki, syaratTargetMaks } from '$lib/calc/k3';
	import { kalibrasi } from '$lib/calc/kalibrasi';
	import { hitungNhk } from '$lib/calc/nhk';
	import { npkTahunan } from '$lib/calc/npk';
	import type { Iki } from '$lib/calc/types';
	import { data, ikiBaru } from '$lib/state/data.svelte';
	import { fmt } from '$lib/state/hitung';
	import { hapusDenganUrungkan } from '$lib/state/urungkan.svelte';

	let asumsiCapaian = $state(100);

	const rincian = $derived(data.rencana.map((iki) => k3Iki(iki)));
	const proyeksi = $derived(hitungNhk(rincian.map((r) => ({ capaian: asumsiCapaian, k3: r.k3 }))));
	const rataK3 = (nilai: (number | null)[]) => npkTahunan(nilai);
	const k3Rencana = $derived(rataK3(rincian.map((r) => r.k3)));
	const k3Berjalan = $derived(rataK3(data.ikis.map((iki) => k3Iki(iki).k3)));
	const angka = (n: number) => n.toLocaleString('id-ID', { maximumFractionDigits: 4 });

	/** What Target Y needs for the maximum bobot target (1,20), mirroring K3TargetBar */
	function saran(iki: Iki): { teks: string; tercapai: boolean | null } {
		if (iki.targetMaksimal) return { teks: 'tetap 1,20', tercapai: null };
		if (iki.jenis === 'baruTanpaHistoris' || iki.polarisasi === 'stabilize') return { teks: 'tetap 1,00', tercapai: null };
		const t1 = iki.jenis === 'baruHistoris' ? iki.realisasiY1 : iki.targetY1;
		if (t1 === null || iki.realisasiY1 === null) return { teks: 'isi data Y-1', tercapai: null };
		const pol = iki.polarisasi === 'minimize' ? 'minimize' : 'maximize';
		const s = syaratTargetMaks(t1, iki.realisasiY1, pol);
		const ty = iki.target[3];
		return {
			teks: `${s.arah} ${angka(s.batas)}`,
			tercapai: ty === null ? null : s.arah === '>' ? ty > s.batas : ty < s.batas
		};
	}

	function salinDariBerjalan() {
		if (data.rencana.length && !confirm('Ganti rencana yang ada dengan salinan IKI tahun berjalan?')) return;
		data.rencana = data.ikis.map((iki) => {
			const tahunan = konsolidasiSampai(iki.target, iki.realisasi, iki.konsolidasi, 3);
			return {
				...ikiBaru(iki.nama),
				polarisasi: iki.polarisasi,
				validitas: iki.validitas,
				kendali: iki.kendali,
				konversi120: iki.konversi120,
				targetMaksimal: iki.targetMaksimal,
				realisasiTerburuk: iki.realisasiTerburuk,
				skalaStabilize: iki.skalaStabilize.map((t) => ({ ...t })),
				// Next year the IKI has this year's data as history
				jenis: iki.jenis === 'mandatory' ? 'mandatory' : 'lama',
				targetY1: targetTahunan(iki),
				realisasiY1: tahunan?.realisasi ?? konsolidasi(iki.realisasi, iki.konsolidasi)
			};
		});
	}

	let dibuka = $state<number | null>(null);
	let tabel = $state<HTMLTableElement>();

	async function tambah() {
		data.rencana.push(ikiBaru(''));
		await tick();
		tabel?.querySelector<HTMLTextAreaElement>(`tbody:last-of-type [data-kol="nama"]`)?.focus();
	}
	function hapus(i: number) {
		dibuka = null;
		hapusDenganUrungkan(
			() => data.rencana,
			(baru) => {
				data.rencana = baru;
			},
			i,
			`Rencana "${data.rencana[i].nama || `IKI ${i + 1}`}" dihapus.`
		);
	}
</script>

<div class="space-y-5">
	<div class="flex flex-wrap items-end justify-between gap-4">
		<div>
			<h1 class="judul">Perencanaan IKI tahun {data.tahun + 1}</h1>
			<p class="max-w-3xl text-sm text-muted">
				K3 = (bobot kualitas IKI + bobot kualitas target) / 2. Untuk K3 maksimal, pilih validitas/kendali yang lebih
				tinggi di <b>Rincian</b> dan tetapkan target sesuai kolom <b>Syarat bobot 1,20</b> (KMK hal. 70-74).
			</p>
		</div>
		<div class="flex flex-wrap gap-2">
			<button type="button" class="btn" onclick={salinDariBerjalan} disabled={data.ikis.length === 0}>
				Salin dari IKI tahun {data.tahun}
			</button>
			<button type="button" class="btn-ghost" onclick={tambah}>+ Tambah IKI baru</button>
		</div>
	</div>

	{#if data.rencana.length === 0}
		<section class="card text-sm text-muted">
			Belum ada rencana. <b class="text-ink">Salin dari IKI tahun {data.tahun}</b> agar target & realisasi tahun ini
			otomatis menjadi data Y-1, atau tambah IKI baru.
		</section>
	{:else}
		<section class="card overflow-x-auto p-0 sm:p-0" aria-label="Tabel rencana IKI">
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<table bind:this={tabel} class="w-full min-w-[66rem] text-sm" onkeydown={enterPindahBaris}>
				<thead class="bg-paper/70 text-xs text-muted">
					<tr>
						<th scope="col" class="w-8 py-2 pl-4 text-left font-medium">#</th>
						<th scope="col" class="px-2 py-2 text-left font-medium">Indikator</th>
						<th scope="col" class="w-28 px-1.5 py-2 text-left font-medium">Target {data.tahun}</th>
						<th scope="col" class="w-28 px-1.5 py-2 text-left font-medium">Realisasi {data.tahun}</th>
						<th scope="col" class="w-28 px-1.5 py-2 text-left font-semibold text-ink">Target {data.tahun + 1}</th>
						<th scope="col" class="w-32 px-2 py-2 text-left font-medium">Syarat bobot 1,20</th>
						<th scope="col" class="w-20 border-l border-line px-2 py-2 text-right font-medium">Bobot kualitas</th>
						<th scope="col" class="w-20 px-2 py-2 text-right font-medium">Bobot target</th>
						<th scope="col" class="w-16 px-2 py-2 text-right font-medium">K3</th>
						<th scope="col" class="w-24 py-2 pr-4 pl-2 text-right font-medium">Bobot tertimbang</th>
					</tr>
				</thead>
				{#each data.rencana as iki, i (iki.id)}
					{@const r = rincian[i]}
					{@const s = saran(iki)}
					{@const bt = proyeksi.baris[i]?.bobotTertimbang ?? null}
					<tbody class="border-t border-line">
						<tr>
							<td class="py-2 pl-4 align-top text-xs font-semibold text-brand">{i + 1}</td>
							<td class="px-2 py-2">
								<textarea
									rows="1"
									class="input block field-sizing-content min-h-9 resize-none font-medium"
									placeholder="Nama indikator kinerja"
									aria-label="Nama rencana IKI {i + 1}"
									data-kol="nama"
									bind:value={iki.nama}
								></textarea>
								<div class="mt-1 flex items-center justify-between gap-2 px-1 text-xs text-muted">
									<span class="min-w-0">
										{{ lama: 'IKI lama', baruHistoris: 'IKI baru, ada historis', baruTanpaHistoris: 'IKI baru, tanpa historis', mandatory: 'IKI mandatory' }[iki.jenis]}
										{#if r.bobotTarget.catatan && iki.target[3] !== null}
											<span class="block text-amber-800">! K3: {r.bobotTarget.catatan}</span>
										{/if}
									</span>
									<button
										type="button"
										class="shrink-0 rounded-md px-2 py-0.5 font-medium text-brand hover:bg-brand-soft"
										onclick={() => (dibuka = i)}
										aria-label="Rincian rencana IKI {i + 1}">Rincian</button
									>
								</div>
							</td>
							<td class="px-1.5 py-2 align-top">
								{#if iki.jenis === 'lama' || iki.jenis === 'mandatory'}
									<NumInput bind:value={iki.targetY1} label="Target {data.tahun} IKI {i + 1}" data-kol="t1" />
								{:else}
									<span class="block px-2.5 py-1.5 text-muted" title="Tidak dipakai untuk jenis IKI ini">–</span>
								{/if}
							</td>
							<td class="px-1.5 py-2 align-top">
								{#if iki.jenis !== 'baruTanpaHistoris'}
									<NumInput bind:value={iki.realisasiY1} label="Realisasi {data.tahun} IKI {i + 1}" data-kol="r1" />
								{:else}
									<span class="block px-2.5 py-1.5 text-muted" title="Tidak dipakai untuk jenis IKI ini">–</span>
								{/if}
							</td>
							<td class="px-1.5 py-2 align-top">
								<NumInput
									bind:value={iki.target[3]}
									label="Target {data.tahun + 1} IKI {i + 1}"
									data-kol="ty"
									class="font-semibold {iki.target[3] === null ? 'border-amber-400 bg-amber-50' : ''}"
								/>
							</td>
							<td class="px-2 py-2 align-top">
								<span
									class="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm tabular-nums {s.tercapai === true
										? 'bg-emerald-50 text-emerald-800'
										: s.tercapai === false
											? 'bg-amber-50 text-amber-900'
											: 'text-muted'}"
								>
									{#if s.tercapai === true}<span aria-label="terpenuhi">✓</span>{/if}
									{s.teks}
								</span>
							</td>
							<td class="border-l border-line px-2 py-2 text-right align-top tabular-nums leading-9">
								{fmt(r.bobotKualitas)}
							</td>
							<td class="px-2 py-2 text-right align-top tabular-nums leading-9">{fmt(r.bobotTarget.bobot)}</td>
							<td class="px-2 py-2 text-right align-top leading-9">
								<button
									type="button"
									tabindex="-1"
									class="rounded-md px-1.5 font-semibold tabular-nums hover:bg-brand-soft hover:text-brand"
									title="Atur K3 di Rincian"
									onclick={() => (dibuka = i)}
									>{fmt(r.k3)}{#if r.bobotTarget.catatan && iki.target[3] !== null}<span class="text-amber-700" aria-hidden="true"
											>!</span
										>{/if}</button
								>
							</td>
							<td class="py-2 pr-4 pl-2 text-right align-top text-muted tabular-nums leading-9">
								{bt === null ? '–' : `${fmt(bt * 100, 1)}%`}
							</td>
						</tr>
					</tbody>
				{/each}
			</table>
		</section>

		<section class="card grid gap-6 md:grid-cols-[12rem_minmax(0,1fr)]" aria-labelledby="judul-proyeksi">
			<div>
				<h2 id="judul-proyeksi" class="text-xs font-medium text-muted">Rata-rata K3 rencana</h2>
				<div class="text-2xl font-semibold tabular-nums">{fmt(k3Rencana)}</div>
				<div class="text-xs text-muted">tahun {data.tahun}: {fmt(k3Berjalan)}</div>
			</div>
			<div>
				<label class="label" for="asumsi">
					Proyeksi: bila capaian semua IKI <b class="text-ink tabular-nums">{asumsiCapaian}</b>
				</label>
				<input id="asumsi" type="range" min="50" max="120" step="1" class="w-full accent-brand" bind:value={asumsiCapaian} />
				<p class="text-sm">
					NHK Awal <b class="tabular-nums">{fmt(proyeksi.nhk)}</b> → setelah kalibrasi
					<b class="tabular-nums">{fmt(proyeksi.nhk === null ? null : kalibrasi(proyeksi.nhk))}</b>
					<span class="text-xs text-muted">(nilai kualitas capaian = capaian × K3, maks. 120)</span>
				</p>
			</div>
		</section>
	{/if}
</div>

{#if dibuka !== null && data.rencana[dibuka]}
	{@const i = dibuka}
	<RincianIki
		bind:iki={data.rencana[i]}
		nomor={i + 1}
		mode="rencana"
		ontutup={() => (dibuka = null)}
		onhapus={() => hapus(i)}
	/>
{/if}
