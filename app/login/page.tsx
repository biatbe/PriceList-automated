'use client';
// TODO: make this a server component

import {signIn, useSession} from 'next-auth/react';
import {Suspense, useEffect} from 'react';
import {useSearchParams, useRouter} from 'next/navigation';

function Signin() {
  const redirUrl = useSearchParams().get('redirectTo') ?? '/main-list';
  const router = useRouter();
  const {status, data} = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      void signIn();
    } else if (status === 'authenticated') {
      fetch('http://localhost:3000/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({userId: data.user?.id}),
      });
      console.log('\x1b[1;32m/login: authenticated\x1b[22;39m = redirecting to ', redirUrl);
      void router.push(redirUrl);
    }
  }, [status, redirUrl, router]);

  return <div>You are being redirected...</div>;
}

export default function LoginPage() {
  return (
    <Suspense>
      <Signin />
    </Suspense>
  );
}