// NKP & Predikat — KMK 127/2026 hal. 139-149
import type { Hukdis, KategoriHukdis, Predikat, Rating, Tier } from './types';

export const BOBOT_NHK = 0.75;
export const BOBOT_NPK = 0.25;
export const KOREKSI_MAKS = 5;
export const DAMPAK_MAKS = 5;

export const PERSEN_HUKDIS: Record<KategoriHukdis, number> = { ringan: 0.1, sedang: 0.25, berat: 0.4 };
/** Number of quarterly periods the penalty applies to */
export const DURASI_HUKDIS: Record<KategoriHukdis, number> = { ringan: 2, sedang: 3, berat: 4 };
const URUTAN: Record<KategoriHukdis, number> = { ringan: 1, sedang: 2, berat: 3 };

const clamp120 = (x: number) => Math.min(120, Math.max(0, x));

export const nilaiSatuHukdis = (h: Pick<Hukdis, 'kategori' | 'skorMPJHD'>) =>
	PERSEN_HUKDIS[h.kategori] * h.skorMPJHD;

/**
 * Nilai Hukuman Disiplin for a quarter (triwulan 1-4) or the whole year (triwulan omitted).
 * Not cumulative: highest category wins, then highest MPJHD score.
 */
export function nilaiHukdis(daftar: Hukdis[], tahun: number, triwulan?: number): number {
	const berlaku = daftar.filter((h) => {
		if (triwulan === undefined) return h.tahun === tahun;
		const mulai = h.tahun * 4 + (h.triwulan - 1);
		const periode = tahun * 4 + (triwulan - 1);
		return periode >= mulai && periode < mulai + DURASI_HUKDIS[h.kategori];
	});
	if (berlaku.length === 0) return 0;
	const utama = berlaku.reduce((a, b) =>
		URUTAN[b.kategori] > URUTAN[a.kategori] ||
		(URUTAN[b.kategori] === URUTAN[a.kategori] && b.skorMPJHD > a.skorMPJHD)
			? b
			: a
	);
	return nilaiSatuHukdis(utama);
}

/** Nilai Dampak for a direct superior: 5% of each subordinate's Nilai Hukdis, capped at 5 */
export const nilaiDampak = (nilaiHukdisBawahan: number[]) =>
	Math.min(DAMPAK_MAKS, nilaiHukdisBawahan.reduce((s, n) => s + 0.05 * n, 0));

/** NKO weight: 50% (tier 1) or 30% (tier 2) when hasil >= NKO, otherwise 10% for everyone */
export const bobotNko = (hasil: number, nko: number, tier: Tier) =>
	hasil >= nko ? (tier === 1 ? 0.5 : 0.3) : 0.1;

export function terapkanNko(hasil: number, nko: number, tier: Tier) {
	const bobot = bobotNko(hasil, nko, tier);
	return { bobot, nilai: clamp120((1 - bobot) * hasil + bobot * nko) };
}

export function rating(nilai: number): Rating {
	if (nilai > 100) return 'Di Atas Ekspektasi';
	return nilai >= 90 ? 'Sesuai Ekspektasi' : 'Di Bawah Ekspektasi';
}

/** PermenPANRB 6/2022 matrix: Rating Hasil Kerja x Rating Perilaku Kerja */
export function predikat(hasilKerja: Rating, perilakuKerja: Rating): Predikat {
	if (perilakuKerja === 'Di Bawah Ekspektasi')
		return hasilKerja === 'Di Bawah Ekspektasi' ? 'Sangat Kurang' : 'Kurang';
	if (hasilKerja === 'Di Bawah Ekspektasi') return 'Butuh Perbaikan';
	return hasilKerja === 'Di Atas Ekspektasi' && perilakuKerja === 'Di Atas Ekspektasi' ? 'Sangat Baik' : 'Baik';
}

export interface InputNkp {
	/** NHK & NPK Awal already calibrated (maks 115) */
	nhkAwal: number;
	npkAwal: number;
	nko: number;
	tier: Tier;
	hukdis: number;
	dampak: number;
	/** -5 .. +5 */
	koreksi: number;
}

export interface KomponenAkhir {
	setelahPenyesuaian: number;
	bobotNko: number;
	akhir: number;
	rating: Rating;
}

export interface HasilNkp {
	nkpAwal: number;
	penyesuaian: number;
	hasil: number;
	bobotNko: number;
	nkp: number;
	nhk: KomponenAkhir;
	npk: KomponenAkhir;
	predikat: Predikat;
}

export function hitungNkp(i: InputNkp): HasilNkp {
	const koreksi = Math.max(-KOREKSI_MAKS, Math.min(KOREKSI_MAKS, i.koreksi));
	const penyesuaian = -i.hukdis - i.dampak + koreksi;
	const nkpAwal = BOBOT_NHK * i.nhkAwal + BOBOT_NPK * i.npkAwal;
	const hasil = clamp120(nkpAwal + penyesuaian);
	const nkp = terapkanNko(hasil, i.nko, i.tier);

	// Rating HK/PK: each component is adjusted and gets its own NKO branch (KMK Tabel 47)
	const komponen = (awal: number): KomponenAkhir => {
		const setelahPenyesuaian = clamp120(awal + penyesuaian);
		const r = terapkanNko(setelahPenyesuaian, i.nko, i.tier);
		return { setelahPenyesuaian, bobotNko: r.bobot, akhir: r.nilai, rating: rating(r.nilai) };
	};
	const nhk = komponen(i.nhkAwal);
	const npk = komponen(i.npkAwal);

	return {
		nkpAwal,
		penyesuaian,
		hasil,
		bobotNko: nkp.bobot,
		nkp: nkp.nilai,
		nhk,
		npk,
		predikat: predikat(nhk.rating, npk.rating)
	};
}
