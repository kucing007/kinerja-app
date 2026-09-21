// Global app state (safe as a module singleton because the app runs without SSR)
import { SKALA_STABILIZE_DEFAULT } from '$lib/calc/capaian';
import type { Hukdis, Iki } from '$lib/calc/types';
import { dataAwal, muat, simpan, type DataKinerja } from './persist';

export const data = $state<DataKinerja>(muat() ?? dataAwal());

$effect.root(() => {
	$effect(() => simpan($state.snapshot(data) as DataKinerja));
});

const uid = () => crypto.randomUUID();

export function ikiBaru(nama = ''): Iki {
	return {
		id: uid(),
		nama,
		polarisasi: 'maximize',
		konsolidasi: 'tlkv',
		validitas: 'proxy',
		kendali: 'moderate',
		jenis: 'lama',
		targetMaksimal: false,
		konversi120: false,
		target: [null, null, null, null],
		realisasi: [null, null, null, null],
		targetY1: null,
		realisasiY1: null,
		realisasiTerburuk: null,
		skalaStabilize: SKALA_STABILIZE_DEFAULT.map((t) => ({ ...t }))
	};
}

export const hukdisBaru = (): Hukdis => ({
	id: uid(),
	kategori: 'ringan',
	skorMPJHD: 0,
	tahun: data.tahun,
	triwulan: 1
});

export function gantiData(baru: DataKinerja) {
	Object.assign(data, baru);
}

export const resetData = () => gantiData(dataAwal());
