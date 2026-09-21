<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	let { children } = $props();

	const menu = [
		{ href: '/', label: 'Nilai Kinerja' },
		{ href: '/iki', label: 'Hasil Kerja' },
		{ href: '/perilaku', label: 'Perilaku Kerja' },
		{ href: '/perencanaan', label: 'Perencanaan' }
	] as const;

	const aktif = (href: string) =>
		href === '/' ? page.url.pathname === resolve('/') : page.url.pathname.startsWith(resolve(href as '/iki'));
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Kalkulator Kinerja · KMK 127/2026</title>
</svelte:head>

<div class="min-h-screen">
	<header class="border-b border-line bg-white">
		<div class="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5">
			<a href={resolve('/')} class="leading-tight">
				<span class="block text-base font-semibold text-brand">Kalkulator Kinerja</span>
				<span class="block text-xs text-muted">Perhitungan KMK 127/2026 · Non-Pimpinan UPK</span>
			</a>
			<nav
				class="order-last -mx-1 flex w-full gap-1 overflow-x-auto [scrollbar-width:none] md:order-none md:mx-0 md:w-auto [&::-webkit-scrollbar]:hidden"
				aria-label="Menu utama"
			>
				{#each menu as m (m.href)}
					<a
						href={resolve(m.href)}
						class="shrink-0 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap {aktif(m.href)
							? 'bg-brand-soft text-brand'
							: 'text-muted hover:bg-paper hover:text-ink'}"
						aria-current={aktif(m.href) ? 'page' : undefined}>{m.label}</a
					>
				{/each}
			</nav>
			<a
				href={resolve('/pengaturan')}
				class="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium {aktif('/pengaturan')
					? 'bg-brand-soft text-brand'
					: 'text-muted hover:bg-paper hover:text-ink'}"
				aria-current={aktif('/pengaturan') ? 'page' : undefined}
			>
				<span aria-hidden="true">⚙</span> Pengaturan
			</a>
		</div>
	</header>

	<main class="mx-auto max-w-6xl px-4 py-6">
		{@render children()}
	</main>

	<footer class="mx-auto max-w-6xl px-4 pb-8 text-xs text-muted">
		Hasil di sini adalah <b>perhitungan mandiri</b>, bukan hasil resmi aplikasi Performa. Data hanya tersimpan di browser ini
		(NKP bersifat rahasia, KMK 127/2026 hal. 118).
	</footer>
</div>
