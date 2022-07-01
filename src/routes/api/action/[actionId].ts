import { handleRequest } from '$lib/helpers';
import { Actions } from '$lib/actions';

export const get = handleRequest(async ({ locals, params, url }, data) => {
  return {
		body: await Actions.get(params.actionId, Object.fromEntries(url.searchParams), locals),
  };
});

export const post = handleRequest<Record<string, unknown>>(async ({ locals, params, url }, data) => {
  return {
    body: await Actions.submit(params.actionId, Object.fromEntries(url.searchParams), data, locals),
  };
});
