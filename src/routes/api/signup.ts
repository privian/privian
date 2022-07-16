import { z } from 'zod';
import { handleRequest } from '$lib/helpers';

const PostInput = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(40),
});

export const post = handleRequest<z.infer<typeof PostInput>>(async (_, data) => {
  // TODO: call api
  return {
    status: 204,
  };
}, {
  input: PostInput,
});
