"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useEstacionamientos } from '../hooks/useEstacionamientos';

export function SeleccionCalle() {
  const { data, loading, error } = useEstacionamientos();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium animate-pulse">Cargando calles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center shadow-sm">
          <p className="font-bold text-lg mb-2">Error al cargar</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-200 sm:p-4 md:p-8 lg:p-12 flex justify-center items-start">
      <main className="w-full max-w-md min-h-screen sm:min-h-0 sm:h-auto bg-slate-50 flex flex-col select-none touch-manipulation pb-10 sm:rounded-3xl sm:shadow-2xl overflow-hidden">

        {/* Header */}
        <header className="bg-slate-800 text-white py-4 px-6 flex justify-between items-center sticky top-0 z-10 shadow-md">
          <div className="font-bold text-xl tracking-tight flex items-center gap-2">
            Lugarcito
          </div>
          {/* <div className="text-xs bg-slate-700 px-3 py-1 rounded-full font-medium text-slate-300">
            Selector
          </div> */}
        </header>

        <div className="p-6">
          <h1 className="text-2xl font-black text-slate-800 mb-2">Selecciona tu calle</h1>
          <p className="text-slate-500 mb-6 text-sm">Elige qué cuadra gestionar.</p>

          <div className="flex flex-col gap-4">
            {data.map((calle) => {
              const isFull = calle.lugaresDisponibles === 0;
              return (
                <button
                  key={calle.id}
                  onClick={() => router.push(`/empleado/${calle.id}`)}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center text-left transition-all active:scale-95 active:shadow-none hover:shadow-md"
                >
                  <div>
                    <h2 className="font-bold text-lg text-slate-800">{calle.nombre}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`w-2 h-2 rounded-full ${isFull ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                      <span className="text-sm font-medium text-slate-500">
                        {isFull ? 'Llena' : `${calle.lugaresDisponibles} libres de ${calle.capacidadMaxima}`}
                      </span>
                    </div>
                  </div>
                  <div className="text-slate-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
}
