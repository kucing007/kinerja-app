// Kualitas Komitmen Kinerja (K3) — KMK 127/2026 hal. 70-75 & 123
import type { Iki, JenisIki, Kendali, Polarisasi, Validitas } from './types';
import { targetTahunan } from './capaian';

/** Tabel 14: bobot kualitas IKU/IKI. Exact/High and Activity/Low are not defined by the KMK. */
export const BOBOT_KUALITAS: Record<Validitas, Partial<Record<Kendali, number>>> = {
	exact: { low: 1.2, moderate: 1.15 },
	proxy: { low: 1.1, moderate: 1, high: 0.9 },
	activity: { moderate: 0.8, high: 0.6 }
};

export const bobotKualitasIki = (v: Validitas, k: Kendali): number | null =>
	BOBOT_KUALITAS[v][k] ?? null;

export interface HasilBobot {
	bobot: number | null;
	catatan?: string;
}

const sama = (a: number, b: number) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));

/** Tabel 15 for IKU lama. Minimize mirrors maximize by negating every value. */
export function tabelBobotTarget(
	t: number,
	t1: number,
	r1: number,
	polarisasi: 'maximize' | 'minimize'
): HasilBobot {
	if (polarisasi === 'minimize') return tabelBobotTarget(-t, -t1, -r1, 'maximize');
	if (sama(t, t1)) {
		if (sama(r1, t1))
			return { bobot: 1, catatan: 'Kombinasi tidak diatur eksplisit, konfirmasi ke pengelola kinerja' };
		return { bobot: r1 > t1 ? 0.9 : 1 };
	}
	if (t < t1) return { bobot: 0.8 };
	if (sama(t, r1)) return { bobot: 1.1 };
	return { bobot: t > r1 ? 1.2 : 1 };
}

export interface InputBobotTarget {
	target: number | null;
	targetY1: number | null;
	realisasiY1: number | null;
	polarisasi: Polarisasi;
	jenis: JenisIki;
	targetMaksimal: boolean;
}

export function bobotKualitasTarget(i: InputBobotTarget): HasilBobot {
	if (i.targetMaksimal) return { bobot: 1.2, catatan: 'Target UU/penilaian instansi/IKI stabil' };
	if (i.jenis === 'baruTanpaHistoris') return { bobot: 1 };
	if (i.polarisasi === 'stabilize') return { bobot: 1, catatan: 'IKI stabilize: minimal 1' };
	if (i.target === null) return { bobot: null, catatan: 'Target tahunan belum diisi' };

	// IKI baru dengan data historis: historis target disamakan dengan historis realisasi
	const r1 = i.realisasiY1;
	const t1 = i.jenis === 'baruHistoris' ? r1 : i.targetY1;
	if (t1 === null || r1 === null) return { bobot: null, catatan: 'Target/realisasi Y-1 belum diisi' };

	const hasil = tabelBobotTarget(i.target, t1, r1, i.polarisasi);
	if (i.jenis === 'mandatory' && hasil.bobot !== null && hasil.bobot < 1)
		return { bobot: 1, catatan: 'IKI mandatory: minimal 1' };
	return hasil;
}

export const nilaiK3 = (bobotKualitas: number | null, bobotTarget: number | null): number | null =>
	bobotKualitas === null || bobotTarget === null ? null : (bobotKualitas + bobotTarget) / 2;

export function labelK3(k3: number | null): string {
	if (k3 === null) return '-';
	if (sama(k3, 1)) return 'Berkualitas';
	return k3 > 1 ? 'Sangat berkualitas' : 'Cukup berkualitas';
}

export interface RincianK3 {
	bobotKualitas: number | null;
	bobotTarget: HasilBobot;
	k3: number | null;
}

export function k3Iki(iki: Iki, target: number | null = targetTahunan(iki)): RincianK3 {
	const bobotKualitas = bobotKualitasIki(iki.validitas, iki.kendali);
	const bobotTarget = bobotKualitasTarget({ ...iki, target });
	return { bobotKualitas, bobotTarget, k3: nilaiK3(bobotKualitas, bobotTarget.bobot) };
}

export interface ZonaTarget {
	/** null = unbounded */
	dari: number | null;
	sampai: number | null;
	/** true = exactly one value (dari === sampai) */
	titik: boolean;
	bobot: number;
	catatan?: string;
}

/**
 * Inverse of Tabel 15 for planning: which Target Y ranges give which bobot kualitas target.
 * Zones are derived by evaluating the table itself, so they always agree with bobotKualitasTarget.
 */
export function rentangTargetK3(
	targetY1: number,
	realisasiY1: number,
	polarisasi: 'maximize' | 'minimize'
): ZonaTarget[] {
	const titik = [...new Set([targetY1, realisasiY1])].sort((a, b) => a - b);
	const jarak = Math.max(1, Math.abs(titik[titik.length - 1] - titik[0]), Math.abs(titik[0]));
	const zona: ZonaTarget[] = [];
	const tambah = (dari: number | null, sampai: number | null, isTitik: boolean, contoh: number) => {
		const h = tabelBobotTarget(contoh, targetY1, realisasiY1, polarisasi);
		zona.push({ dari, sampai, titik: isTitik, bobot: h.bobot as number, catatan: h.catatan });
	};

	tambah(null, titik[0], false, titik[0] - jarak);
	titik.forEach((bp, i) => {
		tambah(bp, bp, true, bp);
		if (i < titik.length - 1) tambah(bp, titik[i + 1], false, (bp + titik[i + 1]) / 2);
	});
	tambah(titik[titik.length - 1], null, false, titik[titik.length - 1] + jarak);
	return zona;
}

/** Threshold Target Y must pass (strictly) to get bobot target 1,2 */
export const syaratTargetMaks = (targetY1: number, realisasiY1: number, polarisasi: 'maximize' | 'minimize') =>
	polarisasi === 'maximize'
		? { arah: '>' as const, batas: Math.max(targetY1, realisasiY1) }
		: { arah: '<' as const, batas: Math.min(targetY1, realisasiY1) };
