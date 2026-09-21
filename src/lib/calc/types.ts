// Domain types for KMK 127/2026 (Non-Pimpinan UPK)

export type Polarisasi = 'maximize' | 'minimize' | 'stabilize';
export type Konsolidasi = 'sum' | 'tlkv' | 'average';
export type Validitas = 'exact' | 'proxy' | 'activity';
export type Kendali = 'low' | 'moderate' | 'high';
/** lama = IKI lama; baruHistoris/baruTanpaHistoris = IKI baru; mandatory = IKI mandatory */
export type JenisIki = 'lama' | 'baruHistoris' | 'baruTanpaHistoris' | 'mandatory';
/** 1 = 1 tingkat di bawah Pimpinan UPK / JF substansi; 2 = 2 tingkat atau lebih / JF non-substansi */
export type Tier = 1 | 2;
export type KategoriHukdis = 'ringan' | 'sedang' | 'berat';
export type Rating = 'Di Atas Ekspektasi' | 'Sesuai Ekspektasi' | 'Di Bawah Ekspektasi';
export type Predikat = 'Sangat Baik' | 'Baik' | 'Butuh Perbaikan' | 'Kurang' | 'Sangat Kurang';

/** Quarterly values Q1..Q4; null = not set */
export type Triwulanan = [number | null, number | null, number | null, number | null];

/** Stabilize conversion point: Ca (capaian awal) -> Cn (capaian) */
export interface TitikSkala {
	ca: number;
	cn: number;
}

export interface Iki {
	id: string;
	nama: string;
	polarisasi: Polarisasi;
	konsolidasi: Konsolidasi;
	validitas: Validitas;
	kendali: Kendali;
	jenis: JenisIki;
	/** Target set by UU, max target from an institution >= Kementerian, or stable IKI -> bobot target 1,2 */
	targetMaksimal: boolean;
	/** IKI whose realisation cannot exceed target (converted to 120 when target is met) */
	konversi120: boolean;
	target: Triwulanan;
	realisasi: Triwulanan;
	targetY1: number | null;
	realisasiY1: number | null;
	/** Minimize with target 0: worst tolerable realisation (capaian 0) */
	realisasiTerburuk: number | null;
	skalaStabilize: TitikSkala[];
}

export interface Hukdis {
	id: string;
	kategori: KategoriHukdis;
	skorMPJHD: number;
	/** Year and quarter (1-4) of the first evaluation period the penalty applies to */
	tahun: number;
	triwulan: 1 | 2 | 3 | 4;
}
