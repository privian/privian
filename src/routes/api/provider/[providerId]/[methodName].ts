import { handleRequest } from '$lib/helpers';
import { Providers } from '$lib/providers';

export const get = handleRequest(async ({ locals, params, url }, data) => {
	const provider = Providers.get(params.providerId);
  return {
		body: {
			result: await provider?.publicMethod(params.methodName, new URLSearchParams()),
		},
  };
});
