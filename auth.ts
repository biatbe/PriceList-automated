import NextAuth, {DefaultSession} from 'next-auth';
import {DefaultJWT} from '@auth/core/jwt';
import type {JWT} from 'next-auth/jwt';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';
import type {AdapterUser} from 'next-auth/adapters';
import type {Account, NextAuthConfig, Profile, Session, User} from 'next-auth';

declare module 'next-auth' {
  // Extend user to reveal access_token
  interface User {
    access_token: string | null;
  }

  // Extend session to hold the access_token
  interface Session {
    access_token: (string & DefaultSession) | any;
  }

  // Extend token to hold the access_token before it gets put into session
  interface JWT {
    access_token: string & DefaultJWT;
  }
}

export const authOptions: NextAuthConfig = {
  debug: process.env.DEBUG,
  providers: [
    GitHub,
    Google,
    MicrosoftEntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      tenantId: process.env.AZURE_AD_TENANT_ID,
      authorization: {
        params: {
          scope: 'openid profile email User.Read User.ReadBasic.All',
        },
      },
    }),
  ],
  callbacks: {
    jwt({token, user, account, profile}: {token: JWT; user: AdapterUser | User; account: Account | null; profile: Profile | undefined}) {
      if (account?.provider == 'microsoft-entra-id') {
        token.id = profile?.oid ?? null; // only oid seems to be persistent in Azure
      }
      if (account?.provider == 'github') {
        token.id = user.id ?? null;
      }
      return token;
    },
    session({session, user, token}: {session: Session; user: User; token: JWT}) {
      session.access_token = token;
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.access_token = token.jti ?? null;
        // prisma cannot run in here (nor in middleware or edge runtime)
      } else {
        console.error('auth session cb: session.user or token.id was nullish!');
      }
      return session;
    },
  },
  session: {strategy: 'jwt'},
} as NextAuthConfig;

export interface UserNonNull extends User {
  id: string;
  name: string;
  email: string;
}

export const authNonNull = async () => {
  const session = await auth();
  if (!session?.user) throw new Error('auth_wrap: null session');
  else return session.user as UserNonNull;
};

export const {handlers, signIn, signOut, auth, unstable_update} = NextAuth(authOptions);

export const fetchUserInfo = async (uid: string, access_token: string) => {
  console.log('fetching user info for', uid, 'with token', access_token);
  var name: string = 'N/A';
  try {
    await fetch('https://graph.microsoft.com/oidc/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })
      .then((res) => res.json())
      .then(console.log);
  } catch (e) {
    console.log('ERROR:', e);
    if (e instanceof Error) name = e.message;
    else if (typeof e === 'string') name = e;
  }
  return {id: '007', name: name, email: 'johndoe@email.com'} as User;
};

// ANSI escape codes for colors, for debug printing
export const ansi = {
  normal: (s: string) => {
    return '\x1b[0m' + s;
  },
  bold: (s: string) => {
    return '\x1b[1m' + s + '\x1b[22m';
  },
  black: (s: string) => {
    return '\x1b[30m' + s + '\x1b[39m';
  },
  red: (s: string) => {
    return '\x1b[31m' + s + '\x1b[39m';
  },
  green: (s: string) => {
    return '\x1b[32m' + s + '\x1b[39m';
  },
  yellow: (s: string) => {
    return '\x1b[33m' + s + '\x1b[39m';
  },
  blue: (s: string) => {
    return '\x1b[34m' + s + '\x1b[39m';
  },
  magenta: (s: string) => {
    return '\x1b[35m' + s + '\x1b[39m';
  },
  cyan: (s: string) => {
    return '\x1b[36m' + s + '\x1b[39m';
  },
  white: (s: string) => {
    return '\x1b[37m' + s + '\x1b[39m';
  },
  gray: (s: string) => {
    return '\x1b[90m' + s + '\x1b[39m';
  },
  underline: (s: string) => {
    return '\x1b[4m' + s + '\x1b[24m';
  },
  paren: (s: string) => {
    return '(' + s + ')';
  },
  brack: (s: string) => {
    return '[' + s + ']';
  },
  brace: (s: string) => {
    return '{' + s + '}';
  }
};