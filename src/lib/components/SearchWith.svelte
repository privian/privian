<script lang="ts">
	import { page } from '$app/stores';
	import Icon from '$lib/components/Icon.svelte';

	$: q = $page.url.searchParams.get('q');
</script>

<div>
	<div class="mb-4">
		<p>Try using other search engine:</p>
	</div>

	<div class="flex gap-6">
		<div>
			<a href={`https://www.google.com/search?q=${q}`} class="btn btn-sm btn-outline">
				<Icon icon="/favicons/google.svg" class="mr-4" />
				Search with Google
			</a>
		</div>

		<div>
			<a href={`https://www.bing.com/search?q=${q}`} class="btn btn-sm btn-outline">
				<Icon icon="/favicons/bing.svg" class="mr-4" />
				Search with Bing
			</a>
		</div>

		<div>
			<a href={`https://duckduckgo.com/?q=${q}`} class="btn btn-sm btn-outline">
				<Icon icon="/favicons/duckduckgo.svg" class="mr-4" />
				Search with DuckDuckGo
			</a>
		</div>
	</div>
</div>