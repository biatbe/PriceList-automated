import {auth, ansi} from '@/auth';
import {env} from 'process';

export const config = {
  // TODO: verify that _next/static does not leak anything
  matcher: ['/((?!dev|login|global.css|api/auth|_next/static|icon.png|favicon.ico).*)'],
};

const dbglog = (...args: any) => {
  if (env.DEBUG_NET)
    console.log(...args);
}

export default auth((req) => {
  dbglog(ansi.magenta('MIDDLEWARE:'), ansi.bold(req.method), ansi.underline(req.url), ansi.magenta('status:'), !!req.auth ? ansi.green('authenticated') : ansi.red('unauthenticated'));
  if (!req.auth) {
    if (req.url.includes('api')) {
      // dbglog(ansi.magenta('unauthenticated api request =>'), ansi.red('pass through'), ansi.magenta('(temporary solution)'));
      // TODO: use the 2 lines below instead of the line above once the page issueas have been fixed
      dbglog(ansi.magenta('=> respond with:') + ' 401: "{error: Invalid session.}"');
      return Response.json({error: 'Invalid session.'}, {status: 401});
    } else {
      const url = req.url.replace(req.nextUrl.pathname, '/login?redirectTo=' + req.url);
      dbglog(ansi.magenta('=> redirect to'), ansi.underline(url));
      return Response.redirect(url);
    }
  }
});