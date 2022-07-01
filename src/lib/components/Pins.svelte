<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { prompt } from '$lib/stores';
	import { throttle } from '$lib/helpers';
	import Icon from '$lib/components/Icon.svelte';
	import Widget from '$lib/components/Widget.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { Pins } from '$lib/pins';

	export let drawer: boolean = false;

	const icons = [
		'rocket-fill',
		'sticky-note-fill',
		'lightbulb-flash-fill',
		'bug-fill',
		'phone-fill',
		'cactus-fill',
		'umbrella-fill',
		'cake-3-fill',
		'game-fill',
		'plant-fill',
		'emotion-fill',
		'star-fill',
		'music-2-fill',
		'earth-fill'
	];
	const colors = ['currentColor', '#0d6efd', '#6f42c1', '#d63384', '#fd7e14', '#ffc107', '#20c997', '#0dcaf0', '#adb5bd'];

	const data = Pins.handle;

	const _onDragOver = throttle(onDragOver, 50);

	let editing: boolean = false;
	let el: HTMLElement;
	let dragging: Element | null = null;
	let iconModalOpen: boolean = false;
	let selected: any = null;

	function onAddClick() {
		Pins.create({
			icon: icons[Math.floor(Math.random() * icons.length)],
			snippet: '',
			type: 'note',
		}).then(() => {
			selected = $data.data[$data.data.length - 1];
			editing = true;
		});
	}

	function onColorClick(color: string) {
		if (selected.options?.pin) {
			selected.options.color = color;
			save();
		}
	}

	function onDeleteClick() {

			$prompt = {
				handler: (ok: boolean) => {
					if (ok) {
						Pins.delete(selected.id);
						selected = null;
					}
				},
				text: `Delete this item?`,
			};
	}

	function onIconClick(icon: string) {
		if (selected.options?.pin) {
			selected.icon = icon;
			iconModalOpen = false;
			save();
		}
	}

	function onItemSave(item: any) {
		save();
	}

	function onPinClick(item: any) {
		editing = false;
		if (selected === item) {
			selected = null;
		} else {
			selected = item;
		}
	}

	function save() {
		if (selected) {
			Pins.update(selected.id, selected);
		}
	}

	function onDragOver(e: DragEvent) {
		if (e.currentTarget && dragging) {
			const target = e.currentTarget as Element;
			if (target.parentNode) {
				if (isBefore(dragging, target)) {
					target.before(dragging!);
				} else {
					target.after(dragging!);
				}
			}
		}
		return false;
	}

	function onDragEnd(e: DragEvent) {
		dragging = null;
		const ids = [].slice.apply(el.querySelectorAll('li[data-pin-id]')).map((li: Element) => li.getAttribute('data-pin-id')).filter((id) => !!id) as string[];
		Pins.reorder(ids);
	}

	function onDragStart(e: DragEvent) {
		e.dataTransfer!.effectAllowed = 'move';
		e.dataTransfer!.setData('text/plain', '');
		dragging = e.currentTarget as Element;
	}

	function onDrop(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		return false;	
	}

	function isBefore(el1: Element, el2: Element) {
		let cur
		if (el2?.parentNode === el1?.parentNode) {
			for (cur = el1.previousSibling; cur; cur = cur.previousSibling) {
				if (cur === el2) return true
			}
		}
		return false;
	}
</script>

<div class="flex {$$restProps.class}">
	<div class="bg-base-200">
		<div class="py-2 px-1 sticky top-0 z-40 h-full lg:h-auto overflow-y-auto">
			<ul bind:this={el} class="flex flex-col gap-1 max-h-screen">
				{#if $data.loading}
					<div>Loading...</div>

				{:else if !$data.data}
					<div>No data</div>

				{:else}
					{#each $data.data as item}
					<li
						class="indicator"
						title={item.title}
						draggable="true"
						data-pin-id={item.id}
						on:dragend={onDragEnd}
						on:dragover|preventDefault={_onDragOver}
						on:dragstart={onDragStart}
						on:drop={onDrop}
					>
						<button
							class="btn btn-circle btn-ghost radial-progress text-gray-300"
							style="--value:{(item.options?.progress || -1) * 100}; --size:3rem; --thickness: 3px;"
							class:radial-progress-none={!item.options?.progress || item.options?.progress === 1}
							class:bg-base-100={selected === item}
							disabled={!!dragging}
							on:click={() => onPinClick(item)}
						>
						 	<span class="text-base-content">
								<Icon icon={item.icon} class="ri-lg" style="color:{item.options?.color || 'currentColor'}" />
							</span>
						</button>
						{#if item.options?.progress !== null && item.options?.progress !== void 0}
							<span class="indicator-item indicator-bottom text-gray-400 mb-2 mr-2">
								{#if item.options.progress === 1}
								<i class="ri-checkbox-fill bg-base-200 text-success"></i>
								{:else}
								<i class="ri-checkbox-line bg-base-200"></i>
								{/if}
							</span>
						{/if}
					</li>
					{/each}

					<li class="text-center pb-10">
						<button class="btn btn-circle btn-ghost opacity-40 hover:opacity-100" on:click={() => onAddClick()}>
							<Icon icon="add-circle-line" class="ri-xl" />
						</button>
					</li>
				{/if}
			</ul>
		</div>
	</div>

	{#if selected || drawer}
	<div class="flex-1 bg-base-100 border-r w-80">
		<div class="xl:sticky top-0 z-20 xl:h-screen">
			<div class="flex flex-col p-4 overflow-auto h-full lg:max-h-screen">
				<div class="flex-1 h-full">
					{#if !selected}
					<div>No pins</div>

					{:else}
					<Widget
					 	class="h-full"
						editable={selected.type === 'note'}
						dropdown
						compact
						bind:item={selected}
						bind:editing={editing}
						on:save={(ev) => onItemSave(ev.detail)}
					>
						<svelte:fragment slot="dropdown" let:editable>
							<ul tabindex="0" class="menu menu-compact">
								{#if editable}
								<li>
									<button on:click|preventDefault={() => editing = true}>{$_('action.edit')}</button>
								</li>
								{/if}
								<li>
									<button on:click|preventDefault={() => iconModalOpen = true}>{$_('action.change_icon')}</button>
								</li>
								<li>
									<button on:click|preventDefault={() => onDeleteClick()}>{$_('action.delete')}</button>
								</li>
							</ul>

							<hr />

							<div class="px-3.5 py-1">
								<div class="flex gap-1">
									{#each colors as color}
									<button on:click={() => onColorClick(color)}>
										<i style="color:{color}" class:ri-checkbox-fill={selected.options?.color === color} class:ri-checkbox-blank-fill={selected.options?.color !== color}></i>
									</button>
									{/each}
								</div>
							</div>
						</svelte:fragment>
					</Widget>
					{/if}

				</div>
				<div>
					<slot name="footer"></slot>
				</div>
			</div>
		</div>
	</div>
	{/if}
</div>

<Modal title={$_('label.change_icon')} bind:open={iconModalOpen}>
	<div class="p-4">
		<div class="grid grid-cols-6 gap-3">
			{#each icons as icon}
			<div
				role="button"
				class="border rounded text-center aspect-square flex items-center justify-center hover:border-primary"
				on:click={() => onIconClick(icon)}
			>
				<Icon icon={icon} class="ri-lg" />
			</div>
			{/each}
		</div>
	</div>

	<div slot="actions">
		<label for="my-modal" class="btn btn-ghost rounded-none" on:click={() => iconModalOpen = false}>{$_('action.close')}</label>
	</div>
</Modal>
