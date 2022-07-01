import { z } from 'zod';
import { handleRequest } from '$lib/helpers';
import { Preview } from '$lib/preview';
import { Search } from '$lib/search';
import type { ISearchResult } from '$lib/types';

const PostInput = z.object({
  category: z.string().optional(),
  filter: z.object({}).catchall(z.string()).optional(),
  locale: z.string().optional(),
  query: z.string(),
});

export const post = handleRequest<z.infer<typeof PostInput>>(async ({ locals }, data, isHXR) => {
  const result: ISearchResult = await Search.search(data.query, locals, {
    category: data.category,
    filter: data.filter,
    locale: data.locale,
  });
  if (!isHXR) {
    const preview = result?.items?.find(({ preview }, i) => i < 6 && !!preview);
    if (preview) {
      result.preview = await Preview.preview(preview.link!);
    }
  }
  return {
		body: result,
  };
}, PostInput);
