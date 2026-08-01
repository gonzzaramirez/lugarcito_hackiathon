import React from 'react';

interface ControlesProps {
  onEntrada: () => void;
  onSalida: () => void;
  canEntrar: boolean;
  canSalir: boolean;
}

export function Controles({ onEntrada, onSalida, canEntrar, canSalir }: ControlesProps) {
  return (
    <div className="w-full max-w-sm mx-auto flex flex-col gap-4 mt-8 px-4">
      <button
        onClick={onEntrada}
        disabled={!canEntrar}
        className={`
          w-full py-6 rounded-2xl text-2xl font-bold uppercase tracking-wide transition-all duration-200 active:scale-95 shadow-md
          ${canEntrar 
            ? 'bg-red-500 text-white active:bg-red-600 hover:bg-red-500' 
            : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}
        `}
      >
        Entró (Ocupa)
      </button>

      <button
        onClick={onSalida}
        disabled={!canSalir}
        className={`
          w-full py-6 rounded-2xl text-2xl font-bold uppercase tracking-wide transition-all duration-200 active:scale-95 shadow-md
          ${canSalir 
            ? 'bg-emerald-500 text-white active:bg-emerald-600 hover:bg-emerald-500' 
            : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}
        `}
      >
        Salió (Libera)
      </button>
      
      <p className="text-center text-sm text-gray-500 mt-2 font-medium">
        Usa los botones para registrar los movimientos.
      </p>
    </div>
  );
}
