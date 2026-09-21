<script lang="ts">
	import type { Predikat } from '$lib/calc/types';

	let { predikat }: { predikat: Predikat | null } = $props();

	const WARNA: Record<Predikat, string> = {
		'Sangat Baik': 'bg-emerald-600 text-white',
		Baik: 'bg-emerald-100 text-emerald-800',
		'Butuh Perbaikan': 'bg-amber-100 text-amber-800',
		Kurang: 'bg-orange-100 text-orange-800',
		'Sangat Kurang': 'bg-red-100 text-red-800'
	};
</script>

<span
	class="inline-flex rounded-full px-3 py-1 text-sm font-semibold {predikat
		? WARNA[predikat]
		: 'bg-paper text-muted'}">{predikat ?? 'Belum lengkap'}</span
>
