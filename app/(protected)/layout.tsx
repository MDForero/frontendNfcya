import Navbar from '@/components/layout/navbar';
import { RequireAuth } from '@/components/auth/auth-guards';

// These pages wait on the session check in the browser (RequireAuth) before
// rendering, so they can't be instant: opt them out of instant validation.
export const instant = false;

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-background">
        <Navbar />
        {/* pb extra en móvil: la barra de pestañas inferior es fija */}
        <main className="mx-auto max-w-[1200px] px-4 pt-6 pb-28 sm:px-6 sm:pt-10 md:pb-16">{children}</main>
      </div>
    </RequireAuth>
  );
}
