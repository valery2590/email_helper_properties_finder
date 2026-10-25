/**
 * Utilidades de filtrado de propiedades inmobiliarias
 * 
 * Reglas de filtrado:
 * 1. Omitir inmuebles despublicados ("no está publicado", "ya no está")
 * 2. Omitir inmuebles alquilados / arrendados / en rentabilidad
 * 3. Omitir inmuebles ocupados / con okupas / sin posesión / cesión de remate
 * 4. Omitir nuda propiedad / usufructo
 * 5. Omitir inmuebles con menos de 5 fotos (< 5 fotos)
 */

export function isUnwantedProperty(text?: string | null): boolean {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase();

  // 1. Despublicado o retirado
  if (
    lower.includes('no está publicado') ||
    lower.includes('no esta publicado') ||
    lower.includes('ya no está') ||
    lower.includes('ya no esta') ||
    lower.includes('despublicado') ||
    lower.includes('ya no está disponible') ||
    lower.includes('ya no esta disponible')
  ) {
    return true;
  }

  // 2. Alquilada / Arrendada / En rentabilidad
  if (
    lower.includes('alquilad') || // alquilada, alquilado, alquiladas
    lower.includes('con inquilino') ||
    lower.includes('en rentabilidad') ||
    lower.includes('rentabilidad inmediata') ||
    lower.includes('inmueble en rentabilidad') ||
    lower.includes('arrendad')
  ) {
    return true;
  }

  // 3. Ocupada / Okupas / Sin posesión / Cesión de remate
  if (
    lower.includes('ocupad') || // ocupada, ocupado, ocupadas
    lower.includes('okupa') ||
    lower.includes('sin posesión') ||
    lower.includes('sin posesion') ||
    lower.includes('ocupantes') ||
    lower.includes('cesión de remate') ||
    lower.includes('cesion de remate') ||
    lower.includes('adjudicación bancaria') ||
    lower.includes('ocupada ilegalmente')
  ) {
    return true;
  }

  // 4. Nuda propiedad / Usufructo
  if (
    lower.includes('nuda propiedad') ||
    lower.includes('nuda') ||
    lower.includes('usufructo') ||
    lower.includes('usufructuario')
  ) {
    return true;
  }

  // 5. Inmueble a reformar / para reformar / necesita reforma / derivados
  if (isReformProperty(text)) {
    return true;
  }

  return false;
}

/**
 * Patrones para detectar inmuebles pendientes de reforma o en estado de renovación.
 * Se evita explícitamente descartar inmuebles "reformados", "recién reformados" o "en buen estado".
 */
export const REFORM_PATTERNS: RegExp[] = [
  /\b(?:a|para|por|per|de)\s+reformar\b/i,
  /\b(?:a|para|por|per)\s+reformas?\b/i,
  /\b(?:necesita|necesitan|precisa|precisan|requiere|requieren|necesitar[íi]a)\s+(?:de\s+)?(?:una\s+)?reformas?\b/i,
  /\b(?:pendiente|posibilidad(?:es)?|opci[oó]n)\s+de\s+reforma\b/i,
  /\breforma\s+(?:integral|total|completa|profunda)\b/i,
  /\b(?:a|para|precisa)\s+rehabilitar\b/i,
  /\brehabilitaci[oó]n\s+integral\b/i,
  /\b(?:a|para)\s+renovar\b/i,
  /\b(?:en\s+ruinas?|estado\s+ruinoso|para\s+derribar|para\s+tirar|a\s+derribar)\b/i,
  /\bda\s+ristrutturare\b/i,
  /\bda\s+rinnovare\b/i,
];

/**
 * Detecta si el texto o descripción indica que el inmueble está para reformar o necesita reformas.
 */
export function isReformProperty(text?: string | null): boolean {
  if (!text || typeof text !== 'string') return false;
  return REFORM_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Extrae el número de fotos mencionado en el texto o etiquetas del anuncio.
 * Ejemplo: "Ver 4 fotos" -> 4, "Ver 28 fotos" -> 28, "4 fotos" -> 4
 */
export function extractPhotoCount(text?: string | null): number | null {
  if (!text || typeof text !== 'string') return null;
  const match = text.match(/(?:ver\s+)?(\d{1,3})\s+fotos?/i);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return null;
}
