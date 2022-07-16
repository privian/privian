import { z } from 'zod';
import { handleRequest } from '$lib/helpers';
import { Preview } from '$lib/preview';

const PostInput = z.object({
  url: z.string().url(),
});

export const post = handleRequest<z.infer<typeof PostInput>>(async ({ locals }, data) => {
	let result: any;
	try {
		result = await Preview.preview(data.url, locals);
	} catch (err) {
		console.log(err)
	}
  return {
    status: 200,
    body: result,
  };
}, {
	input: PostInput,
});
