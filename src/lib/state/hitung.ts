// Derives every displayed number from the stored data (pure, no Svelte)
import { capaianIki, targetTahunan } from '$lib/calc/capaian';
import { k3Iki, type RincianK3 } from '$lib/calc/k3';
import { kalibrasi } from '$lib/calc/kalibrasi';
import { hitungNhk, type BarisNhk } from '$lib/calc/nhk';
import { nilaiHukdis, hitungNkp, type HasilNkp } from '$lib/calc/nkp';
import { npkPeriodik, npkTahunan } from '$lib/calc/npk';
import type { Iki } from '$lib/calc/types';
import type { DataKinerja } from './persist';

export const LABEL_PERIODE = ['Q1', 'Q2', 'Q3', 'Q4', 'Tahunan'] as const;
export const TAHUNAN = 4;

export interface RincianIki {
	iki: Iki;
	targetY: number | null;
	capaian: number | null;
	k3: RincianK3;
	nhk: BarisNhk;
	/** Has a target in the period but no capaian/K3, so it is left out of NHK */
	dikecualikan: boolean;
}

export interface RingkasanPeriode {
	iki: RincianIki[];
	nhkAwal: number | null;
	nhkKalibrasi: number | null;
	npkAwal: number | null;
	npkKalibrasi: number | null;
	hukdis: number;
	dampak: number;
	koreksi: number;
	nko: number | null;
	nkp: HasilNkp | null;
	/** Missing inputs preventing the NKP result */
	kurang: string[];
}

/** What-if values that replace the stored ones for one calculation; nothing is written back */
export interface Ganti {
	nhk?: number | null;
	npk?: number | null;
	nko?: number | null;
	koreksi?: number | null;
}

export function rincianIki(
	ikis: Iki[],
	periode: number
): { baris: RincianIki[]; nhkAwal: number | null; dikecualikan: string[] } {
	const sampai = Math.min(periode, 3);
	const dasar = ikis.map((iki) => ({ iki, targetY: targetTahunan(iki), capaian: capaianIki(iki, sampai), k3: k3Iki(iki) }));
	const { baris, nhk } = hitungNhk(dasar.map((d) => ({ capaian: d.capaian, k3: d.k3.k3 })));
	// IKIs that have a target in the period but no capaian/K3 are left out of NHK weighting;
	// flag and name them so a partial NHK is never mistaken for a complete one
	const tanda = dasar.map(
		(d) => d.iki.target.slice(0, sampai + 1).some((t) => t !== null) && (d.capaian === null || d.k3.k3 === null)
	);
	const dikecualikan = dasar.flatMap((d, i) => (tanda[i] ? [d.iki.nama || `IKI ${i + 1}`] : []));
	return {
		baris: dasar.map((d, i) => ({ ...d, nhk: baris[i], dikecualikan: tanda[i] })),
		nhkAwal: nhk,
		dikecualikan
	};
}

export function npkAwal(d: DataKinerja, periode: number): number | null {
	const perQ =
		d.npk.mode === 'langsung' ? d.npk.langsung : d.npk.coreValue.map((cv) => npkPeriodik(cv));
	return periode === TAHUNAN ? npkTahunan(perQ) : perQ[periode];
}

export function ringkasan(d: DataKinerja, periode: number, ganti?: Ganti): RingkasanPeriode {
	const { baris, nhkAwal: nhkTersimpan, dikecualikan } = rincianIki(d.ikis, periode);
	const hukdis = nilaiHukdis(d.hukdis, d.tahun, periode === TAHUNAN ? undefined : periode + 1);
	const dampak = d.dampak[periode] ?? 0;
	// ?? keeps a null/undefined override meaning "pakai nilai tersimpan"
	const nhkAwal = ganti?.nhk ?? nhkTersimpan;
	const npk = ganti?.npk ?? npkAwal(d, periode);
	const nko = ganti?.nko ?? d.nko[periode];
	const koreksi = ganti?.koreksi ?? d.koreksi[periode] ?? 0;

	const kurang: string[] = [];
	if (nhkAwal === null) kurang.push('NHK (isi IKI beserta target & realisasi)');
	else if (dikecualikan.length)
		kurang.push(`realisasi/K3 untuk ${dikecualikan.join(', ')} (NHK sementara tanpa IKI tersebut)`);
	if (npk === null) kurang.push('NPK');
	if (nko === null) kurang.push('NKO unit');

	const nhkKalibrasi = nhkAwal === null ? null : kalibrasi(nhkAwal);
	const npkKalibrasi = npk === null ? null : kalibrasi(npk);
	const nkp =
		nhkKalibrasi !== null && npkKalibrasi !== null && nko !== null
			? hitungNkp({
					nhkAwal: nhkKalibrasi,
					npkAwal: npkKalibrasi,
					nko,
					tier: d.tier,
					hukdis,
					dampak,
					koreksi
				})
			: null;

	return {
		iki: baris,
		nhkAwal,
		nhkKalibrasi,
		npkAwal: npk,
		npkKalibrasi,
		hukdis,
		dampak,
		koreksi,
		nko,
		nkp,
		kurang
	};
}

/** Number formatting in Indonesian style (comma decimals) */
export const fmt = (n: number | null | undefined, digit = 2) =>
	n === null || n === undefined || Number.isNaN(n)
		? '–'
		: n.toLocaleString('id-ID', { minimumFractionDigits: digit, maximumFractionDigits: digit });

export const warnaStatus = (n: number | null | undefined) =>
	n === null || n === undefined ? 'netral' : n < 90 ? 'merah' : n <= 100 ? 'kuning' : 'hijau';
