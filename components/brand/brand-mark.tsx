import Image from 'next/image';
import Link from 'next/link';
import symbol from '@/public/brand/nfcya-symbol.png';

/** Símbolo del logo (N con ondas NFC), sin fondo: funciona sobre claro y oscuro. */
export function BrandIcon({ size = 'md', preload = false }: { size?: 'xs' | 'sm' | 'md' | 'lg'; preload?: boolean }) {
  const height = { xs: 16, sm: 28, md: 44, lg: 56 }[size];
  return (
    <Image
      src={symbol}
      alt=""
      height={height}
      width={Math.round((height * symbol.width) / symbol.height)}
      preload={preload}
      className="shrink-0 select-none"
      draggable={false}
    />
  );
}

/** Degradado del logo con la paleta del aplicativo (claro → brand #0071e3 → brand-strong). */
const LOGO_GRADIENT_TEXT: React.CSSProperties = {
  backgroundImage: 'linear-gradient(90deg, #2b8cf6, #0071e3 55%, #0058b0)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
};

/**
 * Wordmark «NFCya»: en el logo original «NFC» es blanco sobre negro; en la interfaz clara
 * va en tinta (o en el color heredado) y «ya» conserva el degradado del logo.
 */
export function BrandWordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-extrabold tracking-[-0.03em] ${className}`}>
      NFC
      <span style={LOGO_GRADIENT_TEXT}>ya</span>
    </span>
  );
}

/** Logo completo (símbolo + wordmark), para pantallas de acceso. */
export function BrandLogo() {
  return (
    <span className="inline-flex items-center gap-3 text-ink" role="img" aria-label="NFCya">
      <BrandIcon size="md" preload />
      <BrandWordmark className="text-[32px] leading-none" />
    </span>
  );
}

export function BrandLink({ href = '/dashboard' }: { href?: string }) {
  return (
    <Link href={href} aria-label="NFCya, inicio" className="flex items-center gap-2 text-[19px] text-ink">
      <BrandIcon size="sm" preload />
      <BrandWordmark />
    </Link>
  );
}
