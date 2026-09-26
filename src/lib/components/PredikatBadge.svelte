<script lang="ts">
	import type { Predikat } from '$lib/calc/types';

	let { predikat, kecil = false }: { predikat: Predikat | null; kecil?: boolean } = $props();

	const WARNA: Record<Predikat, string> = {
		'Sangat Baik': 'bg-emerald-600 text-white',
		Baik: 'bg-emerald-100 text-emerald-800',
		'Butuh Perbaikan': 'bg-amber-100 text-amber-800',
		Kurang: 'bg-orange-100 text-orange-800',
		'Sangat Kurang': 'bg-red-100 text-red-800'
	};
</script>

<span
	class="inline-flex rounded-full font-semibold whitespace-nowrap {kecil ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'} {predikat
		? WARNA[predikat]
		: 'bg-paper text-muted'}">{predikat ?? 'Belum lengkap'}</span
>
