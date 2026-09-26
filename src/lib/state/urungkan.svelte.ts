// Delete-with-undo for single items: acting at once and offering "Urungkan" is less friction than
// a confirm() for every row, and still recoverable. Bulk actions (reset, replace plan) keep confirm().

interface Pesan {
	teks: string;
	pulihkan: () => void;
}

export const notifikasi = $state<{ pesan: Pesan | null }>({ pesan: null });

let timer: ReturnType<typeof setTimeout> | undefined;

export function tawarkanUrungkan(teks: string, pulihkan: () => void) {
	clearTimeout(timer);
	notifikasi.pesan = { teks, pulihkan };
	timer = setTimeout(tutupNotifikasi, 8000);
}

export function tutupNotifikasi() {
	clearTimeout(timer);
	notifikasi.pesan = null;
}

/**
 * Remove one item and offer to put it back at the same index with the same object, because
 * lists are bound by index (bind:iki={data.ikis[i]}) and keyed by id.
 */
export function hapusDenganUrungkan<T>(daftar: () => T[], ganti: (baru: T[]) => void, index: number, teks: string) {
	const item = daftar()[index];
	ganti(daftar().filter((_, i) => i !== index));
	tawarkanUrungkan(teks, () => {
		const kini = [...daftar()];
		kini.splice(Math.min(index, kini.length), 0, item);
		ganti(kini);
	});
}
