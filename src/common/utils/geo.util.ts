export interface PointGeo {
  latitude: number;
  longitude: number;
}

/**
 * Calcule la superficie d'une parcelle/culture en m² à partir de ses points GPS.
 * Minimum 3 points. Formule géodésique (sphère de rayon terrestre moyen).
 */
export function calculerSuperficie(points: PointGeo[]): number {
  if (points.length < 3) {
    throw new Error(
      'Une parcelle doit avoir au minimum 3 points GPS pour calculer sa superficie.',
    );
  }

  const R = 6371000; // rayon de la Terre en mètres
  let area = 0;

  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];

    const lat1 = (p1.latitude * Math.PI) / 180;
    const lat2 = (p2.latitude * Math.PI) / 180;
    const lon1 = (p1.longitude * Math.PI) / 180;
    const lon2 = (p2.longitude * Math.PI) / 180;

    area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  area = Math.abs((area * R * R) / 2);
  return Math.round(area * 100) / 100;
}

/** Centre (centroïde) d'un polygone — utilisé pour la carte mobile. */
export function centroide(points: PointGeo[]): PointGeo | null {
  if (points.length === 0) return null;
  const lat = points.reduce((sum, p) => sum + p.latitude, 0) / points.length;
  const lng = points.reduce((sum, p) => sum + p.longitude, 0) / points.length;
  return { latitude: lat, longitude: lng };
}
