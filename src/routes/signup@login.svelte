<script context="module" lang="ts">
	import type { Load } from '@sveltejs/kit';

	export const load: Load = ({ session }) => {
		if (!session.multitenant || session?.user) {
			return {
				status: 302,
				redirect: '/',
			};
		}
		return {
			props: {},
		};
	}
</script>

<script lang="ts">
	import { _ } from 'svelte-i18n';
	import Form from '$lib/components/Form.svelte';
	import FormCheckbox from '$lib/components/FormCheckbox.svelte';
	import FormInput from '$lib/components/FormInput.svelte';
	import FormButton from '$lib/components/FormButton.svelte';

	let success: boolean = false;
</script>

<div class="bg-base-100 rounded-lg shadow-2xl p-5">
	{#if success}
	<div class="text-center w-72">
		<div class="text-gray-500 flex justify-center mb-6">
			<i class="ri-mail-check-line ri-2x"></i>
		</div>
		<p>{$_('text.sign_up_success')}</p>

		<div class="mt-6">
			<a href="/login" class="btn btn-success w-full">{$_('action.log_in')}</a>
		</div>
	</div>

	{:else}
	<Form action="/api/signup" class="w-72" onSuccess={() => success = true} let:errors let:loading>
		<div class="mb-6">
			<button class="btn btn-outline w-full">{$_('title.continue_with_google')}</button>
		</div>

		<div class="divider text-xs text-gray-400">{$_('label.or')}</div>

		<div class="text-center mb-2">
			{$_('title.sign_up_with_email')}
		</div>

		<FormInput
			class="mb-3"
			label={$_('label.email')}
			name="email"
			type="email"
			placeholder={$_('placeholder.email')}
			error={errors.email}
			required
		/>
		<FormInput
			class="mb-3"
			label={$_('label.password')}
			name="password"
			type="password"
			error={errors.password}
			required
		/>

		<FormCheckbox label={$_('text.accept_terms')} name="terms" required />

		<div class="mt-6">
			<FormButton class="btn-primary w-full" {loading}>{$_('action.sign_up')}</FormButton>
		</div>
	</Form>
	{/if}
</div>
