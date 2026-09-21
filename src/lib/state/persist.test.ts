import { describe, expect, it } from 'vitest';
import { dataAwal, lengkapi, type DataKinerja } from './persist';

describe('lengkapi (load/import normalisation)', () => {
	it('coerces a string tier so the NKO weight branch stays correct', () => {
		const impor = { ...dataAwal(), tier: '1' } as unknown as DataKinerja;
		expect(lengkapi(impor).tier).toBe(1);
		expect(lengkapi({ ...dataAwal(), tier: 2 }).tier).toBe(2);
	});

	it('fills fields missing from older saves', () => {
		const lama = { version: 1, tahun: 2026, tier: 2, ikis: [] } as unknown as DataKinerja;
		const d = lengkapi(lama);
		expect(d.rencana).toEqual([]);
		expect(d.npk.coreValue).toHaveLength(4);
		expect(d.nko).toHaveLength(5);
	});
});
