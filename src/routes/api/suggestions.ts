import { z } from 'zod';
import { handleRequest } from '$lib/helpers';
import { Suggestions } from '$lib/suggestions';

const PostInput = z.object({
  category: z.string().optional(),
  query: z.string(),
});

export const post = handleRequest<z.infer<typeof PostInput>>(async ({ locals }, data) => {
  return {
		body: await Suggestions.suggest(data.query, locals, {
      category: data.category,
    }),
  };
}, PostInput);
