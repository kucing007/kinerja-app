<script lang="ts">
	import { DURASI_HUKDIS, PERSEN_HUKDIS, nilaiSatuHukdis } from '$lib/calc/nkp';
	import { data, hukdisBaru } from '$lib/state/data.svelte';
	import { fmt, LABEL_PERIODE } from '$lib/state/hitung';
	import { sim } from '$lib/state/simulasi.svelte';
	import NumInput from './NumInput.svelte';

	interface Props {
		periode: number;
		hukdisPeriode: number;
	}
	let { periode, hukdisPeriode }: Props = $props();

	const label = $derived(LABEL_PERIODE[periode]);
	const persen = (b: number) => `${fmt(b * 100, 0)}%`;
	const hapusHukdis = (id: string) => (data.hukdis = data.hukdis.filter((h) => h.id !== id));
</script>

<div class="space-y-4">
	<div class="space-y-2">
		<div class="text-sm font-medium">Hukuman disiplin</div>
		{#if sim.aktif}
			<p class="text-sm text-muted">Tidak bisa diubah dalam Mode Simulasi karena hukdis adalah data tersimpan.</p>
		{/if}
		{#if data.hukdis.length === 0}
			<p class="text-sm text-muted">Tidak ada hukuman disiplin.</p>
		{/if}
		{#each data.hukdis as h, i (h.id)}
			<fieldset
				class="grid grid-cols-2 items-end gap-2 rounded-lg border border-line p-2 sm:grid-cols-[1.4fr_1fr_1fr_1fr_auto]"
				disabled={sim.aktif}
			>
				<legend class="sr-only">Hukdis {i + 1}</legend>
				<div>
					<label class="label" for="hk-{h.id}-kat">Kategori</label>
					<select id="hk-{h.id}-kat" class="input" bind:value={data.hukdis[i].kategori}>
						<option value="ringan">Ringan</option>
						<option value="sedang">Sedang</option>
						<option value="berat">Berat</option>
					</select>
				</div>
				<div>
					<label class="label" for="hk-{h.id}-skor">Skor MPJHD</label>
					<NumInput id="hk-{h.id}-skor" bind:value={data.hukdis[i].skorMPJHD} nullable={false} />
				</div>
				<div>
					<label class="label" for="hk-{h.id}-th">Mulai tahun</label>
					<input id="hk-{h.id}-th" type="number" class="input" bind:value={data.hukdis[i].tahun} />
				</div>
				<div>
					<label class="label" for="hk-{h.id}-tw">Mulai triwulan</label>
					<select id="hk-{h.id}-tw" class="input" bind:value={data.hukdis[i].triwulan}>
						{#each [1, 2, 3, 4] as t (t)}<option value={t}>Q{t}</option>{/each}
					</select>
				</div>
				<button type="button" class="btn-ghost text-red-700" onclick={() => hapusHukdis(h.id)}>Hapus</button>
				<p class="col-span-full text-xs text-muted">
					Nilai {fmt(nilaiSatuHukdis(h))} = {persen(PERSEN_HUKDIS[h.kategori])} × skor {fmt(h.skorMPJHD, 0)}, berlaku
					{DURASI_HUKDIS[h.kategori]} triwulan mulai Q{h.triwulan} {h.tahun} dan pada nilai tahunan {h.tahun}.
				</p>
			</fieldset>
		{/each}
		<div class="flex flex-wrap items-center justify-between gap-2">
			<button type="button" class="btn-ghost" disabled={sim.aktif} onclick={() => data.hukdis.push(hukdisBaru())}>
				+ Tambah hukdis
			</button>
			{#if data.hukdis.length}
				<span class="text-xs text-muted">
					Dipakai {label}: <b>{fmt(hukdisPeriode)}</b> (kategori tertinggi, tidak dijumlah)
				</span>
			{/if}
		</div>
	</div>

	<div>
		<label class="label" for="koreksi">
			Nilai Koreksi Sidang TPK {label}:
			<b class="text-ink">{fmt(sim.aktif ? (sim.koreksi ?? 0) : (data.koreksi[periode] ?? 0), 1)}</b>
			{#if sim.aktif}<span class="text-amber-800">· simulasi</span>{/if}
		</label>
		<input
			id="koreksi"
			type="range"
			min="-5"
			max="5"
			step="0.5"
			class="w-full accent-brand"
			value={sim.aktif ? (sim.koreksi ?? 0) : (data.koreksi[periode] ?? 0)}
			oninput={(e) => {
				const v = Number(e.currentTarget.value);
				if (sim.aktif) sim.koreksi = v;
				else data.koreksi[periode] = v;
			}}
		/>
		<div class="flex justify-between text-[11px] text-muted" aria-hidden="true">
			<span>−5 pengurangan</span><span>0</span><span>+5 penambahan</span>
		</div>
	</div>

	<details class="rounded-lg border border-line p-3" open={(data.dampak[periode] ?? 0) !== 0}>
		<summary class="cursor-pointer text-sm font-medium">Saya atasan langsung pegawai yang dijatuhi hukdis</summary>
		<!-- Dampak is stored data like hukdis, so it stays locked while the what-if banner is up -->
		<fieldset class="mt-3 max-w-xs" disabled={sim.aktif}>
			<label class="label" for="dampak">Nilai Dampak Pelanggaran Disiplin {label}</label>
			<NumInput id="dampak" bind:value={data.dampak[periode]} />
			<p class="mt-1 text-xs text-muted">5% × nilai hukdis bawahan, maksimal 5 poin (KMK hal. 144).</p>
			{#if sim.aktif}
				<p class="mt-1 text-xs text-amber-800">Tidak bisa diubah dalam Mode Simulasi.</p>
			{/if}
		</fieldset>
	</details>
</div>
