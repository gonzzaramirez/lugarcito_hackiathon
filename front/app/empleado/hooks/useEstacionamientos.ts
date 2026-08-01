import { useState, useEffect } from 'react';
import { IEstacionamiento } from '../types';
import { estacionamientoApi } from '../services/api';
import { getLiveClient } from '@/lib/ws/client';

export function useEstacionamientos() {
  const [data, setData] = useState<IEstacionamiento[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchList = async () => {
      try {
        setLoading(true);
        const result = await estacionamientoApi.getAllEstacionamientos();
        if (isMounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (isMounted) setError('Error al cargar la lista de calles.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchList();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Suscripción WebSocket: refresca la lista de calles en tiempo real
  // cuando cambia la disponibilidad de cualquier tramo.
  useEffect(() => {
    const client = getLiveClient();

    const unsubscribe = client.subscribe((message) => {
      if (message.type !== 'estacionamiento.update') return;

      setData((prev) =>
        prev.map((item) => {
          if (Number(item.id) !== message.payload.estacionamientoId) return item;
          const clamped = Math.min(
            Math.max(message.payload.disponibles, 0),
            item.capacidadMaxima
          );
          return { ...item, lugaresDisponibles: clamped };
        })
      );
    });

    client.connect();

    return () => {
      unsubscribe();
      client.disconnect();
    };
  }, []);

  return {
    data,
    loading,
    error,
  };
}
