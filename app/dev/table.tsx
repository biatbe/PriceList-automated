import {auth} from '@/auth';

export async function InfoTable() {
  const session = await auth();

  return (
    <table className="text-base">
      <tbody>
        <tr>
          <td>status</td>
          <td>{session ? (<span className='text-green-600'>authenticated</span>) : (<span className='text-red-600'>unauthenticated</span>)}</td>
        </tr>
        <tr>
          <td>session.expires</td>
          <td>{session?.expires}</td>
        </tr>
        <tr>
          <td>user.id (oid)</td>
          <td>{session?.user?.id}</td>
        </tr>
        <tr>
          <td>user.name</td>
          <td>{session?.user?.name}</td>
        </tr>
        <tr>
          <td>user.email</td>
          <td>{session?.user?.email}</td>
        </tr>
        <tr>
          <td>databse entry</td>
          <td></td>
        </tr>
      </tbody>
    </table>
  );
}