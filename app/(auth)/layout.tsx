import { RedirectIfAuthenticated } from '@/components/auth/auth-guards';
import { BrandLogo } from '@/components/brand/brand-mark';

// Login/registro/recuperación se pintan sin esperar la sesión: se valida que naveguen al instante.
export const instant = true;

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RedirectIfAuthenticated>
      {/* Móvil: pantalla blanca a sangre. Escritorio: tarjeta sobre fondo gris. */}
      <div className="flex min-h-screen flex-col items-center bg-white px-6 pt-16 pb-10 sm:justify-center sm:bg-background sm:px-4 sm:py-12">
        <div className="w-full max-w-md">
          <div className="mb-6 sm:mb-8 sm:flex sm:justify-center">
            <BrandLogo />
          </div>
          <div className="flex justify-center [&>[data-slot=card]]:w-full [&>[data-slot=card]]:max-w-md [&>[data-slot=card]]:shadow-none [&>[data-slot=card]]:[--card-spacing:0px] [&>[data-slot=card]]:gap-7 [&>[data-slot=card]]:overflow-visible sm:[&>[data-slot=card]]:[--card-spacing:--spacing(7)] sm:[&>[data-slot=card]]:shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
            {children}
          </div>
        </div>
      </div>
    </RedirectIfAuthenticated>
  );
}
