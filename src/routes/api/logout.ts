import { handleRequest } from '$lib/helpers';
import config from '$lib/config';

export const post = handleRequest(async () => {
  const cookieOptions = [
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
		`Expires=${new Date(0).toString()}`,
  ];
  return {
    status: 204,
		headers: {
      'Set-Cookie': `${config.jwt.cookieName}=; ${cookieOptions.join('; ')}`,
		},
  };
});
