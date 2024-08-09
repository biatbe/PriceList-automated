'use client';

import {signIn, signOut, useSession} from 'next-auth/react';
import {Button, Tooltip} from '@nextui-org/react';
import {fetchUserInfo} from '@/auth';
import {Session} from 'next-auth';

export function LogInButton() {
  return (
    <>
      <Tooltip content="deprecated" offset={-5} closeDelay={60} placement="right-start">
        <Button onClick={() => signIn('github', {redirectTo: '/home'})} className="text-blue-700 hover:underline too">
          Log In with GitHub
        </Button>
      </Tooltip>
    </>
  );
}

export function LogOutButton() {
  return (
    <Button onClick={() => signOut()} className="text-blue-700 hover:underline">
      Log Out
    </Button>
  );
}

export function UpdateUserButton({session}: {session: Session | null}) {
  const updateUser = async () => {
    if (!session?.user) return;
    const resp = await fetch('/api/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({userId: session.user.id}),
    });
    if (resp.status != 200) {
      console.log('Bad response from POST /api/user');
    }
  };

  return (
    <Tooltip content="theoretically already done in auth session callback" offset={-5} closeDelay={60} placement="right-start">
      <Button onClick={() => updateUser()} className="text-blue-700 hover:underline">
        Update User DB Entry
      </Button>
    </Tooltip>
  );
}

export function ButtonOfTheDay() {
  const {data} = useSession();
  console.log('SESSION DATA:', data);

  const onClick = async (uid: string, access_token: string) => {
    console.log('calling fetchUserInfo...');
    await fetchUserInfo(uid, access_token).then(console.log);
  };

  return (
    <Tooltip content="not working" offset={-5} closeDelay={60} placement="right-start">
      <Button onClick={() => onClick(data?.user?.id ?? '8ace4f82-699e-4cba-b9ff-3bf0d3c527b3', data?.user?.access_token ?? '').then(console.log)} className="text-blue-700 hover:underline">
        Fetch userInfo
      </Button>
    </Tooltip>
  );
}