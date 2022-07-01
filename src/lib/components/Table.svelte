<script lang="ts">
	export let columns: string[];
	export let rows: any[];
	export let selectable: boolean = true;

	let all: boolean = false;
	let el: HTMLElement;
	let selected: any[] = [];

	function updateSelected() {
		if (el) {
			el.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((checkbox) => {
				if (checkbox.value) {
					const checked = !!checkbox.checked;
					const row = rows[+checkbox.value];
					if (row) {
						if (checked && !selected.includes(row)) {
							selected = [...selected, row];	

						} else if (!checked && selected.includes(row)) {
							selected = selected.filter((r) => r !== row);
						}
					}
				}
			});
		}
	}

	function onSelectChange() {
		updateSelected();
	}

	function onSelectAllChange(checked: boolean) {
		if (el) {
			el.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
				// @ts-ignore
				checkbox.checked = checked;
			});
			updateSelected();
		}
	}
</script>

<table bind:this={el} class="table table-compact w-full">
	<thead class="text-gray-500">
		<tr>
			{#if selectable}
			<th width="30">
				<label>
					<input type="checkbox" class="checkbox checkbox-xs" bind:checked={all} on:change={(ev) => onSelectAllChange(ev.currentTarget.checked)} />
				</label>
			</th>
			{/if}

			{#each columns as col}
			<th>{col}</th>
			{/each}
		</tr>
	</thead>

	<tbody>
		{#each rows as row, i}
		<tr>
			{#if selectable}
			<th>
				<label>
					<input type="checkbox" class="checkbox checkbox-xs" value={i} on:change={() => onSelectChange()} />
				</label>
			</th>
			{/if}

			<slot name="row" {row}>
				{#each columns as _, i}
				<td>
					{row[i]}
				</td>
				{/each}
			</slot>
		</tr>
		{/each}
	</tbody>
</table>

{#if selected.length}
<div class="bg-base-200 rounded p-2">
	<button class="btn btn-sm btn-error flex-inline gap-3">
		<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
			<path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
			<path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
		</svg>
		Delete {selected.length} selected
	</button>
</div>
{/if}