<script lang="ts">
  import { navigating, session } from '$app/stores';
  import { scrolled } from '$lib/stores';
  import Omnibox from '$lib/components/Omnibox.svelte';
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
      <label for="userdropdown" tabindex="0" class="btn btn-ghost btn-circle avatar">
        <div class="w-10 rounded-full">
          <img src="https://cdn.lorem.space/images/face/.cache/500x0/luis-villasmil-hh3ViD0r0Rc-unsplash.jpg" alt="" />
        </div>
      </label>
      <ul tabindex="0" class="bg-base-100 mt-3 p-0 rounded border border-slate-400 shadow-2xl menu menu-compact dropdown-content rounded-box w-52">
        <li>
          <a href="/" class="justify-between">
            Profile
            <span class="badge">New</span>
          </a>
        </li>
        <li><a href="/">Settings</a></li>
        <li><a href="/">Logout</a></li>
      </ul>
    </div>
  </div>
  {/if}

  <div class="flex-none">
    <label for="maindrawer" class="drawer-button btn btn-ghost">
      <i class="ri-list-settings-line ri-lg"></i>
    </label>
  </div>

  <div class="progress-rainbow absolute bottom-0 left-0 right-0" class:hidden={!$navigating}>
    <div class="progress-rainbow-bar"></div>
  </div>

</div>