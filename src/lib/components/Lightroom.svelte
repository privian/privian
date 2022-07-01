<script lang="ts">
	import { lightroom } from '$lib/stores';
	import type { ILightroom } from '$lib/types';

	let elImg: HTMLImageElement;
	let position: number = 0;

	$: items = getItems($lightroom);
	$: item = items[position];
	$: prevItem = items[position - 1];
	$: nextItem = items[position + 1];
	$: onItemChange(item);

	function getProxySrc(src: string) {
		return `/api/proxy/${encodeURIComponent(src)}`;
	}

	function getItems(_ligthroom: any): ILightroom[] {
		if ($lightroom?.el) {
			const imgs: HTMLElement[] = [].slice.apply($lightroom.el.querySelectorAll('img'));
			const items = imgs.map((img) => {
				return {
					footer: img.getAttribute('data-footer') || void 0,
					index: parseInt(img.getAttribute('data-index') || '0', 10),
					link: img.getAttribute('data-link') || img.closest('a')?.getAttribute('href') || void 0,
					srcOriginal: getProxySrc(img.getAttribute('data-original') || ''),
					src: getProxySrc(img.getAttribute('data-src') || img.getAttribute('src')!),
					title: img.getAttribute('alt') || void 0,
				};
			}).sort((a, b) => a.index < b.index ? -1 : 1);
			const src = getProxySrc($lightroom.src);
			const idx = items.findIndex((item) => item.src === src);
			position = idx >= 0 ? idx : 0;
			return items;
		}
		return [{
			link: $lightroom?.link,
			srcOriginal: $lightroom?.srcOriginal && getProxySrc($lightroom?.srcOriginal),
			src: getProxySrc($lightroom?.src!),
			title: $lightroom?.title,
		}];
	}
	
	function onBackdropClick(ev: Event) {
		// @ts-ignore
		if (!ev.target.matches('a, img') && !ev.target.innerText) {
			$lightroom = null;
		}
	}

	function onImgError(ev: Event & { currentTarget: HTMLElement }) {
		const src = ev.currentTarget.getAttribute('src');
		if (src !== item.src && !ev.currentTarget.getAttribute('data-error')) {
			ev.currentTarget.setAttribute('src', item.src);
			ev.currentTarget.setAttribute('data-error', 'true');
		}
	}

	function onImgLoad(ev: Event & { currentTarget: HTMLElement }) {
		const src = ev.currentTarget.getAttribute('src');
		if (item.srcOriginal && src !== item.srcOriginal && !ev.currentTarget.getAttribute('data-error')) {
			ev.currentTarget.setAttribute('src', item.srcOriginal);
		}
	}

	function onItemChange(_item: ILightroom) {
		if (elImg) {
			elImg.removeAttribute('data-error');
		}
	}

	function onKeyDown(ev: KeyboardEvent) {
		if (ev.key === 'ArrowLeft') {
			ev.preventDefault();
			position = Math.max(0, position - 1);	

		} else if (ev.key === 'ArrowRight') {
			ev.preventDefault();
			position = Math.min(items.length - 1, position + 1);	

		} else if (ev.key === 'Escape') {
			ev.preventDefault();
			$lightroom = null;
		}
	}
</script>

<svelte:window on:keydown={onKeyDown}/>

<div class="fixed top-0 left-0 backdrop-blur-sm w-screen h-screen flex flex-col" style="background-color: rgba(0,0,0,0.85)" on:click={onBackdropClick}>
	<div class="text-right p-3">
		<button class="btn btn-circle btn-ghost text-base-100" on:click={() => $lightroom = null}>
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16">
				<path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
			</svg>
		</button>
	</div>

	<div class="flex-1 flex justify-center items-center relative z-10">
		{#if prevItem}
		<div class="absolute left-0 opacity-60" style="transform: translateX(-65%);" role="button" on:click={() =>  position = Math.max(0, position - 1)}>
			<img src={prevItem.src} alt="" class="drop-shadow" style="height:300px" />	
		</div>
		{/if}

		{#if nextItem}
		<div class="absolute right-0 opacity-60" style="transform: translateX(65%);" role="button" on:click={() => position = Math.min(items.length - 1, position + 1)}>
			<img src={nextItem.src} alt="" class="drop-shadow" style="height:300px" />	
		</div>
		{/if}

		{#if item}
		<img
			bind:this={elImg}
			src={item.src}
			on:load={(ev) => onImgLoad(ev)}
			on:error={onImgError}
			alt=""
			class="relative z-60 drop-shadow-3xl"
			style="max-width:90vw;height:65vh"
		/>
		{/if}
	</div>

	{#if item}
	<div class="text-sm text-base-100 px-6 py-3">
		<div class="flex items-center justify-between gap-3">
			<div>
				{#if item.title}
				<div>{@html item.title}</div>
				{/if}
				{#if item.footer}
				<div class="text-sm">{@html item.footer}</div>
				{/if}
			</div>

			<div class="flex items-center gap-5">
				{#if item.link}
				<div>
					<a href={item.link} class="btn btn-outline text-base-100 hover:border-base-100">Visit page</a>
				</div>
				{/if}
				{#if item.srcOriginal}
				<div>
					<a href={item.srcOriginal} class="btn btn-outline text-base-100 hover:border-base-100">View original</a>
				</div>
				{/if}
			</div>
		</div>
	</div>
	{/if}
</div>