// src/hooks/useNotificacionesPendientes.ts
// NUEVO: Hook para obtener notificaciones pendientes en tiempo real

import { useState, useEffect } from 'react';

export function useNotificacionesPendientes() {
  const [notificacionesPendientes, setNotificacionesPendientes] = useState(0);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date>(new Date());

  useEffect(() => {
    const cargarPendientes = async () => {
      try {
        const respuesta = await fetch('/api/notificaciones/cola');
        const datos = await respuesta.json();
        setNotificacionesPendientes(datos.pendientes || 0);
        setUltimaActualizacion(new Date());
      } catch (error) {
        console.error('Error cargando notificaciones pendientes:', error);
      }
    };

    cargarPendientes();
    
    // Actualizar cada 60 segundos
    const intervalo = setInterval(cargarPendientes, 60000);
    
    return () => clearInterval(intervalo);
  }, []);

  return {
    notificacionesPendientes,
    ultimaActualizacion,
    hayPendientes: notificacionesPendientes > 0
  };
}
