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
	import FormInput from '$lib/components/FormInput.svelte';
	import FormButton from '$lib/components/FormButton.svelte';
</script>

<div class="bg-base-100 rounded-lg shadow-2xl p-5">
	<Form action="/api/login" class="w-72" onSuccess={() => location.href = '/'} let:errors let:loading>
		<div class="mb-6">
			<button class="btn btn-outline w-full">{$_('action.continue_with', { values: { provider: 'Google' }})}</button>
		</div>

		<div class="divider text-xs text-gray-400">{$_('label.or')}</div>

		<div class="text-center mb-2">
			{$_('label.log_in_with_email')}
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
			label={$_('label.password')}
			name="password"
			type="password"
			error={errors.password}
			required
		/>

		<div class="mt-6">
			<FormButton class="btn-primary w-full" {loading}>{$_('action.log_in')}</FormButton>
		</div>
	</Form>
</div>

<div class="text-center text-sm mt-6">
	<div class="mt-3">
		<a href="/" class="btn btn-link">{$_('action.reset_password')}</a>
	</div>
</div>