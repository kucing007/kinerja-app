<script lang="ts">
	import { resolve } from '$app/paths';
	import IkiEditor from '$lib/components/IkiEditor.svelte';
	import { kalibrasi } from '$lib/calc/kalibrasi';
	import { data, ikiBaru } from '$lib/state/data.svelte';
	import { fmt, LABEL_PERIODE, rincianIki, TAHUNAN, warnaStatus } from '$lib/state/hitung';

	let periode = $state(TAHUNAN);
	const hasil = $derived(rincianIki(data.ikis, periode));
	const nhkSemua = $derived(LABEL_PERIODE.map((_, p) => rincianIki(data.ikis, p).nhkAwal));
	const dihitung = $derived(hasil.baris.filter((b) => b.nhk.kontribusi !== null).length);

	const tambah = () => data.ikis.push(ikiBaru(`IKI ${data.ikis.length + 1}`));
	function hapus(id: string, nama: string) {
		if (confirm(`Hapus "${nama || 'IKI tanpa nama'}"? Target dan realisasinya ikut terhapus.`))
			data.ikis = data.ikis.filter((i) => i.id !== id);
	}
</script>

<div class="space-y-5">
	<div>
		<h1 class="judul">Hasil Kerja (IKI) tahun {data.tahun}</h1>
		<p class="text-sm text-muted">
			Isi target & realisasi per triwulan. K3 tiap IKI menjadi bobot dalam NHK, yang menyumbang 75% pada NKP Awal.
		</p>
	</div>

	<section class="card space-y-3" aria-labelledby="judul-nhk">
		<div>
			<h2 id="judul-nhk" class="text-xs font-medium text-muted">NHK Awal {LABEL_PERIODE[periode]}</h2>
			<div class="text-3xl font-semibold tabular-nums">{fmt(hasil.nhkAwal)}</div>
			<div class="text-xs text-muted">
				setelah kalibrasi {fmt(hasil.nhkAwal === null ? null : kalibrasi(hasil.nhkAwal))} · {dihitung} dari
				{data.ikis.length} IKI dihitung
			</div>
		</div>
		<div class="flex flex-wrap gap-1.5" role="group" aria-label="Pilih periode">
			{#each nhkSemua as n, p (p)}
				<button
					type="button"
					class="rounded-lg border px-3 py-1.5 text-left {periode === p
						? 'border-brand bg-brand text-white'
						: 'border-line bg-white hover:border-brand'}"
					aria-pressed={periode === p}
					onclick={() => (periode = p)}
				>
					<span class="block text-[11px] {periode === p ? 'text-white/80' : 'text-muted'}">
						{p < 4 ? `s.d. ${LABEL_PERIODE[p]}` : 'Tahunan'}
					</span>
					<span class="text-sm font-semibold tabular-nums">{fmt(n)}</span>
				</button>
			{/each}
		</div>

		{#if data.ikis.length < 3}
			<p class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
				Non-Pimpinan UPK minimal 3 IKI (maks. 6 Pelaksana, 7 Pengawas, 8 Administrator).
			</p>
		{/if}
		{#if hasil.dikecualikan.length}
			<p class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="status">
				Belum masuk NHK {LABEL_PERIODE[periode]}: <b>{hasil.dikecualikan.join(', ')}</b>. Lengkapi realisasi triwulan
				yang bertarget; NHK di atas bersifat sementara.
			</p>
		{/if}
	</section>

	{#if data.ikis.length}
		<section class="card" aria-labelledby="judul-ringkasan">
			<div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
				<h2 id="judul-ringkasan" class="judul">
					Ringkasan capaian {periode < TAHUNAN ? `s.d. ${LABEL_PERIODE[periode]}` : 'tahunan'}
				</h2>
				<span class="text-xs text-muted">Telusuri tiap IKI dari angka asalnya sampai menjadi NHK.</span>
			</div>
			<div class="mt-3 overflow-x-auto">
				<table class="tbl min-w-[44rem]">
					<thead>
						<tr>
							<th scope="col">IKI</th>
							<th scope="col">Target</th>
							<th scope="col">Realisasi</th>
							<th scope="col">Capaian</th>
							<th scope="col">K3</th>
							<th scope="col">NKC</th>
							<th scope="col">Bobot</th>
							<th scope="col">Kontribusi</th>
						</tr>
					</thead>
					<tbody>
						{#each hasil.baris as b, i (data.ikis[i].id)}
							<tr class={b.dikecualikan ? 'bg-amber-50' : ''}>
								<th scope="row" class="font-medium text-ink">
									{b.iki.nama || `IKI ${i + 1}`}
									{#if b.dikecualikan}
										<span class="block text-xs font-normal text-amber-800">belum masuk NHK</span>
									{/if}
								</th>
								<td>{fmt(b.konsol?.target ?? null)}</td>
								<td>{fmt(b.konsol?.realisasi ?? null)}</td>
								<td class={warnaStatus(b.capaian) === 'merah' ? 'text-red-700' : ''}>{fmt(b.capaian)}</td>
								<td>{fmt(b.k3.k3)}</td>
								<td>{fmt(b.nhk.nilaiKualitasCapaian)}</td>
								<td>{b.nhk.bobotTertimbang === null ? '–' : `${fmt(b.nhk.bobotTertimbang * 100, 1)}%`}</td>
								<td class="font-semibold">{fmt(b.nhk.kontribusi)}</td>
							</tr>
						{/each}
					</tbody>
					<tfoot>
						<tr class="border-t-2 border-line">
							<th scope="row" colspan="7" class="text-right font-medium text-ink">
								Jumlah kontribusi = NHK Awal {LABEL_PERIODE[periode]}
							</th>
							<td class="font-semibold tabular-nums">{fmt(hasil.nhkAwal)}</td>
						</tr>
					</tfoot>
				</table>
			</div>
			<p class="mt-2 text-xs text-muted">
				NKC = nilai kualitas capaian (capaian × K3, maksimal 120). Bobot = K3 IKI ini dibagi jumlah K3 seluruh IKI
				yang dihitung. Kontribusi = NKC × bobot (KMK hal. 125-126).
			</p>
		</section>
	{/if}

	{#each data.ikis as iki, i (iki.id)}
		<IkiEditor
			bind:iki={data.ikis[i]}
			nomor={i + 1}
			mode="berjalan"
			capaian={hasil.baris[i]?.capaian ?? null}
			nhk={hasil.baris[i]?.nhk}
			dikecualikan={hasil.baris[i]?.dikecualikan ?? false}
			onhapus={() => hapus(iki.id, iki.nama)}
		/>
	{/each}

	<button type="button" class="btn" onclick={tambah}>+ Tambah IKI</button>

	<p class="text-sm">
		<a class="text-brand underline" href={resolve('/')}>Lihat pengaruhnya pada NKP →</a>
	</p>
</div>
