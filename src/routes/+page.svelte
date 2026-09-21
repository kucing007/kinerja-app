<script lang="ts">
	import { untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import HasilNkpCard from '$lib/components/HasilNkpCard.svelte';
	import LangkahPerhitungan from '$lib/components/LangkahPerhitungan.svelte';
	import NumInput from '$lib/components/NumInput.svelte';
	import PenyesuaianForm from '$lib/components/PenyesuaianForm.svelte';
	import PeriodeTabs from '$lib/components/PeriodeTabs.svelte';
	import { data } from '$lib/state/data.svelte';
	import { fmt, LABEL_PERIODE, ringkasan, TAHUNAN, warnaStatus } from '$lib/state/hitung';
	import { gantiSimulasi, mulaiSimulasi, selesaiSimulasi, sim } from '$lib/state/simulasi.svelte';

	let periode = $state(TAHUNAN);

	/** Stored values; also the baseline the what-if mode starts from and compares against */
	const asli = $derived(ringkasan(data, periode));
	const r = $derived(sim.aktif ? ringkasan(data, periode, gantiSimulasi()) : asli);
	const semua = $derived(LABEL_PERIODE.map((_, p) => ringkasan(data, p)));
	const label = $derived(LABEL_PERIODE[periode]);
	const belumMulai = $derived(data.ikis.length === 0);
	const ringkasPenyesuaian = $derived(
		[
			data.hukdis.length ? `hukdis ${fmt(r.hukdis)}` : 'tidak ada hukdis',
			r.dampak ? `dampak ${fmt(r.dampak)}` : null,
			`koreksi ${fmt(r.koreksi, 1)}`
		]
			.filter(Boolean)
			.join(' · ')
	);
	const adaPenyesuaian = untrack(
		() => data.hukdis.length > 0 || data.dampak.some((x) => x) || data.koreksi.some((x) => x)
	);

	const WARNA_SIM = 'border-amber-400 bg-amber-50 focus:border-amber-500 focus:ring-amber-500';
</script>

<div class="space-y-6">
	{#if sim.aktif}
		<div
			class="sticky top-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-2 border-b border-amber-300 bg-amber-100 px-4 py-2 text-sm text-amber-900"
			role="status"
		>
			<span><b>Mode Simulasi.</b> Perubahan di halaman ini tidak disimpan.</span>
			<button type="button" class="btn-ghost" onclick={selesaiSimulasi}>Kembali ke data asli</button>
		</div>
	{/if}

	{#if belumMulai}
		<section class="card border-brand/30 bg-brand-soft/40" aria-labelledby="judul-mulai">
			<h2 id="judul-mulai" class="judul">Mulai dari sini</h2>
			<ol class="mt-3 grid gap-3 sm:grid-cols-3">
				<li class="rounded-lg bg-white p-3 text-sm">
					<b class="block">1. Hasil kerja</b>
					<a class="text-brand underline" href={resolve('/iki')}>Isi IKI, target & realisasi</a>
				</li>
				<li class="rounded-lg bg-white p-3 text-sm">
					<b class="block">2. Perilaku kerja</b>
					<a class="text-brand underline" href={resolve('/perilaku')}>Isi NPK</a>
				</li>
				<li class="rounded-lg bg-white p-3 text-sm">
					<b class="block">3. NKO & posisi</b>
					<span class="text-muted">NKO di halaman ini, posisi jabatan di </span>
					<a class="text-brand underline" href={resolve('/pengaturan')}>Pengaturan</a>
				</li>
			</ol>
		</section>
	{/if}

	<section class="space-y-3" aria-labelledby="judul-hasil">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<h1 id="judul-hasil" class="judul">Nilai Kinerja {label}</h1>
			<div class="flex flex-wrap items-center gap-2">
				<PeriodeTabs bind:periode />
				{#if !sim.aktif}
					<button
						type="button"
						class="btn-ghost"
						onclick={() =>
							mulaiSimulasi({
								nhk: asli.nhkAwal,
								npk: asli.npkAwal,
								nko: asli.nko,
								koreksi: asli.koreksi
							})}>Mode Simulasi</button
					>
				{/if}
			</div>
		</div>

		{#if r.kurang.length}
			<div class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="status">
				Belum lengkap: {r.kurang.join('; ')}. Lengkapi di
				<a class="underline" href={resolve('/iki')}>Hasil Kerja</a>,
				<a class="underline" href={resolve('/perilaku')}>Perilaku Kerja</a>, atau isi NKO di bawah.
			</div>
		{/if}

		<HasilNkpCard judul="NKP {label}" hasil={r.nkp} />
		{#if sim.aktif}
			<p class="text-sm text-muted">
				Nilai tersimpan: NKP <b class="tabular-nums">{fmt(asli.nkp?.nkp)}</b> · Predikat
				{asli.nkp?.predikat ?? '–'}
			</p>
		{/if}

		<div class="grid gap-3 sm:grid-cols-2">
			<div class="card border-l-4 {sim.aktif ? 'border-l-amber-400' : 'border-l-line'}">
				<div class="text-xs font-medium text-muted">NHK Awal (hasil kerja)</div>
				{#if sim.aktif}
					<NumInput bind:value={sim.nhk} class="mt-1 {WARNA_SIM} text-2xl font-semibold" label="NHK Awal simulasi" />
					<div class="mt-1 text-xs text-muted">tersimpan {fmt(asli.nhkAwal)}</div>
				{:else}
					<div class="mt-1 text-2xl font-semibold tabular-nums">{fmt(r.nhkAwal)}</div>
					<div class="mt-1 text-xs text-muted">
						setelah kalibrasi {fmt(r.nhkKalibrasi)} ·
						<a class="text-brand underline" href={resolve('/iki')}>ubah di Hasil Kerja</a>
					</div>
				{/if}
			</div>

			<div class="card border-l-4 {sim.aktif ? 'border-l-amber-400' : 'border-l-line'}">
				<div class="text-xs font-medium text-muted">NPK Awal (perilaku kerja)</div>
				{#if sim.aktif}
					<NumInput bind:value={sim.npk} class="mt-1 {WARNA_SIM} text-2xl font-semibold" label="NPK Awal simulasi" />
					<div class="mt-1 text-xs text-muted">tersimpan {fmt(asli.npkAwal)}</div>
				{:else}
					<div class="mt-1 text-2xl font-semibold tabular-nums">{fmt(r.npkAwal)}</div>
					<div class="mt-1 text-xs text-muted">
						setelah kalibrasi {fmt(r.npkKalibrasi)} ·
						<a class="text-brand underline" href={resolve('/perilaku')}>ubah di Perilaku Kerja</a>
					</div>
				{/if}
			</div>
		</div>
	</section>

	<section class="card" aria-labelledby="judul-nko">
		<h2 id="judul-nko" class="judul">Nilai Kinerja Organisasi (NKO)</h2>
		<p class="mt-1 text-xs text-muted">
			NKO unit tempat Anda berada; ikut menentukan NKP sesuai bobot posisi jabatan (KMK hal. 147).
		</p>
		{#if sim.aktif}
			<div class="mt-3 max-w-xs">
				<label class="label" for="nko-sim">NKO {label} (simulasi)</label>
				<NumInput id="nko-sim" bind:value={sim.nko} class={WARNA_SIM} />
				<p class="mt-1 text-xs text-muted">tersimpan {fmt(asli.nko)}</p>
			</div>
		{:else}
			<div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
				{#each LABEL_PERIODE as l, i (l)}
					<div>
						<label class="block text-xs text-muted" for="nko-{i}">{l}</label>
						<NumInput id="nko-{i}" bind:value={data.nko[i]} />
					</div>
				{/each}
			</div>
		{/if}
	</section>

	<details class="card group" open={adaPenyesuaian}>
		<summary
			class="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 [&::-webkit-details-marker]:hidden"
		>
			<span>
				<span class="judul block">Penyesuaian</span>
				<span class="block text-xs text-muted">{ringkasPenyesuaian}</span>
			</span>
			<span class="text-sm font-medium text-brand group-open:hidden">Buka</span>
			<span class="hidden text-sm font-medium text-brand group-open:inline">Tutup</span>
		</summary>
		<div class="mt-4">
			<PenyesuaianForm {periode} hukdisPeriode={r.hukdis} />
		</div>
	</details>

	<LangkahPerhitungan {r} />

	<section class="card" aria-labelledby="judul-periode">
		<h2 id="judul-periode" class="judul">Semua periode</h2>
		<p class="mt-1 text-xs text-muted">Selalu memakai nilai tersimpan, bukan nilai simulasi.</p>
		<div class="mt-3 overflow-x-auto">
			<table class="tbl min-w-[36rem]">
				<thead>
					<tr>
						<th scope="col">Periode</th>
						<th scope="col">NHK kal.</th>
						<th scope="col">NPK kal.</th>
						<th scope="col">Hukdis</th>
						<th scope="col">NKO</th>
						<th scope="col">NKP</th>
						<th scope="col">Predikat</th>
					</tr>
				</thead>
				<tbody>
					{#each semua as s, i (i)}
						<tr class={i === periode ? 'bg-brand-soft/50' : ''}>
							<th scope="row" class="font-medium text-ink">{LABEL_PERIODE[i]}</th>
							<td class={warnaStatus(s.nhkKalibrasi) === 'merah' ? 'text-red-700' : ''}>{fmt(s.nhkKalibrasi)}</td>
							<td class={warnaStatus(s.npkKalibrasi) === 'merah' ? 'text-red-700' : ''}>{fmt(s.npkKalibrasi)}</td>
							<td>{s.hukdis ? fmt(s.hukdis) : '–'}</td>
							<td>{fmt(s.nko)}</td>
							<td class="font-semibold">{fmt(s.nkp?.nkp)}</td>
							<td>{s.nkp?.predikat ?? '–'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>
</div>
