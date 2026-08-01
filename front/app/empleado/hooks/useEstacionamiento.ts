import { useState, useEffect, useCallback } from 'react';
import { IEstacionamiento } from '../types';
import { estacionamientoApi } from '../services/mockApi';

export function useEstacionamiento(id: string) {
  const [data, setData] = useState<IEstacionamiento | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const result = await estacionamientoApi.getEstacionamiento(id);
        if (isMounted) {
          if (result) {
            setData(result);
            setError(null);
          } else {
            setError('Calle no encontrada.');
          }
        }
      } catch (err) {
        if (isMounted) setError('Error al cargar datos del estacionamiento.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (id) {
      fetchInitialData();
    }
    
    return () => {
      isMounted = false;
    };
  }, [id]);

  const registrarEntrada = useCallback(async () => {
    if (!data || data.lugaresDisponibles <= 0 || isUpdating) return;
    
    setIsUpdating(true);
    setData(prev => prev ? { ...prev, lugaresDisponibles: prev.lugaresDisponibles - 1 } : null);
    
    try {
      const result = await estacionamientoApi.registrarEntrada(id);
      if (result) setData(result);
    } catch (err) {
      setError('Error al registrar la entrada');
      const fallback = await estacionamientoApi.getEstacionamiento(id);
      if (fallback) setData(fallback);
    } finally {
      setIsUpdating(false);
    }
  }, [data, isUpdating, id]);

  const registrarSalida = useCallback(async () => {
    if (!data || data.lugaresDisponibles >= data.capacidadMaxima || isUpdating) return;
    
    setIsUpdating(true);
    setData(prev => prev ? { ...prev, lugaresDisponibles: prev.lugaresDisponibles + 1 } : null);

    try {
      const result = await estacionamientoApi.registrarSalida(id);
      if (result) setData(result);
    } catch (err) {
      setError('Error al registrar la salida');
      const fallback = await estacionamientoApi.getEstacionamiento(id);
      if (fallback) setData(fallback);
    } finally {
      setIsUpdating(false);
    }
  }, [data, isUpdating, id]);

  return {
    data,
    loading,
    error,
    registrarEntrada,
    registrarSalida,
    isUpdating
  };
}
