<script lang="ts">
	import { tick } from 'svelte';
	import NumInput from '$lib/components/NumInput.svelte';
	import RincianIki from '$lib/components/RincianIki.svelte';
	import { kalibrasi } from '$lib/calc/kalibrasi';
	import { data, ikiBaru } from '$lib/state/data.svelte';
	import { fmt, LABEL_PERIODE, rincianIki, TAHUNAN, warnaStatus } from '$lib/state/hitung';
	import { tampilan } from '$lib/state/periode.svelte';
	import { hapusDenganUrungkan } from '$lib/state/urungkan.svelte';
	import { enterPindahBaris } from '$lib/components/grid';

	const Q = [0, 1, 2, 3];
	const LABEL_POL = { maximize: 'Maximize', minimize: 'Minimize', stabilize: 'Stabilize' };
	const LABEL_KONS = { tlkv: 'nilai terakhir', sum: 'dijumlah', average: 'dirata-rata' };

	const periode = $derived(tampilan.periode);
	const sampai = $derived(Math.min(periode, 3));
	const labelPeriode = $derived(periode < TAHUNAN ? `s.d. ${LABEL_PERIODE[periode]}` : 'Tahunan');
	const hasil = $derived(rincianIki(data.ikis, periode));
	const dihitung = $derived(hasil.baris.filter((b) => b.nhk.kontribusi !== null).length);

	/** Target set but realisasi empty in a quarter this period counts: the exact cell to fill */
	const perluRealisasi = (i: number, q: number) =>
		q <= sampai && data.ikis[i].target[q] !== null && data.ikis[i].realisasi[q] === null;

	let dibuka = $state<number | null>(null);
	let tabel = $state<HTMLTableElement>();

	async function tambah() {
		data.ikis.push(ikiBaru(''));
		await tick();
		tabel?.querySelector<HTMLTextAreaElement>(`tbody:last-of-type [data-kol="nama"]`)?.focus();
	}
	function hapus(i: number) {
		dibuka = null;
		const nama = data.ikis[i].nama || `IKI ${i + 1}`;
		hapusDenganUrungkan(
			() => data.ikis,
			(baru) => {
				data.ikis = baru;
			},
			i,
			`"${nama}" dihapus.`
		);
	}
</script>

<div class="space-y-5">
	<div class="flex flex-wrap items-end justify-between gap-4">
		<div>
			<h1 class="judul">Hasil Kerja (IKI) tahun {data.tahun}</h1>
			<p class="max-w-2xl text-sm text-muted">
				Isi target dan realisasi langsung di tabel; tekan Enter untuk turun ke IKI berikutnya. Polarisasi, jenis IKI,
				dan K3 diatur sekali setahun lewat <b>Rincian</b>.
			</p>
		</div>
		<div class="text-right">
			<div class="text-xs font-medium text-muted">NHK Awal {labelPeriode}</div>
			<div class="text-3xl font-semibold tabular-nums">
				{fmt(hasil.nhkAwal)}{#if hasil.dikecualikan.length}<span class="text-amber-700">*</span>{/if}
			</div>
			<div class="text-xs text-muted">
				setelah kalibrasi {fmt(hasil.nhkAwal === null ? null : kalibrasi(hasil.nhkAwal))} · {dihitung} dari
				{data.ikis.length} IKI dihitung
			</div>
		</div>
	</div>

	{#if hasil.dikecualikan.length}
		<p class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="status">
			<b>* NHK sementara.</b> Belum ikut dihitung: {hasil.dikecualikan.join(', ')}. Isi sel bertanda kuning, atau pilih
			periode yang lebih awal.
		</p>
	{/if}

	{#if data.ikis.length === 0}
		<section class="card flex flex-col items-start gap-3">
			<h2 class="judul">Belum ada IKI</h2>
			<p class="max-w-2xl text-sm text-muted">
				Tambahkan Indikator Kinerja Individu sesuai kontrak kinerja Anda. Non-Pimpinan UPK minimal 3 IKI (maks. 6
				Pelaksana, 7 Pengawas, 8 Administrator).
			</p>
			<button type="button" class="btn" onclick={tambah}>+ Tambah IKI pertama</button>
		</section>
	{:else}
		<section class="card overflow-x-auto p-0 sm:p-0" aria-label="Tabel IKI">
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<table bind:this={tabel} class="w-full min-w-[58rem] text-sm" onkeydown={enterPindahBaris}>
				<thead class="bg-paper/70 text-xs text-muted">
					<tr>
						<th scope="col" class="w-8 py-2 pl-4 text-left font-medium">#</th>
						<th scope="col" class="px-2 py-2 text-left font-medium">Indikator</th>
						<th scope="col" class="w-20 px-2 py-2"><span class="sr-only">Baris</span></th>
						{#each Q as q (q)}
							<th scope="col" class="w-22 px-1.5 py-2 text-left font-medium {q > sampai ? 'text-muted/60' : 'text-ink'}">
								{LABEL_PERIODE[q]}
							</th>
						{/each}
						<th scope="col" class="w-20 border-l border-line px-2 py-2 text-right font-medium">Capaian</th>
						<th scope="col" class="w-20 px-2 py-2 text-right font-medium">K3</th>
						<th scope="col" class="hidden w-20 px-2 py-2 text-right font-medium xl:table-cell" title="Nilai kualitas capaian">NKC</th>
						<th scope="col" class="hidden w-16 px-2 py-2 text-right font-medium xl:table-cell">Bobot</th>
						<th scope="col" class="w-24 py-2 pr-4 pl-2 text-right font-medium">Kontribusi</th>
					</tr>
				</thead>
				{#each data.ikis as iki, i (iki.id)}
					{@const b = hasil.baris[i]}
					<tbody class="border-t border-line {b?.dikecualikan ? 'bg-amber-50/40' : ''}">
						<tr>
							<td rowspan="2" class="py-2 pl-4 align-top text-xs font-semibold text-brand">{i + 1}</td>
							<td class="px-2 pt-2 pb-0.5">
								<!-- Wraps instead of truncating: IKI names are often a full sentence -->
								<textarea
									rows="1"
									class="input block field-sizing-content min-h-9 resize-none font-medium"
									placeholder="Nama indikator kinerja"
									aria-label="Nama IKI {i + 1}"
									data-kol="nama"
									bind:value={iki.nama}
								></textarea>
							</td>
							<th scope="row" class="px-2 pt-2 pb-0.5 text-left text-xs font-medium text-muted">Target</th>
							{#each Q as q (q)}
								<td class="px-1.5 pt-2 pb-0.5 {q > sampai ? 'opacity-60' : ''}">
									<NumInput
										bind:value={iki.target[q]}
										label="Target {LABEL_PERIODE[q]} IKI {i + 1}"
										data-kol="t{q}"
									/>
								</td>
							{/each}
							<td
								rowspan="2"
								class="border-l border-line px-2 text-right tabular-nums {warnaStatus(b?.capaian) === 'merah'
									? 'text-red-700'
									: ''}">{fmt(b?.capaian)}</td
							>
							<td rowspan="2" class="px-2 text-right">
								{#if b?.k3.k3 === null}
									<button
										type="button"
										tabindex="-1"
										class="rounded-md border border-amber-400 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100"
										onclick={() => (dibuka = i)}>Lengkapi</button
									>
								{:else}
									<button
										type="button"
										tabindex="-1"
										class="rounded-md px-1.5 py-1 tabular-nums hover:bg-brand-soft hover:text-brand"
										title="Atur K3 di Rincian"
										onclick={() => (dibuka = i)}
										>{fmt(b?.k3.k3)}{#if b?.k3.bobotTarget.catatan}<span class="text-amber-700" aria-hidden="true">!</span
											>{/if}</button
									>
								{/if}
							</td>
							<td rowspan="2" class="hidden px-2 text-right tabular-nums xl:table-cell">{fmt(b?.nhk.nilaiKualitasCapaian)}</td>
							<td rowspan="2" class="hidden px-2 text-right tabular-nums text-muted xl:table-cell">
								{b?.nhk.bobotTertimbang == null ? '–' : `${fmt(b.nhk.bobotTertimbang * 100, 1)}%`}
							</td>
							<td rowspan="2" class="py-2 pr-4 pl-2 text-right font-semibold tabular-nums">{fmt(b?.nhk.kontribusi)}</td>
						</tr>
						<tr>
							<td class="px-2 pt-0.5 pb-2">
								<div class="flex items-center justify-between gap-2 px-1 text-xs text-muted">
									<span class="min-w-0">
										{LABEL_POL[iki.polarisasi]} · {LABEL_KONS[iki.konsolidasi]}
										{#if b?.k3.bobotTarget.catatan}
											<span class="block text-amber-800">! K3: {b.k3.bobotTarget.catatan}</span>
										{/if}
									</span>
									<button
										type="button"
										class="shrink-0 rounded-md px-2 py-0.5 font-medium text-brand hover:bg-brand-soft"
										onclick={() => (dibuka = i)}
										aria-label="Rincian IKI {i + 1}">Rincian</button
									>
								</div>
							</td>
							<th scope="row" class="px-2 pt-0.5 pb-2 text-left text-xs font-medium text-muted">Realisasi</th>
							{#each Q as q (q)}
								<td class="px-1.5 pt-0.5 pb-2 {q > sampai ? 'opacity-60' : ''}">
									<NumInput
										bind:value={iki.realisasi[q]}
										label="Realisasi {LABEL_PERIODE[q]} IKI {i + 1}"
										data-kol="r{q}"
										class={perluRealisasi(i, q) ? 'border-amber-400 bg-amber-50' : ''}
									/>
								</td>
							{/each}
						</tr>
					</tbody>
				{/each}
				<tfoot class="border-t-2 border-line">
					<tr>
						<td colspan="3" class="px-4 py-3">
							<button type="button" class="btn-ghost" onclick={tambah}>+ Tambah IKI</button>
							{#if data.ikis.length < 3}
								<span class="ml-2 text-xs text-amber-800">Non-Pimpinan UPK minimal 3 IKI</span>
							{/if}
						</td>
						<th scope="row" colspan="6" class="px-2 py-3 text-right text-sm font-medium">
							Jumlah kontribusi = NHK Awal {labelPeriode}
						</th>
						<td colspan="2" class="hidden xl:table-cell"></td>
						<td class="py-3 pr-4 pl-2 text-right text-base font-semibold tabular-nums">
							{fmt(hasil.nhkAwal)}{#if hasil.dikecualikan.length}<span class="text-amber-700">*</span>{/if}
						</td>
					</tr>
				</tfoot>
			</table>
		</section>

		<p class="text-xs text-muted">
			Kolom triwulan setelah periode terpilih tampak lebih pudar karena belum dihitung. Kolom NKC dan Bobot tampil pada layar ≥ 1280 px. NKC = nilai kualitas capaian
			(capaian × K3, maksimal 120). Bobot = K3 IKI dibagi jumlah K3 seluruh IKI yang dihitung. Kontribusi = NKC ×
			bobot (KMK hal. 125-126).
		</p>
	{/if}
</div>

{#if dibuka !== null && data.ikis[dibuka]}
	{@const i = dibuka}
	<RincianIki
		bind:iki={data.ikis[i]}
		nomor={i + 1}
		mode="berjalan"
		ontutup={() => (dibuka = null)}
		onhapus={() => hapus(i)}
	/>
{/if}
