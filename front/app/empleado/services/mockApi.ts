import { IEstacionamiento } from '../types';

// Simulamos una base de datos en memoria con múltiples calles
let mockData: IEstacionamiento[] = [
  {
    id: 'est-001',
    nombre: 'Calle San Martín',
    capacidadMaxima: 50,
    lugaresDisponibles: 45,
  },
  {
    id: 'est-002',
    nombre: 'Av. Belgrano',
    capacidadMaxima: 30,
    lugaresDisponibles: 2, // Casi lleno
  },
  {
    id: 'est-003',
    nombre: 'Calle Rivadavia',
    capacidadMaxima: 20,
    lugaresDisponibles: 0, // Lleno
  }
];

// Simulamos latencia de red
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const estacionamientoApi = {
  getAllEstacionamientos: async (): Promise<IEstacionamiento[]> => {
    await delay(500); // Simulamos carga inicial de lista
    return [...mockData];
  },

  getEstacionamiento: async (id: string): Promise<IEstacionamiento | null> => {
    await delay(300); 
    const item = mockData.find(e => e.id === id);
    return item ? { ...item } : null;
  },

  registrarEntrada: async (id: string): Promise<IEstacionamiento | null> => {
    await delay(150); 
    const itemIndex = mockData.findIndex(e => e.id === id);
    if (itemIndex === -1) return null;

    if (mockData[itemIndex].lugaresDisponibles > 0) {
      mockData[itemIndex].lugaresDisponibles -= 1;
    }
    return { ...mockData[itemIndex] };
  },

  registrarSalida: async (id: string): Promise<IEstacionamiento | null> => {
    await delay(150); 
    const itemIndex = mockData.findIndex(e => e.id === id);
    if (itemIndex === -1) return null;

    if (mockData[itemIndex].lugaresDisponibles < mockData[itemIndex].capacidadMaxima) {
      mockData[itemIndex].lugaresDisponibles += 1;
    }
    return { ...mockData[itemIndex] };
  },
};
