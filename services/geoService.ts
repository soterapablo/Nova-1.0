
// Coordenadas aproximadas del Observatorio de Oro Verde, Entre Ríos, Argentina
const OBSERVATORY_LAT = -31.8291;
const OBSERVATORY_LNG = -60.5244;
const ALLOWED_RADIUS_METERS = 500; // 500 metros de tolerancia

export const checkIsOnSite = (lat: number, lng: number): boolean => {
  const R = 6371e3; // Radio de la tierra en metros
  const φ1 = lat * Math.PI / 180;
  const φ2 = OBSERVATORY_LAT * Math.PI / 180;
  const Δφ = (OBSERVATORY_LAT - lat) * Math.PI / 180;
  const Δλ = (OBSERVATORY_LNG - lng) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;
  
  return distance <= ALLOWED_RADIUS_METERS;
};

/**
 * Solicita la ubicación actual UNA SOLA VEZ.
 * No realiza seguimiento continuo.
 */
export const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocalización no soportada por el navegador."));
    } else {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true, // Requerido para precisión en el sitio
        timeout: 10000,           // Espera máxima de 10 segundos
        maximumAge: 0             // Fuerza a obtener una posición nueva, no de caché
      });
    }
  });
};
