import { handleRequest } from '$lib/helpers';
import { Actions } from '$lib/actions';

export const get = handleRequest(async ({ locals, params, url }, data) => {
  return {
		body: await Actions.view(params.actionId, locals, Object.fromEntries(url.searchParams)),
  };
});

export const post = handleRequest<Record<string, unknown>>(async ({ locals, params, url }, data) => {
  return {
    body: await Actions.submit(params.actionId, locals, Object.fromEntries(url.searchParams), data),
  };
});
