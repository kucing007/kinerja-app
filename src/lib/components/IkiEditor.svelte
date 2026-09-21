<script lang="ts">
	import { untrack } from 'svelte';
	import { targetTahunan } from '$lib/calc/capaian';
	import { k3Iki, labelK3 } from '$lib/calc/k3';
	import type { BarisNhk } from '$lib/calc/nhk';
	import type { Iki } from '$lib/calc/types';
	import { fmt } from '$lib/state/hitung';
	import Info from './Info.svelte';
	import K3Picker from './K3Picker.svelte';
	import K3TargetBar from './K3TargetBar.svelte';
	import NumInput from './NumInput.svelte';

	interface Props {
		iki: Iki;
		nomor: number;
		mode: 'berjalan' | 'rencana';
		capaian?: number | null;
		nhk?: BarisNhk;
		/** Has a target in the selected period but is not counted in NHK yet */
		dikecualikan?: boolean;
		/** Keep the detail section closed on mount even when the IKI is still empty */
		mulaiTertutup?: boolean;
		onhapus: () => void;
	}

	let {
		iki = $bindable(),
		nomor,
		mode,
		capaian = null,
		nhk,
		dikecualikan = false,
		mulaiTertutup = false,
		onhapus
	}: Props = $props();

	const uid = $props.id();
	const k3 = $derived(k3Iki(iki));
	const Q = ['Q1', 'Q2', 'Q3', 'Q4'];
	const labelY1 = $derived(mode === 'rencana' ? 'tahun ini' : 'tahun lalu');
	const adaTargetNol = $derived(iki.target.some((t) => t === 0));
	// IKIs that already have targets start collapsed so results are scannable; empty ones open for input
	let buka = $state(untrack(() => !mulaiTertutup && iki.target.every((t) => t === null)));
</script>

<article class="card space-y-4 {dikecualikan ? 'border-amber-300' : ''}">
	<header class="flex flex-wrap items-center gap-2">
		<span class="rounded-md bg-brand-soft px-2 py-1 text-xs font-semibold text-brand">IKI {nomor}</span>
		<input
			class="input min-w-0 flex-1 basis-48 font-medium"
			placeholder="Tulis nama indikator kinerja"
			aria-label="Nama IKI {nomor}"
			bind:value={iki.nama}
		/>
		<div class="flex gap-2">
			<button type="button" class="btn-ghost" onclick={() => (buka = !buka)} aria-expanded={buka}>
				{buka ? 'Tutup detail' : 'Ubah detail'}
			</button>
			<button type="button" class="btn-ghost text-red-700" onclick={onhapus} aria-label="Hapus IKI {nomor}">Hapus</button>
		</div>
	</header>

	{#if dikecualikan}
		<p class="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
			Belum ikut NHK periode ini: isi realisasi untuk setiap triwulan yang punya target{k3.k3 === null
				? ', dan pilih kombinasi validitas × kendali yang diatur KMK'
				: ''}.
		</p>
	{/if}

	<dl class="grid grid-cols-2 gap-2 sm:grid-cols-4">
		{#if mode === 'berjalan'}
			<div class="stat">
				<dt>Capaian</dt>
				<dd>{fmt(capaian)}</dd>
			</div>
		{:else}
			<div class="stat">
				<dt>Target Y</dt>
				<dd>{fmt(targetTahunan(iki))}</dd>
			</div>
		{/if}
		<div class="stat">
			<dt>K3</dt>
			<dd>{fmt(k3.k3)} <span class="text-xs font-normal text-muted">{labelK3(k3.k3)}</span></dd>
		</div>
		{#if mode === 'berjalan'}
			<div class="stat">
				<dt>Nilai kualitas capaian</dt>
				<dd>{fmt(nhk?.nilaiKualitasCapaian)}</dd>
			</div>
			<div class="stat">
				<dt>Kontribusi ke NHK</dt>
				<dd>
					{fmt(nhk?.kontribusi)}
					{#if nhk?.bobotTertimbang != null}
						<span class="text-xs font-normal text-muted">bobot {fmt(nhk.bobotTertimbang * 100, 1)}%</span>
					{/if}
				</dd>
			</div>
		{:else}
			<div class="stat">
				<dt>Bobot kualitas</dt>
				<dd>{fmt(k3.bobotKualitas)}</dd>
			</div>
			<div class="stat">
				<dt>Bobot target</dt>
				<dd>{fmt(k3.bobotTarget.bobot)}</dd>
			</div>
		{/if}
	</dl>

	<p class="text-xs text-muted">
		K3 = (bobot kualitas {fmt(k3.bobotKualitas)} + bobot target {fmt(k3.bobotTarget.bobot)}) / 2
		{#if k3.bobotTarget.catatan}<span class="block text-amber-800 sm:inline">· {k3.bobotTarget.catatan}</span>{/if}
	</p>

	{#if buka}
		<div class="grid gap-5 border-t border-line pt-4 lg:grid-cols-[minmax(0,1fr)_auto]">
			<div class="min-w-0 space-y-3">
				<div class="grid gap-3 sm:grid-cols-3">
					<div>
						<label class="label" for="{uid}-pol">Polarisasi</label>
						<select id="{uid}-pol" class="input" bind:value={iki.polarisasi}>
							<option value="maximize">Maximize (makin tinggi makin baik)</option>
							<option value="minimize">Minimize (makin rendah makin baik)</option>
							<option value="stabilize">Stabilize (dalam rentang)</option>
						</select>
					</div>
					{#if mode === 'berjalan'}
						<div>
							<div class="label flex items-center">
								<label for="{uid}-kons">Akumulasi triwulan</label>
								<Info
									label="Penjelasan akumulasi triwulan"
									teks="Nilai terakhir: capaian s.d. triwulan = angka triwulan terakhir (mis. persentase kumulatif). Dijumlah: target & realisasi tiap triwulan dijumlahkan. Dirata-rata: dirata-ratakan (KMK hal. 37)."
								/>
							</div>
							<select id="{uid}-kons" class="input" bind:value={iki.konsolidasi}>
								<option value="tlkv">Nilai triwulan terakhir</option>
								<option value="sum">Dijumlah</option>
								<option value="average">Dirata-rata</option>
							</select>
						</div>
					{/if}
					<div>
						<div class="label flex items-center">
							<label for="{uid}-jenis">Jenis IKI</label>
							<Info
								label="Penjelasan jenis IKI"
								teks="IKI lama dibandingkan dengan target & realisasi tahun lalu. IKI baru tanpa data historis otomatis bobot target 1,0. IKI mandatory minimal 1,0 (KMK hal. 71-74)."
							/>
						</div>
						<select id="{uid}-jenis" class="input" bind:value={iki.jenis}>
							<option value="lama">IKI lama</option>
							<option value="baruHistoris">IKI baru, ada data historis</option>
							<option value="baruTanpaHistoris">IKI baru, tanpa data historis</option>
							<option value="mandatory">IKI mandatory</option>
						</select>
					</div>
				</div>

				<div class="flex flex-wrap gap-x-5 gap-y-2 text-sm">
					<div class="flex items-center">
						<label class="flex items-center gap-2">
							<input type="checkbox" class="rounded border-line text-brand" bind:checked={iki.targetMaksimal} />
							Target dari UU / penilaian instansi / IKI stabil
						</label>
						<Info label="Penjelasan target dari UU" teks="Bobot kualitas target langsung 1,2 (KMK hal. 73)." />
					</div>
					<div class="flex items-center">
						<label class="flex items-center gap-2">
							<input type="checkbox" class="rounded border-line text-brand" bind:checked={iki.konversi120} />
							Target sudah maksimal (tercapai = 120)
						</label>
						<Info
							label="Penjelasan target maksimal"
							teks="Untuk IKI yang realisasinya tidak mungkin melebihi target, mis. opini WTP. Bila target tercapai, capaian diakui 120 (KMK hal. 67)."
						/>
					</div>
				</div>

				{#if iki.polarisasi === 'minimize' && adaTargetNol}
					<div class="max-w-xs">
						<div class="label flex items-center">
							<label for="{uid}-buruk">Realisasi terburuk</label>
							<Info
								label="Penjelasan realisasi terburuk"
								teks="Untuk IKI minimize bertarget 0: realisasi terburuk yang masih ditoleransi (capaian 0), sesuai manual IKI (KMK hal. 68-69)."
							/>
						</div>
						<NumInput id="{uid}-buruk" bind:value={iki.realisasiTerburuk} />
					</div>
				{/if}

				{#if iki.polarisasi === 'stabilize'}
					<div>
						<div class="label flex items-center">
							<span>Skala konversi stabilize (Ca → capaian)</span>
							<Info
								label="Penjelasan skala stabilize"
								teks="Ca = R/T×100 bila R ≤ T, atau 200 − R/T×100 bila R > T; lalu dikonversi secara linier memakai skala di manual IKI (KMK hal. 69-70)."
							/>
						</div>
						<div class="flex flex-wrap gap-2">
							{#each iki.skalaStabilize as _, j (j)}
								<div class="flex items-center gap-1 rounded-md border border-line p-1">
									<NumInput bind:value={iki.skalaStabilize[j].ca} nullable={false} class="w-16" label="Ca titik {j + 1}" />
									<span class="text-muted" aria-hidden="true">→</span>
									<NumInput bind:value={iki.skalaStabilize[j].cn} nullable={false} class="w-16" label="Capaian titik {j + 1}" />
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<div class="min-w-0">
				<div class="label">Kualitas indikator: validitas × kendali</div>
				<K3Picker bind:validitas={iki.validitas} bind:kendali={iki.kendali} />
			</div>
		</div>

		<div class="grid gap-4 {mode === 'rencana' ? 'lg:grid-cols-2' : ''}">
			<div class="min-w-0 space-y-3">
				{#if mode === 'berjalan'}
					<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
						{#each Q as q, i (q)}
							<fieldset class="min-w-0 rounded-lg border border-line p-2">
								<legend class="px-1 text-xs font-semibold text-muted">{q}</legend>
								<label class="block text-[11px] text-muted" for="{uid}-t{i}">Target</label>
								<NumInput id="{uid}-t{i}" bind:value={iki.target[i]} />
								<label class="mt-1.5 block text-[11px] text-muted" for="{uid}-r{i}">Realisasi</label>
								<NumInput id="{uid}-r{i}" bind:value={iki.realisasi[i]} />
							</fieldset>
						{/each}
					</div>
				{:else}
					<div class="max-w-xs">
						<label class="label" for="{uid}-ty">Target tahun depan (Target Y)</label>
						<NumInput id="{uid}-ty" bind:value={iki.target[3]} />
					</div>
				{/if}

				{#if iki.jenis !== 'baruTanpaHistoris'}
					<div class="grid grid-cols-1 gap-3 sm:max-w-md sm:grid-cols-2">
						{#if iki.jenis !== 'baruHistoris'}
							<div>
								<label class="label" for="{uid}-t1">Target {labelY1} (Y-1)</label>
								<NumInput id="{uid}-t1" bind:value={iki.targetY1} />
							</div>
						{/if}
						<div>
							<label class="label" for="{uid}-r1">Realisasi {labelY1} (Y-1)</label>
							<NumInput id="{uid}-r1" bind:value={iki.realisasiY1} />
						</div>
					</div>
				{/if}
			</div>

			{#if mode === 'rencana'}
				<K3TargetBar {iki} />
			{/if}
		</div>
	{/if}
</article>
