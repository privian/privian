import { z } from 'zod';
import JWT from 'jsonwebtoken';
import { handleRequest } from '$lib/helpers';
import config from '$lib/config';

const PostInput = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(40),
});

export const post = handleRequest<z.infer<typeof PostInput>>(async (_, data) => {
  // TODO: call api
  const result: any = {};
  const decoded = JWT.decode(result.jwt) as JWT.JwtPayload;
  const cookieOptions = [
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
  ];
  if (decoded.exp) {
    cookieOptions.unshift(`Expires=${new Date(decoded.exp * 1000).toString()}`);
  }
  return {
    status: 200,
    body: result,
    headers: {
      'Set-Cookie': config.jwt?.cookieName ? `${config.jwt?.cookieName}=${result.jwt}; ${cookieOptions.join('; ')}` : '',
    },
  };
}, PostInput);
