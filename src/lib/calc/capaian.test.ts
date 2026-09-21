import { describe, expect, it } from 'vitest';
import { hitungCapaian, konsolidasi, konsolidasiSampai } from './capaian';

describe('hitungCapaian (KMK hal. 67-70)', () => {
	it('maximize = R/T x 100', () => {
		// KMK hal. 68 prints 114,26 for this example; 4,56/4,39 x 100 is actually 103,87
		expect(hitungCapaian(4.56, 4.39, 'maximize')).toBeCloseTo(103.87, 2);
	});

	it('maximize with negative target', () => {
		expect(hitungCapaian(-11, -10, 'maximize')).toBeCloseTo(90, 6);
		expect(hitungCapaian(-5, -10, 'maximize')).toBe(120);
	});

	it('minimize clamps above 120 and below 0', () => {
		expect(hitungCapaian(0.0101, 0.1, 'minimize')).toBe(120);
		expect(hitungCapaian(21, 10, 'minimize')).toBe(0);
	});

	it('minimize with target 0 uses the worst-realisation scale', () => {
		expect(hitungCapaian(4, 0, 'minimize', { realisasiTerburuk: 10 })).toBeCloseTo(60, 6);
		expect(hitungCapaian(4, 0, 'minimize')).toBeNull();
	});

	it('stabilize interpolates on the conversion scale', () => {
		expect(hitungCapaian(96, 100, 'stabilize')).toBeCloseTo(112, 6);
		// KMK hal. 70 uses 102 in the working for realisasi 101; the formula gives Ca = 98
		expect(hitungCapaian(102, 100, 'stabilize')).toBeCloseTo(116, 6);
	});

	it('konversi 120 when a capped target is met', () => {
		expect(hitungCapaian(4, 4, 'maximize', { konversi120: true })).toBe(120);
		expect(hitungCapaian(3, 4, 'maximize', { konversi120: true })).toBeCloseTo(75, 6);
	});

	it('null when data is missing', () => {
		expect(hitungCapaian(null, 10, 'maximize')).toBeNull();
		expect(hitungCapaian(5, 0, 'maximize')).toBeNull();
	});
});

describe('konsolidasi periode (KMK Tabel 4)', () => {
	it('sum accumulates', () => {
		expect(konsolidasi([4, 5, 4, 5], 'sum', 1)).toBe(9);
		expect(konsolidasi([4, 5, 4, 5], 'sum')).toBe(18);
	});

	it('take last known value', () => {
		expect(konsolidasi([25, 60, 75, 100], 'tlkv', 2)).toBe(75);
	});

	it('average', () => {
		expect(konsolidasi([3.25, 3.25, 3.25, 3.25], 'average')).toBe(3.25);
	});

	it('konsolidasiSampai needs realisasi for every targeted quarter', () => {
		expect(konsolidasiSampai([10, 10, 10, 10], [9, 11, null, null], 'sum', 1)).toEqual({
			target: 20,
			realisasi: 20
		});
		expect(konsolidasiSampai([10, 10, 10, 10], [9, null, null, null], 'sum', 1)).toBeNull();
		expect(konsolidasiSampai([null, null, null, 100], [null, null, null, 90], 'tlkv', 1)).toBeNull();
	});
});
