// NHK Awal — KMK 127/2026 hal. 125-126
import { CAPAIAN_MAKS } from './capaian';

export const NHK_MAKS = 120;

export interface KomponenNhk {
	capaian: number | null;
	k3: number | null;
	/** Days the IKI is active (SKP adendum); omit for equal periods */
	hari?: number;
}

export interface BarisNhk {
	nilaiKualitasCapaian: number | null;
	bobotTertimbang: number | null;
	kontribusi: number | null;
}

/** IKIs without capaian or K3 in the period are left out of the weighting */
export function hitungNhk(komponen: KomponenNhk[]): { baris: BarisNhk[]; nhk: number | null } {
	const aktif = komponen.map((k) => k.capaian !== null && k.k3 !== null);
	const totalHari = komponen.reduce((s, k, i) => s + (aktif[i] ? (k.hari ?? 1) : 0), 0);
	const bobotK3 = komponen.map((k, i) => (aktif[i] ? (k.k3 as number) * ((k.hari ?? 1) / totalHari) : 0));
	const totalBobot = bobotK3.reduce((a, b) => a + b, 0);

	const baris = komponen.map((k, i): BarisNhk => {
		if (!aktif[i] || totalBobot === 0) return { nilaiKualitasCapaian: null, bobotTertimbang: null, kontribusi: null };
		const nilaiKualitasCapaian = Math.min(CAPAIAN_MAKS, (k.capaian as number) * (k.k3 as number));
		const bobotTertimbang = bobotK3[i] / totalBobot;
		return { nilaiKualitasCapaian, bobotTertimbang, kontribusi: nilaiKualitasCapaian * bobotTertimbang };
	});

	const nhk = aktif.some(Boolean) && totalBobot > 0
		? Math.min(NHK_MAKS, baris.reduce((s, b) => s + (b.kontribusi ?? 0), 0))
		: null;
	return { baris, nhk };
}
