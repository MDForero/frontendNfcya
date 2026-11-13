import * as React from 'react';

/**
 * Interruptor tipo iOS. Es un checkbox nativo (teclado, lectores de pantalla y formularios
 * funcionan igual) con role="switch" y apariencia propia.
 */
export function Switch({ className = '', ...props }: Omit<React.ComponentProps<'input'>, 'type'>) {
  return (
    <input
      type="checkbox"
      role="switch"
      className={`relative h-[31px] w-[51px] shrink-0 cursor-pointer appearance-none rounded-full bg-[#e3e3e8] transition-colors duration-200 before:absolute before:top-[2px] before:left-[2px] before:h-[27px] before:w-[27px] before:rounded-full before:bg-white before:shadow-[0_2px_4px_rgba(0,0,0,0.2)] before:transition-transform before:duration-200 checked:bg-switch-on checked:before:translate-x-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
