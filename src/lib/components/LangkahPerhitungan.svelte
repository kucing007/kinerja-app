<script lang="ts">
	import { fmt, type RingkasanPeriode } from '$lib/state/hitung';

	let { r }: { r: RingkasanPeriode } = $props();

	const persen = (b: number) => `${fmt(b * 100, 0)}%`;
</script>

{#if r.nkp}
	{@const h = r.nkp}
	<details class="card text-sm" open>
		<summary class="cursor-pointer font-semibold">Langkah perhitungan</summary>
		<ol class="mt-3 list-decimal space-y-2 pl-5">
			<li>
				Kalibrasi maks 115: NHK {fmt(r.nhkAwal)} → <b>{fmt(r.nhkKalibrasi)}</b>, NPK {fmt(r.npkAwal)} →
				<b>{fmt(r.npkKalibrasi)}</b>
			</li>
			<li>NKP Awal = 75% × {fmt(r.nhkKalibrasi)} + 25% × {fmt(r.npkKalibrasi)} = <b>{fmt(h.nkpAwal)}</b></li>
			<li>
				Penyesuaian = − hukdis {fmt(r.hukdis)} − dampak {fmt(r.dampak)} + koreksi {fmt(r.koreksi)} =
				<b>{fmt(h.penyesuaian)}</b> → hasil <b>{fmt(h.hasil)}</b>
			</li>
			<li>
				Hasil {h.hasil >= (r.nko as number) ? '≥' : '<'} NKO {fmt(r.nko)} → bobot NKO <b>{persen(h.bobotNko)}</b>:
				NKP = {persen(1 - h.bobotNko)} × {fmt(h.hasil)} + {persen(h.bobotNko)} × {fmt(r.nko)} = <b>{fmt(h.nkp)}</b>
			</li>
		</ol>
	</details>

	<details class="card">
		<summary class="cursor-pointer font-semibold">Rincian rating hasil & perilaku kerja</summary>
		<div class="mt-3 overflow-x-auto">
			<table class="tbl min-w-[26rem]">
				<thead>
					<tr>
						<th scope="col"><span class="sr-only">Komponen</span></th>
						<th scope="col">Kalibrasi</th>
						<th scope="col">Setelah penyesuaian</th>
						<th scope="col">Bobot NKO</th>
						<th scope="col">Nilai akhir</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<th scope="row">NHK</th>
						<td>{fmt(r.nhkKalibrasi)}</td>
						<td>{fmt(h.nhk.setelahPenyesuaian)}</td>
						<td>{persen(h.nhk.bobotNko)}</td>
						<td class="font-semibold">{fmt(h.nhk.akhir)}</td>
					</tr>
					<tr>
						<th scope="row">NPK</th>
						<td>{fmt(r.npkKalibrasi)}</td>
						<td>{fmt(h.npk.setelahPenyesuaian)}</td>
						<td>{persen(h.npk.bobotNko)}</td>
						<td class="font-semibold">{fmt(h.npk.akhir)}</td>
					</tr>
				</tbody>
			</table>
		</div>
		<p class="mt-2 text-xs text-muted">
			Rating: &gt;100 Di Atas, 90–100 Sesuai, &lt;90 Di Bawah Ekspektasi. Predikat = kombinasi keduanya
			(PermenPANRB 6/2022, KMK Tabel 47).
		</p>
	</details>
{/if}
