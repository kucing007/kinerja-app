<script lang="ts">
	import { CORE_VALUES } from '$lib/calc/npk';
	import { data } from '$lib/state/data.svelte';
	import NumInput from './NumInput.svelte';

	const Q = ['Q1', 'Q2', 'Q3', 'Q4'];
</script>

<div class="space-y-3">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<label class="label mb-0" for="npk-mode">Cara mengisi</label>
		<select id="npk-mode" class="input w-auto" bind:value={data.npk.mode}>
			<option value="langsung">Isi NPK per triwulan</option>
			<option value="coreValue">Hitung dari 7 core value</option>
		</select>
	</div>

	{#if data.npk.mode === 'langsung'}
		<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
			{#each Q as q, i (q)}
				<div>
					<label class="label" for="npk-{i}">NPK {q}</label>
					<NumInput id="npk-{i}" bind:value={data.npk.langsung[i]} />
				</div>
			{/each}
		</div>
	{:else}
		<div class="overflow-x-auto">
			<table class="tbl min-w-[30rem]">
				<thead>
					<tr><th scope="col">Core value</th>{#each Q as q (q)}<th scope="col">{q}</th>{/each}</tr>
				</thead>
				<tbody>
					{#each CORE_VALUES as cv, c (cv)}
						<tr>
							<th scope="row" class="font-normal text-ink">{cv}</th>
							{#each Q as q, i (q)}
								<td><NumInput bind:value={data.npk.coreValue[i][c]} label="{cv} {q}" /></td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<p class="text-xs text-muted">NPK triwulan = rata-rata nilai seluruh core value pada triwulan itu (KMK hal. 138).</p>
	{/if}
</div>
