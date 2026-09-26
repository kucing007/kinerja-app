// Period shown across Nilai Kinerja, Hasil Kerja and Perilaku Kerja. Kept out of the stored data:
// it is a view choice, not part of the assessment.
import { data } from './data.svelte';
import { TAHUNAN } from './hitung';

/**
 * Latest quarter that has any realisasi or NPK, so mid-year users land on numbers instead of an
 * empty annual view. Q4 filled means the year is complete, so Tahunan.
 */
function periodeTerakhir(): number {
	const npk =
		data.npk.mode === 'langsung' ? data.npk.langsung : data.npk.coreValue.map((cv) => (cv.some((x) => x !== null) ? 1 : null));
	for (let q = 3; q >= 0; q--) {
		if (npk[q] !== null || data.ikis.some((iki) => iki.realisasi[q] !== null)) return q === 3 ? TAHUNAN : q;
	}
	// Nothing entered yet: a past year is assessed as a whole; the current year up to the last
	// completed quarter, which is the one realisasi gets entered for next
	const kini = new Date();
	if (data.tahun < kini.getFullYear()) return TAHUNAN;
	if (data.tahun > kini.getFullYear()) return 0;
	return Math.max(0, Math.floor(kini.getMonth() / 3) - 1);
}

// Computed once at startup, not reactively: typing a Q3 realisasi must not move the period mid-entry
export const tampilan = $state({ periode: periodeTerakhir() });

/** After import or reset the data is a different assessment, so pick its default again */
export const setelUlangPeriode = () => (tampilan.periode = periodeTerakhir());
