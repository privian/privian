<script lang="ts">
	import ActionButton from '$lib/components/ActionButton.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { actionId } from '$lib/stores';
	import type { ISearchResultItem } from '$lib/types';

	export let item: ISearchResultItem;
</script>

<div class="mt-3">
	{#if item.items}
	<div class="border rounded shadow overflow-x-auto">
		<table class="table table-compact w-full">
			<tbody>
				{#each item.items as row}
				<tr>
					<th>
						<div class="flex items-center gap-4">
							{#if row.image}
							<div class="avatar">
								<div class="rounded w-12 h-12">
									<img src={row.image} alt="" />
								</div>
							</div>
							{/if}

							<div>
								{row.title}
								{#if row.subtitle}
								<div class="text-sm font-normal">{row.subtitle}</div>
								{/if}
							</div>
						</div>
					</th>

					<td>
						{#if row.snippet}
						{row.snippet}
						{/if}
					</td>

					{#if row.actions}
					<td width="100">
						<div class="flex gap-1 justify-end">
							{#each row.actions as action}
							<ActionButton {action} item={row} ghost class="tooltip-left" />
							{/each}
						</div>
					</td>	
					{/if}
				</tr>
				{/each}
			</tbody>
		</table>
	</div>
	{/if}
</div>