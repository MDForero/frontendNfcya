'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from 'cn';
import { Input } from '@/components/ui/input';

/**
 * Campo de contraseña con botón de ojo para mostrar/ocultar lo escrito.
 * Un clic muestra la contraseña; otro clic la vuelve a ocultar.
 */
export function PasswordInput({ className, disabled, ...props }: Omit<React.ComponentProps<'input'>, 'type'>) {
  const [visible, setVisible] = useState(false);
  const label = visible ? 'Ocultar contraseña' : 'Mostrar contraseña';
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? 'text' : 'password'}
        disabled={disabled}
        // Evita que el corrector/autocompletado guarde la contraseña visible como texto.
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className={cn('pr-12', className)}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        // No robar el foco del campo: se puede seguir escribiendo tras pulsar el ojo.
        onMouseDown={(e) => e.preventDefault()}
        disabled={disabled}
        aria-label={label}
        aria-pressed={visible}
        aria-controls={props.id}
        title={label}
        className="absolute inset-y-0 right-1 my-auto flex h-9 w-9 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-black/[0.05] hover:text-ink focus-visible:outline-2 focus-visible:outline-brand disabled:pointer-events-none disabled:opacity-50"
      >
        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      </button>
    </div>
  );
}
