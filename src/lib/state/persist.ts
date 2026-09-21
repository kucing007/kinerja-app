// Browser-only persistence: localStorage + JSON export/import. Nothing leaves the device.
import type { Hukdis, Iki, Tier, Triwulanan } from '$lib/calc/types';

export const STORAGE_KEY = 'kinerja-kmk127-v1';
export const VERSION = 1;

/** Index 0-3 = Q1..Q4, index 4 = tahunan */
export type PerPeriode = [number | null, number | null, number | null, number | null, number | null];

export interface DataKinerja {
	version: typeof VERSION;
	tahun: number;
	tier: Tier;
	nko: PerPeriode;
	ikis: Iki[];
	npk: {
		mode: 'langsung' | 'coreValue';
		langsung: Triwulanan;
		/** 4 quarters x 7 core values */
		coreValue: (number | null)[][];
	};
	hukdis: Hukdis[];
	dampak: PerPeriode;
	koreksi: PerPeriode;
	rencana: Iki[];
}

export const kosongPeriode = (): PerPeriode => [null, null, null, null, null];

export function dataAwal(): DataKinerja {
	return {
		version: VERSION,
		tahun: new Date().getFullYear(),
		tier: 2,
		nko: kosongPeriode(),
		ikis: [],
		npk: {
			mode: 'langsung',
			langsung: [null, null, null, null],
			coreValue: Array.from({ length: 4 }, () => Array(7).fill(null))
		},
		hukdis: [],
		dampak: kosongPeriode(),
		koreksi: kosongPeriode(),
		rencana: []
	};
}

function valid(x: unknown): x is DataKinerja {
	return (
		typeof x === 'object' &&
		x !== null &&
		(x as DataKinerja).version === VERSION &&
		Array.isArray((x as DataKinerja).ikis)
	);
}

/**
 * Fill fields missing from older saves with defaults. Tier is coerced to a number because
 * hand-edited imports may carry "1": bobotNko compares tier === 1, so a string would
 * silently apply the tier-2 NKO weight.
 */
export const lengkapi = (d: DataKinerja): DataKinerja => ({
	...dataAwal(),
	...d,
	tier: Number(d.tier) === 1 ? 1 : 2,
	npk: { ...dataAwal().npk, ...d.npk }
});

export function muat(): DataKinerja | null {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		return valid(parsed) ? lengkapi(parsed) : null;
	} catch {
		return null;
	}
}

export function simpan(data: DataKinerja): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	} catch {
		// storage blocked or full: app keeps working in memory
	}
}

export function eksporJson(data: DataKinerja): void {
	const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `kinerja-${data.tahun}.json`;
	a.click();
	URL.revokeObjectURL(url);
}

export async function imporJson(file: File): Promise<DataKinerja> {
	const parsed = JSON.parse(await file.text());
	if (!valid(parsed)) throw new Error('File bukan data Kalkulator Kinerja yang valid');
	return lengkapi(parsed);
}
