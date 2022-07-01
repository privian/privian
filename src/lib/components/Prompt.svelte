<script lang="ts">
  import { prompt } from '$lib/stores';

  function close() {
    $prompt = null;
  }
</script>

{#if $prompt}
<div class="modal" class:modal-open={$prompt}>
  <div class="modal-box rounded p-0">
    <div class="p-4">
      <div class="flex">
        <h3 class="flex-1 text-lg">
          {$prompt.title || 'XX'}
        </h3>
        <button class="btn btn-sm btn-circle btn-ghost" on:click={() => close()}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16">
            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
          </svg>
        </button>
      </div>
      <p class="py-4">{$prompt.text}</p>
    </div>

    <div class="modal-action bg-gray-100">
      <label for="my-modal" class="btn btn-ghost rounded-none" on:click={() => close()}>Cancel</label>
      <label for="my-modal" class="btn btn-primary rounded-none">Confirm</label>
    </div>
  </div>
</div>
{/if}