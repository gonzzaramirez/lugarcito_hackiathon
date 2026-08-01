import React from 'react';
import { IEstacionamiento } from '../types';

interface ContadorProps {
  data: IEstacionamiento;
}

export function Contador({ data }: ContadorProps) {
  const { nombre, lugaresDisponibles, capacidadMaxima } = data;
  
  // Calculate a subtle warning state if almost full
  const isFull = lugaresDisponibles === 0;
  const isAlmostFull = !isFull && lugaresDisponibles <= Math.ceil(capacidadMaxima * 0.1);

  return (
    <div className="w-full flex flex-col items-center justify-center pt-10 pb-6 px-4 bg-white shadow-sm rounded-b-3xl">
      <h1 className="text-gray-500 text-sm md:text-base font-semibold uppercase tracking-wider mb-2">
        {nombre}
      </h1>
      
      <div className="relative">
        <span className={`
          text-8xl md:text-9xl font-black tabular-nums transition-colors duration-300
          ${isFull ? 'text-red-600' : isAlmostFull ? 'text-orange-500' : 'text-slate-800'}
        `}>
          {lugaresDisponibles}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span className="text-slate-600 font-medium text-lg">
          Lugares Disponibles
        </span>
        <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-1 rounded-full">
          Max: {capacidadMaxima}
        </span>
      </div>
      
      {isFull && (
        <p className="mt-3 text-red-600 font-bold bg-red-50 px-4 py-2 rounded-lg animate-pulse">
          ¡CALLE LLENA!
        </p>
      )}
    </div>
  );
}
