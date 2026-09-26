<script lang="ts">
	// Side panel for the IKI settings that are set once a year (polarisasi, jenis, K3, data Y-1).
	// Quarterly numbers are edited in the grid itself; everything here is bound live and autosaved.
	import { onMount } from 'svelte';
	import { k3Iki, labelK3 } from '$lib/calc/k3';
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
		ontutup: () => void;
		onhapus: () => void;
	}

	let { iki = $bindable(), nomor, mode, ontutup, onhapus }: Props = $props();

	const uid = $props.id();
	const k3 = $derived(k3Iki(iki));
	const labelY1 = $derived(mode === 'rencana' ? 'tahun ini' : 'tahun lalu');
	const adaTargetNol = $derived(iki.target.some((t) => t === 0));

	let dialog: HTMLDialogElement;
	onMount(() => dialog.showModal());
</script>

<dialog
	bind:this={dialog}
	onclose={ontutup}
	onclick={(e) => e.target === dialog && dialog.close()}
	aria-labelledby="{uid}-judul"
	class="my-0 mr-0 ml-auto h-dvh max-h-dvh w-[min(42rem,100vw)] max-w-none bg-white p-0 text-ink shadow-2xl backdrop:bg-ink/30"
>
	<div class="flex h-full flex-col">
		<header class="flex items-start gap-3 border-b border-line px-5 py-4">
			<div class="min-w-0 flex-1">
				<div class="text-xs font-medium text-muted">Rincian IKI {nomor}</div>
				<h2 id="{uid}-judul" class="truncate text-lg font-semibold">{iki.nama || 'IKI tanpa nama'}</h2>
			</div>
			<button
				type="button"
				class="rounded-lg p-2 text-lg leading-none text-muted hover:bg-paper hover:text-ink"
				onclick={() => dialog.close()}
				aria-label="Tutup rincian">✕</button
			>
		</header>

		<div class="flex-1 space-y-6 overflow-y-auto px-5 py-5">
			<div>
				<label class="label" for="{uid}-nama">Nama indikator</label>
				<input id="{uid}-nama" class="input" placeholder="Tulis nama indikator kinerja" bind:value={iki.nama} />
			</div>

			<section class="space-y-3" aria-labelledby="{uid}-k3">
				<div class="flex items-baseline justify-between gap-3 rounded-lg bg-paper px-3 py-2">
					<h3 id="{uid}-k3" class="text-sm font-semibold">K3 (bobot IKI dalam NHK)</h3>
					<div class="text-right">
						<b class="text-lg tabular-nums">{fmt(k3.k3)}</b>
						<span class="ml-1 text-xs text-muted">{k3.k3 === null ? 'belum dapat dihitung' : labelK3(k3.k3)}</span>
					</div>
				</div>
				<p class="text-xs text-muted">
					K3 = (bobot kualitas IKI {fmt(k3.bobotKualitas)} + bobot kualitas target {fmt(k3.bobotTarget.bobot)}) / 2
					{#if k3.bobotTarget.catatan}<span class="block text-amber-800">{k3.bobotTarget.catatan}</span>{/if}
				</p>

				<div class="grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)]">
					<div>
						<div class="mb-1 text-xs font-semibold text-ink">1. Kualitas indikator: validitas × kendali</div>
						<K3Picker bind:validitas={iki.validitas} bind:kendali={iki.kendali} />
					</div>
					<div class="min-w-0 space-y-3">
						<div class="text-xs font-semibold text-ink">2. Kualitas target</div>
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
						{#if iki.jenis !== 'baruTanpaHistoris'}
							<div class="grid grid-cols-2 gap-2">
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
						<div class="flex items-center text-sm">
							<label class="flex items-center gap-2">
								<input type="checkbox" class="rounded border-line text-brand" bind:checked={iki.targetMaksimal} />
								Target dari UU / penilaian instansi / IKI stabil
							</label>
							<Info label="Penjelasan target dari UU" teks="Bobot kualitas target langsung 1,2 (KMK hal. 73)." />
						</div>
					</div>
				</div>

				{#if mode === 'rencana'}
					<div class="max-w-xs">
						<label class="label" for="{uid}-ty">Target tahun depan (Target Y)</label>
						<NumInput id="{uid}-ty" bind:value={iki.target[3]} />
					</div>
					<K3TargetBar {iki} />
				{/if}
			</section>

			<section class="space-y-3 border-t border-line pt-5" aria-labelledby="{uid}-capaian">
				<h3 id="{uid}-capaian" class="text-sm font-semibold">Cara menghitung capaian</h3>
				<div class="grid gap-3 sm:grid-cols-2">
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
				</div>

				<div class="flex items-center text-sm">
					<label class="flex items-center gap-2">
						<input type="checkbox" class="rounded border-line text-brand" bind:checked={iki.konversi120} />
						Target sudah maksimal (tercapai = 120)
					</label>
					<Info
						label="Penjelasan target maksimal"
						teks="Untuk IKI yang realisasinya tidak mungkin melebihi target, mis. opini WTP. Bila target tercapai, capaian diakui 120 (KMK hal. 67)."
					/>
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
			</section>
		</div>

		<footer class="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
			<button
				type="button"
				class="btn-ghost text-red-700"
				onclick={() => {
					dialog.close();
					onhapus();
				}}>Hapus IKI ini</button
			>
			<span class="text-xs text-muted">Perubahan tersimpan otomatis</span>
			<button type="button" class="btn" onclick={() => dialog.close()}>Selesai</button>
		</footer>
	</div>
</dialog>
