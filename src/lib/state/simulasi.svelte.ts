// What-if values for the Nilai Kinerja page. Deliberately separate from data.svelte.ts:
// nothing here is ever written to localStorage.
import type { Ganti } from './hitung';

/** Same fields as Ganti, but required: bind:value needs number | null, not undefined */
export interface NilaiSimulasi {
	nhk: number | null;
	npk: number | null;
	nko: number | null;
	koreksi: number | null;
}

export const sim = $state<{ aktif: boolean } & NilaiSimulasi>({
	aktif: false,
	nhk: null,
	npk: null,
	nko: null,
	koreksi: null
});

const duaDesimal = (n: number | null | undefined) =>
	n === null || n === undefined ? null : Math.round(n * 100) / 100;

/** Seed the what-if values from the stored ones so the user edits real numbers */
export function mulaiSimulasi(dasar: { nhk: number | null; npk: number | null; nko: number | null; koreksi: number }) {
	sim.nhk = duaDesimal(dasar.nhk);
	sim.npk = duaDesimal(dasar.npk);
	sim.nko = duaDesimal(dasar.nko);
	sim.koreksi = dasar.koreksi;
	sim.aktif = true;
}

export function selesaiSimulasi() {
	sim.aktif = false;
	sim.nhk = null;
	sim.npk = null;
	sim.nko = null;
	sim.koreksi = null;
}

export const gantiSimulasi = (): Ganti | undefined =>
	sim.aktif ? { nhk: sim.nhk, npk: sim.npk, nko: sim.nko, koreksi: sim.koreksi } : undefined;
