import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PublicSpinner } from '@/components/profile/public-states';
import { ResolveCodeClient } from './resolve-client';

export const metadata: Metadata = {
  title: 'Abriendo perfil',
  robots: { index: false, follow: false },
};

export default function ResolveCodePage({ params }: { params: Promise<{ code: string }> }) {
  return (
    <Suspense fallback={<PublicSpinner label="Abriendo perfil…" />}>
      <ResolveCodeClient params={params} />
    </Suspense>
  );
}
