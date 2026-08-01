import { useState, useEffect, useCallback } from 'react';
import { IEstacionamiento } from '../types';
import { estacionamientoApi } from '../services/api';
import { getLiveClient } from '@/lib/ws/client';

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

  // Suscripción WebSocket: actualiza lugaresDisponibles en tiempo real
  // cuando otro empleado o el backend modifican este mismo tramo.
  useEffect(() => {
    const numericId = Number(id);
    if (isNaN(numericId)) return;

    const client = getLiveClient();

    const unsubscribe = client.subscribe((message) => {
      if (message.type !== 'estacionamiento.update') return;
      if (message.payload.estacionamientoId !== numericId) return;

      setData((prev) => {
        if (!prev) return prev;
        const clamped = Math.min(
          Math.max(message.payload.disponibles, 0),
          prev.capacidadMaxima
        );
        return { ...prev, lugaresDisponibles: clamped };
      });
    });

    client.connect();

    return () => {
      unsubscribe();
      client.disconnect();
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
