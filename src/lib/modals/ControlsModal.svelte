<script lang="ts">

	let open = false;
	let section: string | null = null;

  function close() {
  }
</script>

{#if open}
<div class="modal" class:modal-open={open}>
  <div class="modal-box flex flex-col rounded p-0 w-11/12 h-screen max-w-5xl">
    <div class="flex-1">
      <div class="flex items-center p-4">
        <h3 class="flex-1 text-lg">
					Control Panel
        </h3>
        <button class="btn btn-sm btn-circle btn-ghost" on:click={() => close()}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16">
            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
          </svg>
        </button>
      </div>

			<div>

				{#if !section}
				<div class="px-4">
					<div class="">
						<div class="flex">
							<div class="text-center">
								<a href="/" class="btn btn-lg btn-circle btn-ghost" on:click={() => section = 'users'}>
									<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-people-fill" viewBox="0 0 16 16">
										<path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
										<path fill-rule="evenodd" d="M5.216 14A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216z"/>
										<path d="M4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/>
									</svg>
								</a>

								<div>
									Users
								</div>
							</div>
						</div>
					</div>
				</div>
				{:else}

				<div>
					<div class="text-sm breadcrumbs bg-base-200 border-b px-4">
						<ul>
							<li>
								<a href="/" on:click={() => section = null}>
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-grid-3x3-gap-fill" viewBox="0 0 16 16">
										<path d="M1 2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V2zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V2zM1 7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V7zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V7zM1 12a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-2zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-2zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-2z"/>
									</svg>
								</a>
							</li> 
							<li>Users</li>
						</ul>
					</div>

					<div class="overflow-x-auto w-full">
						<table class="table w-full">
							<!-- head -->
							<thead>
								<tr>
									<th>
										<label>
											<input type="checkbox" class="checkbox checkbox-xs" />
										</label>
									</th>
									<th>Name</th>
									<th>Job</th>
									<th>Favorite Color</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<th>
										<label>
											<input type="checkbox" class="checkbox checkbox-xs" />
										</label>
									</th>
									<td>
										<div class="flex items-center space-x-3">
											<div class="avatar">
												<div class="mask mask-squircle w-12 h-12">
													<img src="/tailwind-css-component-profile-2@56w.png" alt="Avatar Tailwind CSS Component" />
												</div>
											</div>
											<div>
												<div class="font-bold">Hart Hagerty</div>
												<div class="text-sm opacity-50">United States</div>
											</div>
										</div>
									</td>
									<td>
										Zemlak, Daniel and Leannon
										<br>
										<span class="badge badge-ghost badge-sm">Desktop Support Technician</span>
									</td>
									<td>Purple</td>
									<th>
										<button class="btn btn-ghost btn-xs">details</button>
									</th>
								</tr>
							</tbody>
							
						</table>
					</div>
				</div>
				{/if}
			</div>
    </div>

    <div class="modal-action bg-gray-100">
      <label for="" class="btn btn-ghost rounded-none" on:click={() => close()}>Cancel</label>
      <label for="" class="btn btn-primary rounded-none">Confirm</label>
    </div>
  </div>
</div>
{/if}