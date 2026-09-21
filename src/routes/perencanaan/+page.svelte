<script lang="ts">
	import IkiEditor from '$lib/components/IkiEditor.svelte';
	import { konsolidasi, konsolidasiSampai, targetTahunan } from '$lib/calc/capaian';
	import { k3Iki } from '$lib/calc/k3';
	import { kalibrasi } from '$lib/calc/kalibrasi';
	import { hitungNhk } from '$lib/calc/nhk';
	import { npkTahunan } from '$lib/calc/npk';
	import { data, ikiBaru } from '$lib/state/data.svelte';
	import { fmt } from '$lib/state/hitung';

	let asumsiCapaian = $state(100);

	const rincian = $derived(data.rencana.map((iki) => k3Iki(iki)));
	const proyeksi = $derived(hitungNhk(rincian.map((r) => ({ capaian: asumsiCapaian, k3: r.k3 }))));
	const rataK3 = (nilai: (number | null)[]) => npkTahunan(nilai);
	const k3Rencana = $derived(rataK3(rincian.map((r) => r.k3)));
	const k3Berjalan = $derived(rataK3(data.ikis.map((iki) => k3Iki(iki).k3)));

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

	// Plans are listed collapsed so the page stays scannable; only the one just added opens itself
	let idBaru = $state<string | null>(null);
	function tambah() {
		const iki = ikiBaru(`Rencana IKI ${data.rencana.length + 1}`);
		idBaru = iki.id;
		data.rencana.push(iki);
	}
	function hapus(id: string, nama: string) {
		if (confirm(`Hapus rencana "${nama || 'IKI tanpa nama'}"?`)) data.rencana = data.rencana.filter((i) => i.id !== id);
	}
</script>

<div class="space-y-5">
	<div>
		<h1 class="judul">Perencanaan IKI tahun {data.tahun + 1}</h1>
		<p class="text-sm text-muted">
			K3 = (bobot kualitas IKI + bobot kualitas target) / 2. Pilih validitas/kendali yang lebih tinggi dan target
			yang melampaui target & realisasi tahun ini untuk K3 maksimal (KMK hal. 70-74).
		</p>
	</div>

	<div class="flex flex-wrap gap-2">
		<button class="btn" onclick={salinDariBerjalan} disabled={data.ikis.length === 0}>
			Salin dari IKI tahun {data.tahun}
		</button>
		<button class="btn-ghost" onclick={tambah}>+ Tambah IKI baru</button>
	</div>

	{#if data.rencana.length === 0}
		<p class="card text-sm text-muted">
			Belum ada rencana. Salin IKI tahun berjalan (target & realisasi tahun ini otomatis jadi data Y-1) atau tambah
			IKI baru.
		</p>
	{/if}

	{#each data.rencana as iki, i (iki.id)}
		<IkiEditor
			bind:iki={data.rencana[i]}
			nomor={i + 1}
			mode="rencana"
			mulaiTertutup={iki.id !== idBaru}
			onhapus={() => hapus(iki.id, iki.nama)}
		/>
	{/each}

	{#if data.rencana.length}
		<section class="card space-y-4">
			<h2 class="judul">Ringkasan rencana</h2>
			<div class="overflow-x-auto">
				<table class="tbl min-w-[36rem]">
					<thead>
						<tr>
							<th>IKI</th>
							<th>Target Y-1</th>
							<th>Realisasi Y-1</th>
							<th>Target Y</th>
							<th>Bobot kualitas</th>
							<th>Bobot target</th>
							<th>K3</th>
							<th>Bobot tertimbang</th>
						</tr>
					</thead>
					<tbody>
						{#each data.rencana as iki, i (iki.id)}
							<tr>
								<td class="font-medium">{iki.nama || `IKI ${i + 1}`}</td>
								<td>{fmt(iki.targetY1)}</td>
								<td>{fmt(iki.realisasiY1)}</td>
								<td>{fmt(iki.target[3])}</td>
								<td>{fmt(rincian[i].bobotKualitas)}</td>
								<td>{fmt(rincian[i].bobotTarget.bobot)}</td>
								<td class="font-semibold">{fmt(rincian[i].k3)}</td>
								<td>{fmt(proyeksi.baris[i]?.bobotTertimbang === null ? null : proyeksi.baris[i].bobotTertimbang! * 100)}%</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<div class="grid gap-4 md:grid-cols-3">
				<div>
					<div class="text-xs text-muted">Rata-rata K3</div>
					<div class="text-xl font-semibold tabular-nums">{fmt(k3Rencana)}</div>
					<div class="text-xs text-muted">tahun ini {fmt(k3Berjalan)}</div>
				</div>
				<label class="md:col-span-2">
					<span class="label">Asumsi capaian semua IKI: <b class="text-ink">{asumsiCapaian}</b></span>
					<input type="range" min="50" max="120" step="1" class="w-full accent-brand" bind:value={asumsiCapaian} />
					<span class="text-sm">
						Proyeksi NHK Awal <b class="tabular-nums">{fmt(proyeksi.nhk)}</b> → kalibrasi
						<b class="tabular-nums">{fmt(proyeksi.nhk === null ? null : kalibrasi(proyeksi.nhk))}</b>
						<span class="text-muted">(nilai kualitas capaian = capaian × K3, maks 120)</span>
					</span>
				</label>
			</div>
		</section>
	{/if}
</div>
