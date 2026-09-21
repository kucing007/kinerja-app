// NPK Awal — KMK 127/2026 hal. 138-139
export const NPK_MAKS = 120;

export const CORE_VALUES = [
	'Berorientasi Pelayanan',
	'Akuntabel',
	'Kompeten',
	'Harmonis',
	'Loyal',
	'Adaptif',
	'Kolaboratif'
] as const;

/** Mean of the filled values; null when none are filled */
export function rataRata(nilai: (number | null)[]): number | null {
	const isi = nilai.filter((v): v is number => v !== null);
	return isi.length ? isi.reduce((a, b) => a + b, 0) / isi.length : null;
}

/** NPK Awal Periodik = mean over core values; NPK Awal Tahunan = mean over periods */
export const npkPeriodik = (perCoreValue: (number | null)[]) => rataRata(perCoreValue);
export const npkTahunan = (perPeriode: (number | null)[]) => rataRata(perPeriode);
