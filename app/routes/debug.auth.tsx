import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const headers = Object.fromEntries(request.headers.entries());
  
  return json({
    url: url.toString(),
    searchParams: Object.fromEntries(url.searchParams.entries()),
    headers: {
      host: headers.host,
      'user-agent': headers['user-agent'],
      cookie: headers.cookie ? 'Present' : 'Missing',
      authorization: headers.authorization ? 'Present' : 'Missing',
    },
    cookies: request.headers.get('cookie') || 'No cookies',
  }, {
    headers: {
      'Content-Type': 'application/json',
    }
  });
};
