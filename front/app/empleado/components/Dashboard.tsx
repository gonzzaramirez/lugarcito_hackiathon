"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useEstacionamiento } from '../hooks/useEstacionamiento';
import { Contador } from './Contador';
import { Controles } from './Controles';

interface DashboardProps {
  id: string;
}

export function Dashboard({ id }: DashboardProps) {
  const { data, loading, error, registrarEntrada, registrarSalida } = useEstacionamiento(id);
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium animate-pulse">Cargando estacionamiento...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center shadow-sm">
          <p className="font-bold text-lg mb-2">Ocurrió un error</p>
          <p>{error || 'No se pudieron cargar los datos.'}</p>
        </div>
        <button 
          onClick={() => router.push('/empleado')}
          className="mt-6 px-6 py-3 bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-700 active:scale-95 transition-transform"
        >
          Volver a inicio
        </button>
      </div>
    );
  }

  const canEntrar = data.lugaresDisponibles > 0;
  const canSalir = data.lugaresDisponibles < data.capacidadMaxima;

  return (
    <div className="min-h-screen bg-slate-200 sm:p-4 md:p-8 lg:p-12 flex justify-center items-start">
      <main className="w-full max-w-md min-h-screen sm:min-h-0 sm:h-auto bg-slate-50 flex flex-col select-none touch-manipulation pb-10 sm:rounded-3xl sm:shadow-2xl overflow-hidden">
        {/* Header bar */}
        <header className="bg-slate-800 text-white py-4 px-4 flex justify-between items-center sticky top-0 z-10 sm:shadow-md">
          <button 
            onClick={() => router.push('/empleado')}
            className="flex items-center gap-1 text-slate-300 active:text-white transition-colors py-2 px-2 -ml-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            <span className="text-sm font-medium">Volver</span>
          </button>
          
          <div className="text-xs bg-slate-700 px-3 py-1 rounded-full font-medium text-slate-300">
            Empleado
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <Contador data={data} />
          <Controles 
            onEntrada={registrarEntrada} 
            onSalida={registrarSalida} 
            canEntrar={canEntrar}
            canSalir={canSalir}
          />
        </div>
      </main>
    </div>
  );
}
