<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/env';
	import { toast } from '$lib/stores';

	const NOTF_TTL = 3500;

	let notifications: any[] = [];

	onMount(() => {
		if (browser) {
			toast.subscribe((item) => {
				if (item) {
					notifications = [item, ...notifications];
					setTimeout(() => {
						removeNotification(item);
					}, NOTF_TTL);
				}
			});
		}
	});

	function removeNotification(notification: any) {
		notifications = notifications.filter((item) => item !== notification);
	}
</script>

<div class="fixed bottom-6 right-6">
	<div class="stack">
		{#each notifications as notification}
		<div
			class="card shadow-md text-primary-content"
			class:bg-error={notification.type === 'error'}
			class:bg-success={!notification.type || notification.type === 'success'}
		>
			<div class="card-body p-3">
				<div class="flex items-center gap-2">
					{#if notification.type === 'error'}
					<i class="ri-error-warning-line"></i>
					{:else}
					<i class="ri-check-line"></i>
					{/if}

					<div class="flex-1 mr-4">
						{#if notification.title}
						<div class="font-semibold">{notification.title}</div> 
						{/if}
						<div class="text-sm">{notification.text}</div>
					</div>

					<button class="btn btn-xs btn-circle btn-ghost" on:click|preventDefault={() => removeNotification(notification)}>
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16">
							<path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
						</svg>
					</button>
				</div>
			</div>
		</div> 
		{/each}
	</div>
</div>