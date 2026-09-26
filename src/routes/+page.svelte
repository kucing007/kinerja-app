<script lang="ts">
	import { onDestroy } from 'svelte';
	import { resolve } from '$app/paths';
	import HasilNkpCard from '$lib/components/HasilNkpCard.svelte';
	import LangkahPerhitungan from '$lib/components/LangkahPerhitungan.svelte';
	import NumInput from '$lib/components/NumInput.svelte';
	import PenyesuaianForm from '$lib/components/PenyesuaianForm.svelte';
	import { data } from '$lib/state/data.svelte';
	import { fmt, LABEL_PERIODE, ringkasan, TAHUNAN, warnaStatus } from '$lib/state/hitung';
	import { tampilan } from '$lib/state/periode.svelte';
	import { gantiSimulasi, mulaiSimulasi, selesaiSimulasi, sim } from '$lib/state/simulasi.svelte';

	const periode = $derived(tampilan.periode);

	/** Stored values; also the baseline the what-if mode starts from and compares against */
	const asli = $derived(ringkasan(data, periode));
	const r = $derived(sim.aktif ? ringkasan(data, periode, gantiSimulasi()) : asli);
	const semua = $derived(LABEL_PERIODE.map((_, p) => ringkasan(data, p)));
	const label = $derived(periode < TAHUNAN ? `s.d. ${LABEL_PERIODE[periode]}` : 'Tahunan');
	const sementara = $derived(asli.iki.some((b) => b.dikecualikan));

	// Simulated values are seeded from one period and exist only on this page: a period switch or
	// leaving the page ends the simulation instead of carrying stale numbers along
	let periodeSim = -1;
	$effect(() => {
		if (sim.aktif && periode !== periodeSim) selesaiSimulasi();
	});
	onDestroy(selesaiSimulasi);

	function simulasi() {
		periodeSim = periode;
		mulaiSimulasi({ nhk: asli.nhkAwal, npk: asli.npkAwal, nko: asli.nko, koreksi: asli.koreksi });
	}

	const LABEL_TIER = { 1: '1 tingkat di bawah Pimpinan UPK / JF substansi', 2: '2 tingkat atau lebih / JF non-substansi' };
	const WARNA_SIM = 'border-amber-400 bg-amber-50 focus:border-amber-500 focus:ring-amber-500';

	/** What still blocks the NKP, as steps the user can act on right away */
	const langkah = $derived([
		{
			judul: 'Hasil kerja (IKI)',
			selesai: asli.nhkAwal !== null && !sementara,
			ket:
				data.ikis.length === 0
					? 'Belum ada IKI'
					: asli.nhkAwal === null
						? 'Target & realisasi belum lengkap'
						: sementara
							? 'NHK sementara, ada realisasi yang belum diisi'
							: `NHK Awal ${fmt(asli.nhkAwal)}`,
			href: resolve('/iki')
		},
		{
			judul: 'Perilaku kerja (NPK)',
			selesai: asli.npkAwal !== null,
			ket: asli.npkAwal === null ? `NPK ${label} belum diisi` : `NPK Awal ${fmt(asli.npkAwal)}`,
			href: resolve('/perilaku')
		},
		{
			judul: 'NKO unit',
			selesai: asli.nko !== null,
			ket: asli.nko === null ? `NKO ${LABEL_PERIODE[periode]} belum diisi (kolom di kanan)` : `NKO ${fmt(asli.nko)}`,
			href: `#nko-${periode}`
		}
	]);
	const belumLengkap = $derived(langkah.some((l) => !l.selesai));
</script>

<div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
	<!-- Results -->
	<div class="min-w-0 space-y-5">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<h1 class="judul">Nilai Kinerja {label} · {data.tahun}</h1>
			{#if !sim.aktif}
				<button type="button" class="btn-ghost" onclick={simulasi} disabled={asli.nhkAwal === null && asli.npkAwal === null}>
					Mode Simulasi
				</button>
			{/if}
		</div>

		{#if belumLengkap && !sim.aktif}
			<section class="card border-brand/30 bg-brand-soft/40" aria-labelledby="judul-langkah">
				<h2 id="judul-langkah" class="text-sm font-semibold">
					{asli.nkp ? 'Hampir lengkap' : 'Lengkapi tiga isian ini untuk menghitung NKP'}
				</h2>
				<ol class="mt-3 grid gap-2 sm:grid-cols-3">
					{#each langkah as l, i (l.judul)}
						<li>
							<a
								href={l.href}
								class="flex h-full items-start gap-2.5 rounded-lg border bg-white p-3 text-sm hover:border-brand {l.selesai
									? 'border-line'
									: 'border-amber-300'}"
							>
								<span
									class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold {l.selesai
										? 'bg-emerald-600 text-white'
										: 'bg-amber-100 text-amber-900'}"
									aria-hidden="true">{l.selesai ? '✓' : i + 1}</span
								>
								<span>
									<b class="block">{l.judul}</b>
									<span class="text-xs {l.selesai ? 'text-muted' : 'text-amber-900'}">
										<span class="sr-only">{l.selesai ? 'Selesai:' : 'Belum:'}</span>
										{l.ket}
									</span>
								</span>
							</a>
						</li>
					{/each}
				</ol>
			</section>
		{/if}

		<HasilNkpCard judul="NKP {label}" hasil={r.nkp} />
		{#if sim.aktif}
			<p class="text-sm text-muted">
				Nilai tersimpan: NKP <b class="tabular-nums">{fmt(asli.nkp?.nkp)}</b> · Predikat
				{asli.nkp?.predikat ?? '–'}
			</p>
		{/if}

		<div class="grid gap-3 sm:grid-cols-3">
			{#each [{ kunci: 'nhk', judul: 'NHK Awal', sub: 'hasil kerja, bobot 75%', nilai: r.nhkAwal, kal: r.nhkKalibrasi, simpan: asli.nhkAwal, href: resolve('/iki'), ke: 'Hasil Kerja' }, { kunci: 'npk', judul: 'NPK Awal', sub: 'perilaku kerja, bobot 25%', nilai: r.npkAwal, kal: r.npkKalibrasi, simpan: asli.npkAwal, href: resolve('/perilaku'), ke: 'Perilaku Kerja' }] as t (t.kunci)}
				<div class="card border-l-4 {sim.aktif ? 'border-l-amber-400' : 'border-l-line'}">
					<div class="text-xs font-medium text-muted">{t.judul} <span class="font-normal">· {t.sub}</span></div>
					{#if sim.aktif}
						{#if t.kunci === 'nhk'}
							<NumInput bind:value={sim.nhk} class="mt-1 {WARNA_SIM} text-2xl font-semibold" label="NHK Awal simulasi" />
						{:else}
							<NumInput bind:value={sim.npk} class="mt-1 {WARNA_SIM} text-2xl font-semibold" label="NPK Awal simulasi" />
						{/if}
						<div class="mt-1 text-xs text-muted">tersimpan {fmt(t.simpan)}</div>
					{:else}
						<div class="mt-1 text-2xl font-semibold tabular-nums">
							{fmt(t.nilai)}{#if t.kunci === 'nhk' && sementara}<span class="text-amber-700">*</span>{/if}
						</div>
						<div class="mt-1 text-xs text-muted">
							kalibrasi {fmt(t.kal)} · <a class="text-brand hover:underline" href={t.href}>ubah di {t.ke}</a>
						</div>
					{/if}
				</div>
			{/each}
			<div class="card border-l-4 {sim.aktif ? 'border-l-amber-400' : 'border-l-line'}">
				<div class="text-xs font-medium text-muted">NKO <span class="font-normal">· kinerja unit</span></div>
				{#if sim.aktif}
					<NumInput bind:value={sim.nko} class="mt-1 {WARNA_SIM} text-2xl font-semibold" label="NKO simulasi" />
					<div class="mt-1 text-xs text-muted">tersimpan {fmt(asli.nko)}</div>
				{:else}
					<div class="mt-1 text-2xl font-semibold tabular-nums">{fmt(r.nko)}</div>
					<div class="mt-1 text-xs text-muted">bobot NKO {r.nkp ? `${fmt(r.nkp.bobotNko * 100, 0)}%` : '–'}</div>
				{/if}
			</div>
		</div>

		<LangkahPerhitungan {r} />

		<section class="card" aria-labelledby="judul-periode">
			<div class="flex flex-wrap items-baseline justify-between gap-2">
				<h2 id="judul-periode" class="judul">Semua periode</h2>
				<span class="text-xs text-muted">Klik periode untuk melihat rinciannya. Selalu memakai nilai tersimpan.</span>
			</div>
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
							{@const parsial = s.iki.some((b) => b.dikecualikan)}
							<tr class={i === periode ? 'bg-brand-soft/50' : 'hover:bg-paper'}>
								<th scope="row">
									<button
										type="button"
										class="font-medium {i === periode ? 'text-brand' : 'text-ink hover:text-brand hover:underline'}"
										aria-pressed={i === periode}
										onclick={() => (tampilan.periode = i)}>{i < 4 ? `s.d. ${LABEL_PERIODE[i]}` : 'Tahunan'}</button
									>
								</th>
								<td class={warnaStatus(s.nhkKalibrasi) === 'merah' ? 'text-red-700' : ''}>
									{fmt(s.nhkKalibrasi)}{#if parsial && s.nhkKalibrasi !== null}<span class="text-amber-700" title="sementara">*</span>{/if}
								</td>
								<td class={warnaStatus(s.npkKalibrasi) === 'merah' ? 'text-red-700' : ''}>{fmt(s.npkKalibrasi)}</td>
								<td>{s.hukdis ? fmt(s.hukdis) : '–'}</td>
								<td>{fmt(s.nko)}</td>
								<td class="font-semibold">{fmt(s.nkp?.nkp)}{#if parsial && s.nkp}<span class="text-amber-700">*</span>{/if}</td>
								<td>{s.nkp?.predikat ?? '–'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			{#if semua.some((s) => s.iki.some((b) => b.dikecualikan))}
				<p class="mt-2 text-xs text-amber-800">* sementara: ada IKI bertarget yang realisasinya belum diisi pada periode itu.</p>
			{/if}
		</section>
	</div>

	<!-- Inputs that belong to this page -->
	<aside class="space-y-5 lg:sticky lg:top-20" aria-label="Isian nilai kinerja">
		<section class="card" aria-labelledby="judul-nko">
			<h2 id="judul-nko" class="text-base font-semibold">NKO unit</h2>
			<p class="mt-0.5 text-xs text-muted">Nilai Kinerja Organisasi unit tempat Anda berada (KMK hal. 147).</p>
			<fieldset class="mt-3 grid grid-cols-5 gap-1.5" disabled={sim.aktif}>
				<legend class="sr-only">NKO per periode</legend>
				{#each LABEL_PERIODE as l, i (l)}
					<div>
						<label class="block text-center text-[11px] {i === periode ? 'font-semibold text-brand' : 'text-muted'}" for="nko-{i}"
							>{i < 4 ? l : 'Thn'}</label
						>
						<NumInput
							id="nko-{i}"
							bind:value={data.nko[i]}
							class="px-1.5 text-center {i === periode ? 'border-brand ring-1 ring-brand' : ''} {i === periode && data.nko[i] === null
								? 'bg-amber-50'
								: ''}"
						/>
					</div>
				{/each}
			</fieldset>
			{#if sim.aktif}
				<p class="mt-2 text-xs text-amber-800">NKO simulasi diubah pada kartu NKO di sebelah kiri.</p>
			{/if}
			<p class="mt-3 text-xs text-muted">
				Posisi jabatan: {LABEL_TIER[data.tier]} ·
				<a class="text-brand hover:underline" href={resolve('/pengaturan')}>ubah</a>
			</p>
		</section>

		<section class="card" aria-labelledby="judul-penyesuaian">
			<h2 id="judul-penyesuaian" class="text-base font-semibold">Penyesuaian</h2>
			<p class="mt-0.5 mb-3 text-xs text-muted">Hukuman disiplin, nilai dampak, dan koreksi Sidang TPK.</p>
			<PenyesuaianForm {periode} hukdisPeriode={r.hukdis} />
		</section>
	</aside>
</div>
