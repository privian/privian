<script lang="ts">
  import { _ } from 'svelte-i18n';

  export let cancelLabel: string = $_('action.cancel');
  export let confirmLabel: string = $_('action.confirm');
	export let open: any = null;
	export let size: string = 'auto';
	export let title: string | null = null;
	export let subtitle: string | null = null;

  $: cls = getClasses(size);

  function getClasses(_size: string) {
    switch (size) {
      case 'fullscreen':
        return `max-w-screen max-h-screen w-screen h-screen lg:w-6/12 lg:h-auto`;
      case 'lg':
        return `w-11/12 h-screen max-w-5xl`;
      default:
        return '';
    }
  }

  function close() {
		open = null;
  }
</script>

{#if open}
<div class="modal no-prose {$$restProps.class}" class:modal-open={!!open}>
  <div class="modal-box flex flex-col rounded p-0 {cls}">
    <div class="flex-1">
      <div class="border-b flex items-start p-4">
        <div class="flex-1">
          {#if title}
          <h3 class="flex-1 text-lg">
            {title}
          </h3>
          {/if}

          {#if subtitle}
          <div class="text-sm text-neutral">{subtitle}</div>
          {/if}
        </div>

        <button class="btn btn-sm btn-circle btn-ghost" on:click={() => close()}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16">
            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
          </svg>
        </button>
      </div>

			<div>
				<slot />
			</div>
    </div>

    <div class="modal-action bg-gray-100">
			<slot name="actions">
				<button class="btn btn-ghost rounded-none" on:click={() => close()}>{cancelLabel}</button>
				<button class="btn btn-primary rounded-none">{confirmLabel}</button>
			</slot>
    </div>
  </div>
</div>
{/if}