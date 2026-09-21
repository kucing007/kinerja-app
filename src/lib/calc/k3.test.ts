import { describe, expect, it } from 'vitest';
import {
	bobotKualitasIki,
	bobotKualitasTarget,
	labelK3,
	nilaiK3,
	rentangTargetK3,
	syaratTargetMaks,
	tabelBobotTarget
} from './k3';

describe('bobot kualitas IKI (Tabel 14)', () => {
	it('matrix values and undefined cells', () => {
		expect(bobotKualitasIki('exact', 'low')).toBe(1.2);
		expect(bobotKualitasIki('proxy', 'moderate')).toBe(1);
		expect(bobotKualitasIki('activity', 'high')).toBe(0.6);
		expect(bobotKualitasIki('exact', 'high')).toBeNull();
		expect(bobotKualitasIki('activity', 'low')).toBeNull();
	});
});

describe('bobot kualitas target (Tabel 15)', () => {
	it('maximize rows', () => {
		expect(tabelBobotTarget(110, 100, 105, 'maximize').bobot).toBe(1.2);
		expect(tabelBobotTarget(105, 100, 105, 'maximize').bobot).toBe(1.1);
		expect(tabelBobotTarget(103, 100, 105, 'maximize').bobot).toBe(1);
		expect(tabelBobotTarget(100, 100, 95, 'maximize').bobot).toBe(1);
		expect(tabelBobotTarget(100, 100, 105, 'maximize').bobot).toBe(0.9);
		expect(tabelBobotTarget(95, 100, 105, 'maximize').bobot).toBe(0.8);
	});

	it('minimize mirrors maximize', () => {
		expect(tabelBobotTarget(5, 10, 8, 'minimize').bobot).toBe(1.2);
		expect(tabelBobotTarget(8, 10, 8, 'minimize').bobot).toBe(1.1);
		expect(tabelBobotTarget(10, 10, 8, 'minimize').bobot).toBe(0.9);
		expect(tabelBobotTarget(12, 10, 8, 'minimize').bobot).toBe(0.8);
	});

	it('unregulated combination flags a note', () => {
		const h = tabelBobotTarget(100, 100, 100, 'maximize');
		expect(h.bobot).toBe(1);
		expect(h.catatan).toBeDefined();
	});

	it('overrides by jenis', () => {
		const dasar = { target: 95, targetY1: 100, realisasiY1: 105, polarisasi: 'maximize' as const, targetMaksimal: false };
		expect(bobotKualitasTarget({ ...dasar, jenis: 'lama' }).bobot).toBe(0.8);
		expect(bobotKualitasTarget({ ...dasar, jenis: 'mandatory' }).bobot).toBe(1);
		expect(bobotKualitasTarget({ ...dasar, jenis: 'baruTanpaHistoris' }).bobot).toBe(1);
		expect(bobotKualitasTarget({ ...dasar, jenis: 'lama', targetMaksimal: true }).bobot).toBe(1.2);
		expect(bobotKualitasTarget({ ...dasar, jenis: 'lama', polarisasi: 'stabilize' }).bobot).toBe(1);
		// IKI baru dengan data historis: target Y-1 := realisasi Y-1 (105), so 95 < 105 -> 0,8
		expect(bobotKualitasTarget({ ...dasar, jenis: 'baruHistoris' }).bobot).toBe(0.8);
		expect(bobotKualitasTarget({ ...dasar, jenis: 'lama', targetY1: null }).bobot).toBeNull();
	});
});

describe('nilai K3', () => {
	it('KMK hal. 75 example: exact/low with target from UU = 1,2', () => {
		expect(nilaiK3(bobotKualitasIki('exact', 'low'), 1.2)).toBe(1.2);
	});

	it('labels', () => {
		expect(labelK3(1.05)).toBe('Sangat berkualitas');
		expect(labelK3(1)).toBe('Berkualitas');
		expect(labelK3(0.9)).toBe('Cukup berkualitas');
	});
});

describe('rentangTargetK3 (planning inverse)', () => {
	it('maximize with realisasi above target', () => {
		const zona = rentangTargetK3(100, 105, 'maximize');
		expect(zona.map((z) => z.bobot)).toEqual([0.8, 0.9, 1, 1.1, 1.2]);
		expect(zona[4]).toMatchObject({ dari: 105, sampai: null });
		expect(syaratTargetMaks(100, 105, 'maximize')).toEqual({ arah: '>', batas: 105 });
	});

	it('maximize with realisasi below target', () => {
		// zones: <95, =95, 95..100 (all below Target Y-1), =100 (R1 < T1 -> 1,0), >100
		expect(rentangTargetK3(100, 95, 'maximize').map((z) => z.bobot)).toEqual([0.8, 0.8, 0.8, 1, 1.2]);
	});

	it('minimize', () => {
		const zona = rentangTargetK3(10, 8, 'minimize');
		expect(zona.map((z) => z.bobot)).toEqual([1.2, 1.1, 1, 0.9, 0.8]);
		expect(syaratTargetMaks(10, 8, 'minimize')).toEqual({ arah: '<', batas: 8 });
	});
});
