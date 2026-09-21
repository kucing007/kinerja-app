<script lang="ts">
	import { fmt, warnaStatus } from '$lib/state/hitung';

	interface Props {
		judul: string;
		nilai: number | null;
		catatan?: string;
		/** Colour the edge by status (merah < 90, kuning 90-100, hijau > 100) */
		status?: boolean;
	}

	let { judul, nilai, catatan = '', status = true }: Props = $props();

	const WARNA = {
		merah: 'border-l-red-500',
		kuning: 'border-l-amber-400',
		hijau: 'border-l-emerald-500',
		netral: 'border-l-line'
	};
</script>

<div class="card border-l-4 {status ? WARNA[warnaStatus(nilai)] : 'border-l-brand'}">
	<div class="text-xs font-medium text-muted">{judul}</div>
	<div class="mt-1 text-2xl font-semibold tabular-nums">{fmt(nilai)}</div>
	{#if catatan}<div class="mt-1 text-xs text-muted">{catatan}</div>{/if}
</div>
