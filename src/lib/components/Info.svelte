<script lang="ts">
	// Toggletip: a real button + native popover, so it works by tap and keyboard (title tooltips do not).
	// Do not place inside a <label>: a button would become that label's control.
	let { teks, label = 'Penjelasan' }: { teks: string; label?: string } = $props();
	const uid = $props.id();
	const id = `info-${uid}`;
</script>

<button
	type="button"
	popovertarget={id}
	class="ml-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-muted/50 align-middle text-[10px] leading-none font-semibold text-muted hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
	aria-label={label}>i</button
>
<div
	{id}
	popover="auto"
	class="m-auto w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-line bg-white p-4 text-sm text-ink shadow-xl backdrop:bg-ink/20"
>
	<p>{teks}</p>
	<button
		type="button"
		popovertarget={id}
		popovertargetaction="hide"
		class="mt-3 text-xs font-medium text-brand underline">Tutup</button
	>
</div>
