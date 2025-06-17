'use client';

import { SessionProvider } from '@/app/SessionProvider';
import BottomNav from '@/components/BottomNav';
import { usePathname } from 'next/navigation';

export default function RootLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isStandalone = pathname?.startsWith('/chronotype-standalone');

  return (
    <SessionProvider>
      <div className={isStandalone ? '' : 'pb-16'}>
        {children}
      </div>
      {!isStandalone && <BottomNav />}
    </SessionProvider>
  );
} 