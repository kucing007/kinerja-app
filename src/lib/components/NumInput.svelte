<script lang="ts">
	import { untrack } from 'svelte';

	interface Props {
		value: number | null;
		id?: string;
		label?: string;
		placeholder?: string;
		/** false = empty input keeps the previous number */
		nullable?: boolean;
		class?: string;
	}

	let { value = $bindable(), id, label, placeholder = '', nullable = true, class: kelas = '' }: Props = $props();

	// Accepts Indonesian "1.250,5" as well as "1250.5"
	function parse(s: string): number | null | undefined {
		let t = s.trim();
		if (t === '') return null;
		t = t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t;
		const n = Number(t);
		return Number.isFinite(n) ? n : undefined;
	}

	const tampil = (v: number | null | undefined) => (v === null || v === undefined ? '' : String(v).replace('.', ','));

	// Local text so partial input like "1," is not overwritten while typing
	let teks = $state(untrack(() => tampil(value)));
	// Text that cannot be read as a number is not saved; flag it so the user notices
	const invalid = $derived(parse(teks) === undefined || (parse(teks) === null && !nullable));

	$effect(() => {
		const v = value ?? null;
		if (untrack(() => parse(teks)) !== v) teks = tampil(v);
	});

	function oninput(e: Event) {
		teks = (e.currentTarget as HTMLInputElement).value;
		const n = parse(teks);
		if (n === undefined || (n === null && !nullable)) return;
		value = n;
	}
</script>

<input
	type="text"
	inputmode="decimal"
	{id}
	{placeholder}
	aria-label={label}
	aria-invalid={invalid}
	title={invalid ? 'Angka tidak valid, nilai tidak disimpan' : undefined}
	class="input {kelas} {invalid ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500' : ''}"
	value={teks}
	{oninput}
/>
