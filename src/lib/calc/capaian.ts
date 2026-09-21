// Capaian IKI — KMK 127/2026 hal. 37-38 (konsolidasi) & 67-70 (polarisasi)
import type { Iki, Konsolidasi, Polarisasi, TitikSkala, Triwulanan } from './types';

export const CAPAIAN_MAKS = 120;

export const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** Default stabilize scale from the KMK example (Ca 90 -> 100, Ca 100 -> 120); adjust per manual IKI */
export const SKALA_STABILIZE_DEFAULT: TitikSkala[] = [
	{ ca: 0, cn: 0 },
	{ ca: 90, cn: 100 },
	{ ca: 100, cn: 120 }
];

export interface OpsiCapaian {
	realisasiTerburuk?: number | null;
	skalaStabilize?: TitikSkala[];
	konversi120?: boolean;
}

function interpolasi(ca: number, skala: TitikSkala[]): number {
	const titik = [...skala].sort((a, b) => a.ca - b.ca);
	if (titik.length === 0) return ca;
	if (ca <= titik[0].ca) return titik[0].cn;
	for (let i = 1; i < titik.length; i++) {
		const a = titik[i - 1];
		const b = titik[i];
		if (ca <= b.ca) return a.cn + ((b.cn - a.cn) / (b.ca - a.ca)) * (ca - a.ca);
	}
	return titik[titik.length - 1].cn;
}

/** Capaian (0-120) from realisasi & target; null when it cannot be computed */
export function hitungCapaian(
	realisasi: number | null,
	target: number | null,
	polarisasi: Polarisasi,
	opsi: OpsiCapaian = {}
): number | null {
	if (realisasi === null || target === null) return null;
	let nilai: number;

	if (polarisasi === 'maximize') {
		if (target === 0) return null;
		if (opsi.konversi120 && target > 0 && realisasi >= target) return CAPAIAN_MAKS;
		nilai = target < 0 ? (1 + (1 - realisasi / target)) * 100 : (realisasi / target) * 100;
	} else if (polarisasi === 'minimize') {
		if (target === 0) {
			const terburuk = opsi.realisasiTerburuk;
			if (!terburuk) return null;
			if (opsi.konversi120 && realisasi <= 0) return CAPAIAN_MAKS;
			nilai = ((terburuk - realisasi) / terburuk) * 100;
		} else {
			if (opsi.konversi120 && realisasi <= target) return CAPAIAN_MAKS;
			nilai = (1 + (1 - realisasi / target)) * 100;
		}
	} else {
		if (target === 0) return null;
		const rasio = (realisasi / target) * 100;
		const ca = realisasi <= target ? rasio : 200 - rasio;
		nilai = interpolasi(ca, opsi.skalaStabilize ?? SKALA_STABILIZE_DEFAULT);
	}

	return clamp(nilai, 0, CAPAIAN_MAKS);
}

/** Consolidate values up to quarter index `sampai` (0-3), ignoring unset quarters */
export function konsolidasi(nilai: (number | null)[], jenis: Konsolidasi, sampai = 3): number | null {
	const isi = nilai.slice(0, sampai + 1).filter((v): v is number => v !== null);
	if (isi.length === 0) return null;
	if (jenis === 'tlkv') return isi[isi.length - 1];
	const total = isi.reduce((a, b) => a + b, 0);
	return jenis === 'sum' ? total : total / isi.length;
}

/**
 * Consolidated target & realisasi up to quarter `sampai` (0-3; 3 = tahunan).
 * Only quarters that have a target count; null if any of them lacks realisasi.
 */
export function konsolidasiSampai(
	target: Triwulanan,
	realisasi: Triwulanan,
	jenis: Konsolidasi,
	sampai: number
): { target: number; realisasi: number } | null {
	const idx = [0, 1, 2, 3].filter((i) => i <= sampai && target[i] !== null);
	if (idx.length === 0 || idx.some((i) => realisasi[i] === null)) return null;
	const t = konsolidasi(idx.map((i) => target[i]), jenis);
	const r = konsolidasi(idx.map((i) => realisasi[i]), jenis);
	return t === null || r === null ? null : { target: t, realisasi: r };
}

export function capaianIki(iki: Iki, sampai: number): number | null {
	const k = konsolidasiSampai(iki.target, iki.realisasi, iki.konsolidasi, sampai);
	if (!k) return null;
	return hitungCapaian(k.realisasi, k.target, iki.polarisasi, {
		realisasiTerburuk: iki.realisasiTerburuk,
		skalaStabilize: iki.skalaStabilize,
		konversi120: iki.konversi120
	});
}

/** Annual target (Target Y) of an IKI following its consolidation type */
export const targetTahunan = (iki: Iki) => konsolidasi(iki.target, iki.konsolidasi);
