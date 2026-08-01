import { useState, useEffect } from 'react';
import { IEstacionamiento } from '../types';
import { estacionamientoApi } from '../services/api';

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

  return {
    data,
    loading,
    error,
  };
}
