import {InfoTable} from './table';
import {LogInButton, LogOutButton, ButtonOfTheDay, UpdateUserButton} from './buttons';
import {auth} from '@/auth';
import {Session} from 'next-auth';

export default async function LoginPage() {
  const session: Session | null = await auth();
  console.log('DEV---------------------------------------------');

  return (
    <div className="px-[37.5%] py-10 grid text-lg">
      <span className="pb-2">
        <span className="text-orange-500 text-3xl">Dev page</span>
        <a href="/home" className="text-blue-700 hover:underline float-right">
          go Home
        </a>
      </span>
      <InfoTable />
      <LogInButton />
      <LogOutButton />
      <UpdateUserButton session={session} />
      <ButtonOfTheDay />
    </div>
  );
}