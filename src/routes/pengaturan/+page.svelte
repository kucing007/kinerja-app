<script lang="ts">
	import { data, gantiData, resetData } from '$lib/state/data.svelte';
	import { eksporJson, imporJson } from '$lib/state/persist';

	let fileInput: HTMLInputElement;
	let pesan = $state('');

	const LABEL_TIER = {
		1: '1 tingkat di bawah Pimpinan UPK / JF substansi',
		2: '2 tingkat atau lebih di bawah Pimpinan UPK / JF non-substansi'
	} as const;

	async function impor(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		try {
			gantiData(await imporJson(file));
			pesan = 'Data berhasil diimpor.';
		} catch (err) {
			pesan = (err as Error).message;
		}
		input.value = '';
	}

	function reset() {
		if (confirm('Hapus semua data di browser ini? Ekspor dulu bila ingin menyimpan cadangan.')) {
			resetData();
			pesan = 'Data direset.';
		}
	}
</script>

<div class="space-y-5">
	<div>
		<h1 class="judul">Pengaturan</h1>
		<p class="text-sm text-muted">Identitas penilaian dan pengelolaan data.</p>
	</div>

	{#if pesan}
		<div class="rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand" role="status">{pesan}</div>
	{/if}

	<section class="card" aria-labelledby="judul-profil">
		<h2 id="judul-profil" class="judul">Profil penilaian</h2>
		<div class="mt-4 grid gap-4 md:grid-cols-[8rem_1fr]">
			<div>
				<label class="label" for="tahun">Tahun penilaian</label>
				<input id="tahun" type="number" class="input" bind:value={data.tahun} />
			</div>
			<div>
				<label class="label" for="tier">Posisi jabatan</label>
				<select id="tier" class="input" bind:value={data.tier}>
					<option value={1}>{LABEL_TIER[1]}</option>
					<option value={2}>{LABEL_TIER[2]}</option>
				</select>
				<p class="mt-1 text-xs text-muted">
					Menentukan bobot NKO ketika hasil ≥ NKO: 50% untuk pilihan pertama, 30% untuk pilihan kedua. Bila hasil
					&lt; NKO, bobot NKO 10% untuk keduanya (KMK hal. 147).
				</p>
			</div>
		</div>
	</section>

	<section class="card" aria-labelledby="judul-data">
		<h2 id="judul-data" class="judul">Data</h2>
		<p class="mt-1 text-sm text-muted">
			Semua isian tersimpan di browser ini saja. Gunakan Ekspor untuk cadangan atau memindahkan ke perangkat lain.
		</p>
		<div class="mt-3 flex flex-wrap gap-2">
			<button type="button" class="btn" onclick={() => eksporJson($state.snapshot(data))}>Ekspor ke file JSON</button>
			<button type="button" class="btn-ghost" onclick={() => fileInput.click()}>Impor dari file JSON</button>
			<button type="button" class="btn-ghost text-red-700" onclick={reset}>Reset semua data</button>
			<input bind:this={fileInput} type="file" accept="application/json" class="hidden" onchange={impor} />
		</div>
	</section>

	<section class="card" aria-labelledby="judul-tentang">
		<h2 id="judul-tentang" class="judul">Tentang</h2>
		<ul class="mt-2 space-y-2 text-sm text-muted">
			<li>
				Perhitungan mengikuti <b class="text-ink">KMK 127 Tahun 2026</b> tentang Manajemen Kinerja di Lingkungan
				Kementerian Keuangan, untuk pegawai <b class="text-ink">non-Pimpinan UPK</b> (kalibrasi maksimal 115).
			</li>
			<li>
				Hasil di aplikasi ini adalah <b class="text-ink">perhitungan mandiri</b>, bukan hasil resmi aplikasi Performa. NKP
				bersifat rahasia (KMK hal. 118), sehingga data tidak pernah dikirim ke server mana pun.
			</li>
			<li>
				Rumus kalibrasi 115 direkonstruksi dari dua contoh pada paparan sosialisasi, karena KMK hanya menyebutkan
				batas nilainya. Sebaiknya dikonfirmasi ke pengelola kinerja unit Anda.
			</li>
			<li>
				Belum tercakup: Pimpinan UPK, JPTM, Tugas Belajar, Plt, SKP Komplemen, dan pembobotan evaluator 360°.
			</li>
		</ul>
	</section>
</div>
