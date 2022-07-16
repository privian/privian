<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { navigating, session } from '$app/stores';
  import { scrolled, prompt } from '$lib/stores';
  import Omnibox from '$lib/components/Omnibox.svelte';

  function onLogoutClick() {
    $prompt = {
      title: 'Logout',
      text: 'Are you sure you want to logout?',
    }
  }
</script>

<div class="navbar flex-wrap bg-base-100 lg:px-10 gap-3 sticky top-0 z-50 transition-shadow" class:shadow={$scrolled}>
  <div class="flex-1 lg:flex-none lg:pr-4">
    <a href="/" class="normal-case text-xl">
      <img src="/symbol.svg" alt="privian" width="30" />
    </a>
  </div>

  <div class="lg:flex-1 basis-full lg:basis-auto order-last lg:order-none">
    <div class="w-full min-w-80 lg:w-1/3">
      <Omnibox />
    </div>
  </div>

  {#if $session.multitenant}
  <div class="flex-none hidden lg:block">
    <div class="dropdown dropdown-end">
      <label for="userdropdown" tabindex="0" class="btn btn-ghost btn-circle">
        {#if $session.user?.avatar}
        <div class="avatar">
          <div class="w-11 rounded-full">
            <img src={$session.user?.avatar} alt="" />
          </div>
        </div>
        {:else}
        <i class="ri-user-3-line ri-lg"></i>
        {/if}
      </label>
      <ul tabindex="0" class="bg-base-100 mt-0.5 p-0 rounded border border-slate-400 shadow-2xl menu menu-compact dropdown-content rounded-box w-52">
        <li>
          <a href="/">
            {$session.user?.name || $_('label.profile')}
          </a>
        </li>
        <li><span role="button" on:click={() => onLogoutClick()}>{$_('action.logout')}</span></li>
      </ul>
    </div>
  </div>
  {/if}

  <div class="flex-none">
    <label for="maindrawer" class="drawer-button btn btn-ghost btn-circle">
      <i class="ri-list-settings-line ri-lg"></i>
    </label>
  </div>

  <div class="progress-rainbow absolute bottom-0 left-0 right-0" class:hidden={!$navigating}>
    <div class="progress-rainbow-bar"></div>
  </div>

</div>