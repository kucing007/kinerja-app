import { describe, expect, it } from 'vitest';
import type { Iki } from '$lib/calc/types';
import { rincianIki, ringkasan } from './hitung';
import { dataAwal } from './persist';

const iki = (nama: string, extra: Partial<Iki>): Iki => ({
	id: nama,
	nama,
	polarisasi: 'maximize',
	konsolidasi: 'sum',
	validitas: 'proxy',
	kendali: 'moderate',
	jenis: 'baruTanpaHistoris',
	targetMaksimal: false,
	konversi120: false,
	target: [10, 10, 10, 10],
	realisasi: [null, null, null, null],
	targetY1: null,
	realisasiY1: null,
	realisasiTerburuk: null,
	skalaStabilize: [],
	...extra
});

describe('IKI excluded from a period NHK', () => {
	const ikis = [
		iki('A', { realisasi: [9, null, null, null] }),
		iki('B', { realisasi: [10, 10, null, null] }),
		iki('Tahunan saja', { konsolidasi: 'tlkv', target: [null, null, null, 100] })
	];

	it('names IKIs with a target but no realisasi in the period', () => {
		const r = rincianIki(ikis, 1);
		expect(r.dikecualikan).toEqual(['A']);
		expect(r.baris.map((b) => b.dikecualikan)).toEqual([true, false, false]);
		expect(r.nhkAwal).toBe(100);
	});

	it('does not flag IKIs that have no target yet in the period', () => {
		expect(rincianIki(ikis, 0).dikecualikan).toEqual([]);
	});

	it('flags missing K3 (undefined validity/control cell)', () => {
		const r = rincianIki([iki('C', { realisasi: [10, 10, 10, 10], validitas: 'exact', kendali: 'high' })], 3);
		expect(r.dikecualikan).toEqual(['C']);
	});

	it('surfaces a partial NHK in ringkasan.kurang', () => {
		const d = { ...dataAwal(), ikis };
		expect(ringkasan(d, 1).kurang.some((k) => k.includes('A'))).toBe(true);
	});
});

describe('ringkasan with what-if values', () => {
	const dasar = () => {
		const d = dataAwal();
		d.nko[4] = 100;
		d.npk.langsung = [96, 96, 96, 96];
		return d;
	};

	it('uses the replacements instead of the stored values', () => {
		const d = dasar();
		const r = ringkasan(d, 4, { nhk: 120, koreksi: -5 });
		expect(r.nhkAwal).toBe(120);
		expect(r.nhkKalibrasi).toBe(115); // calibrated from the replacement
		expect(r.koreksi).toBe(-5);
		// 75% x 115 + 25% x 96 = 110.25, minus koreksi 5 = 105.25, >= NKO 100 -> tier 2: 70/30
		expect(r.nkp?.nkpAwal).toBeCloseTo(110.25, 6);
		expect(r.nkp?.nkp).toBeCloseTo(0.7 * 105.25 + 0.3 * 100, 6);
	});

	it('leaves the stored data untouched', () => {
		const d = dasar();
		const sebelum = JSON.stringify(d);
		ringkasan(d, 4, { nhk: 120, npk: 110, nko: 118, koreksi: 5 });
		expect(JSON.stringify(d)).toBe(sebelum);
	});

	it('without replacements behaves exactly as before', () => {
		const d = dasar();
		expect(ringkasan(d, 4, {})).toEqual(ringkasan(d, 4));
		expect(ringkasan(d, 4, { nhk: null, npk: null })).toEqual(ringkasan(d, 4));
	});
});
