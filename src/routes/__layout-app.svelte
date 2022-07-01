<script context="module" lang="ts">
	import type { Load } from '@sveltejs/kit';

	export const load: Load = ({ session }) => {
		if (session.multitenant && !session?.user) {
			return {
				status: 302,
				redirect: '/login'
			};
		}
		return {
			props: {
				user: session.user
			}
		};
	}
</script>

<script lang="ts">
	import { browser } from '$app/env';
	import { page } from '$app/stores';
	import { actionId, actionParams, lightroom, scrolled, previewModalEnabled } from '$lib/stores';
	import Pins from '$lib/components/Pins.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Header from '$lib/components/Header.svelte';
	import Drawer from '$lib/components/Drawer.svelte';
	import Toasts from '$lib/components/Toasts.svelte';
	import Lightroom from '$lib/components/Lightroom.svelte';
	import ActionModal from '$lib/modals/ActionModal.svelte';
	import InfoModal from '$lib/modals/InfoModal.svelte';
	import PromptModal from '$lib/modals/PromptModal.svelte';
	import SerpPreviewModal from '$lib/modals/SerpPreviewModal.svelte';
	import 'remixicon/fonts/remixicon.css'
	import '../prism.css';
	import '../app.scss';
	import '$lib/i18n';

	let elContent: HTMLElement;

	$: previewModal = !!$previewModalEnabled;

	page.subscribe(() => {
		if (elContent) {
			elContent.scrollTop = 0;
		}
	});

  function onScroll(ev: Event) {
		// @ts-ignore
		const _scrolled = ev.target?.scrollTop > 20;
		if ($scrolled !== _scrolled) {
			$scrolled = _scrolled;
		}
  }
</script>

<svelte:head>
	<title>Privian</title>
</svelte:head>

<div class="drawer drawer-end bg-base-200">
  <input id="maindrawer" type="checkbox" class="drawer-toggle" />

  <div bind:this={elContent} class="drawer-content" on:scroll={onScroll}>
		<div class="bg-base-100 flex">
			{#if browser}
			<Pins class="hidden xl:flex" />
			{/if}

			<div class="flex-1 w-screen lg:w-auto">
				<Header />

				<div class="min-h-screen  p-2 lg:py-6 lg:px-10">
					<slot />
				</div>

				<Footer />
			</div>

		</div>
	</div>

  <div class="drawer-side">
    <label for="maindrawer" class="drawer-overlay"></label>

		<Drawer />
  </div>
</div>

<ActionModal bind:actionId={$actionId} bind:actionParams={$actionParams} />
<InfoModal />
<PromptModal />
<Toasts />

{#if $lightroom}
<Lightroom />
{/if}

{#if previewModal}
<SerpPreviewModal />
{/if}