'use client';
import { useUser } from '../SessionProvider';

export default function UserInfo() {
  const user = useUser();
  if (!user) return <div>Not signed in</div>;
  return (
    <div>
      <h3>Signed in as:</h3>
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </div>
  );
}