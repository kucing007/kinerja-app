// Kalibrasi NHK/NPK Awal — KMK 127/2026 hal. 139 (maks 115 bagi non-JPTM)
//
// The KMK states only the cap; the formula on the sosialisasi slide is garbled in the PDF.
// Reconstructed as a linear rescale of the >100 band [100,120] onto [100,115], which
// reproduces both slide examples: NHK 105,17 -> 103,87 and NPK 100,71 -> 100,54.

export const KALIBRASI_MAKS = 115;

export function kalibrasi(nilai: number, maks = KALIBRASI_MAKS): number {
	if (nilai <= 100) return nilai;
	return 100 + (Math.min(nilai, 120) - 100) * ((maks - 100) / (120 - 100));
}
