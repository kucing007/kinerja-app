import { describe, expect, it } from 'vitest';
import { kalibrasi } from './kalibrasi';
import { hitungNhk } from './nhk';
import { npkPeriodik } from './npk';
import { hitungNkp, nilaiDampak, nilaiHukdis, predikat } from './nkp';
import type { Hukdis } from './types';

describe('NHK Awal (sosialisasi slide simulasi NKP Awal)', () => {
	const komponen = [
		{ capaian: 80, k3: 1.05 },
		{ capaian: 120, k3: 0.9 },
		{ capaian: 104.69, k3: 1 },
		{ capaian: 120, k3: 1 },
		{ capaian: 100, k3: 1.1 }
	];

	it('weighted by K3 proportion, then calibrated to 115', () => {
		const { baris, nhk } = hitungNhk(komponen);
		expect(baris[0].nilaiKualitasCapaian).toBeCloseTo(84, 6);
		expect(baris[0].bobotTertimbang! * 100).toBeCloseTo(20.8, 1);
		expect(nhk).toBeCloseTo(105.17, 2);
		expect(kalibrasi(nhk!)).toBeCloseTo(103.87, 2);
	});

	it('bobot tertimbang Tabel 35', () => {
		const { baris } = hitungNhk([
			{ capaian: 100, k3: 1 },
			{ capaian: 100, k3: 1.1 },
			{ capaian: 100, k3: 0.85 }
		]);
		expect(baris.map((b) => +(b.bobotTertimbang! * 100).toFixed(2))).toEqual([33.9, 37.29, 28.81]);
	});

	it('bobot tertimbang with SKP adendum days (Tabel 36 formula, unrounded)', () => {
		// KMK Tabel 36 rounds intermediates (0,39/0,96 -> 40,62); exact values differ slightly
		const { baris } = hitungNhk([
			{ capaian: 100, k3: 1, hari: 365 },
			{ capaian: 100, k3: 1.1, hari: 200 },
			{ capaian: 100, k3: 0.85, hari: 365 }
		]);
		expect(baris.map((b) => b.bobotTertimbang! * 100)).toEqual([
			expect.closeTo(40.77, 2),
			expect.closeTo(24.57, 2),
			expect.closeTo(34.66, 2)
		]);
	});

	it('skips IKIs without capaian in the period', () => {
		const { baris, nhk } = hitungNhk([
			{ capaian: 100, k3: 1 },
			{ capaian: null, k3: 1.2 }
		]);
		expect(baris[1].bobotTertimbang).toBeNull();
		expect(nhk).toBe(100);
		expect(hitungNhk([{ capaian: null, k3: 1 }]).nhk).toBeNull();
	});
});

describe('NPK & NKP Awal (sosialisasi slide)', () => {
	it('core values average, calibrated, combined 75/25', () => {
		const npk = npkPeriodik([82, 100, 98, 105, 100, 115, 105])!;
		expect(npk).toBeCloseTo(100.71, 2);
		expect(kalibrasi(npk)).toBeCloseTo(100.54, 2);
		const nhk = kalibrasi(531.09 / 5.05);
		expect(0.75 * nhk + 0.25 * kalibrasi(npk)).toBeCloseTo(103.04, 2);
	});

	it('kalibrasi leaves values <= 100 untouched', () => {
		expect(kalibrasi(96)).toBe(96);
		expect(kalibrasi(120)).toBe(115);
	});
});

describe('NKP final', () => {
	it('Jerry (KMK hal. 148-149, tier 2, NKO 102 per Tabel 46)', () => {
		// Prose on hal. 148 says NKO 104, but Tabel 46/47 use 102 and only 102 is consistent
		const h = hitungNkp({ nhkAwal: 108, npkAwal: 96, nko: 102, tier: 2, hukdis: 0, dampak: 0, koreksi: -5 });
		expect(h.nkpAwal).toBe(105);
		expect(h.hasil).toBe(100);
		expect(h.bobotNko).toBe(0.1);
		expect(h.nkp).toBeCloseTo(100.2, 6);
		expect(h.nhk.akhir).toBeCloseTo(102.7, 6);
		expect(h.nhk.rating).toBe('Di Atas Ekspektasi');
		expect(h.npk.akhir).toBeCloseTo(92.1, 6);
		expect(h.npk.rating).toBe('Sesuai Ekspektasi');
		expect(h.predikat).toBe('Baik');
	});

	it.each([
		{ nko: 120, tier: 1, nkp: 115.5 },
		{ nko: 120, tier: 2, nkp: 115.5 },
		{ nko: 110, tier: 1, nkp: 112.5 },
		{ nko: 110, tier: 2, nkp: 113.5 }
	] as const)('kondisi normal NHK=NPK=115, NKO $nko tier $tier -> $nkp', ({ nko, tier, nkp }) => {
		const h = hitungNkp({ nhkAwal: 115, npkAwal: 115, nko, tier, hukdis: 0, dampak: 0, koreksi: 0 });
		expect(h.nkp).toBeCloseTo(nkp, 6);
	});

	it.each([
		{ hukdis: 15, nko: 120, tier: 1, nkp: 102 },
		{ hukdis: 15, nko: 120, tier: 2, nkp: 102 },
		{ hukdis: 3, nko: 110, tier: 1, nkp: 111 },
		{ hukdis: 3, nko: 110, tier: 2, nkp: 111.4 }
	] as const)('dijatuhi hukdis $hukdis, NKO $nko tier $tier -> $nkp', ({ hukdis, nko, tier, nkp }) => {
		const h = hitungNkp({ nhkAwal: 115, npkAwal: 115, nko, tier, hukdis, dampak: 0, koreksi: 0 });
		expect(h.nkp).toBeCloseTo(nkp, 6);
	});

	it('koreksi is capped at +/-5', () => {
		const h = hitungNkp({ nhkAwal: 100, npkAwal: 100, nko: 100, tier: 2, hukdis: 0, dampak: 0, koreksi: -9 });
		expect(h.penyesuaian).toBe(-5);
	});
});

describe('Nilai Hukdis & Dampak', () => {
	const hk = (kategori: Hukdis['kategori'], skorMPJHD: number, tahun: number, triwulan: Hukdis['triwulan']): Hukdis => ({
		id: `${kategori}${skorMPJHD}`,
		kategori,
		skorMPJHD,
		tahun,
		triwulan
	});

	it('Runda: Sedang MPJHD 38 from Q3 2026 for 3 quarters', () => {
		const d = [hk('sedang', 38, 2026, 3)];
		expect(nilaiHukdis(d, 2026, 2)).toBe(0);
		expect(nilaiHukdis(d, 2026, 3)).toBeCloseTo(9.5, 6);
		expect(nilaiHukdis(d, 2027, 1)).toBeCloseTo(9.5, 6);
		expect(nilaiHukdis(d, 2027, 2)).toBe(0);
		expect(nilaiHukdis(d, 2026)).toBeCloseTo(9.5, 6);
		expect(nilaiHukdis(d, 2027)).toBe(0);
	});

	it('Endro: not cumulative, highest category wins', () => {
		const d = [hk('ringan', 16, 2026, 2), hk('sedang', 57, 2026, 3)];
		expect(nilaiHukdis(d, 2026, 2)).toBeCloseTo(1.6, 6);
		expect(nilaiHukdis(d, 2026, 3)).toBeCloseTo(14.25, 6);
		expect(nilaiHukdis(d, 2026)).toBeCloseTo(14.25, 6);
	});

	it('Yatno: Berat MPJHD 65 = 26', () => {
		expect(nilaiHukdis([hk('ringan', 29, 2026, 2), hk('berat', 65, 2026, 3)], 2026)).toBeCloseTo(26, 6);
	});

	it('dampak = 5% of subordinate hukdis, max 5', () => {
		expect(nilaiDampak([26])).toBeCloseTo(1.3, 6);
		expect(nilaiDampak([60, 60])).toBe(5);
	});
});

describe('predikat (PermenPANRB 6/2022)', () => {
	it('matrix', () => {
		expect(predikat('Di Atas Ekspektasi', 'Di Atas Ekspektasi')).toBe('Sangat Baik');
		expect(predikat('Sesuai Ekspektasi', 'Sesuai Ekspektasi')).toBe('Baik');
		expect(predikat('Di Bawah Ekspektasi', 'Di Atas Ekspektasi')).toBe('Butuh Perbaikan');
		expect(predikat('Di Atas Ekspektasi', 'Di Bawah Ekspektasi')).toBe('Kurang');
		expect(predikat('Di Bawah Ekspektasi', 'Di Bawah Ekspektasi')).toBe('Sangat Kurang');
	});
});
