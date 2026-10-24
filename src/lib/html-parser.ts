import * as cheerio from 'cheerio';
import { PropertyData } from './financial-engine';

/**
 * Mapeo de códigos postales comunes de Barcelona y su distrito correspondiente
 */
const POSTAL_CODES_BARCELONA: Record<string, string> = {
  '08001': 'Ciutat Vella (Raval)',
  '08002': 'Ciutat Vella (Gòtic)',
  '08003': 'Ciutat Vella (Born / Barceloneta)',
  '08004': 'Sants-Montjuïc (Poble Sec)',
  '08005': 'Sant Martí (Poblenou / Vila Olímpica)',
  '08006': 'Sarrià-Sant Gervasi (Galvany)',
  '08007': 'Eixample (Dreta)',
  '08008': 'Eixample (Esquerra)',
  '08009': 'Eixample (Dreta)',
  '08010': 'Eixample (Fort Pienc)',
  '08011': 'Eixample (Antiga Esquerra)',
  '08012': 'Gràcia (Vila de Gràcia)',
  '08013': 'Eixample (Sagrada Família)',
  '08014': 'Sants-Montjuïc (Sants)',
  '08015': 'Eixample (Sant Antoni)',
  '08016': 'Nou Barris (Vilapicina)',
  '08017': 'Sarrià-Sant Gervasi (Sarrià)',
  '08018': 'Sant Martí (Poblenou)',
  '08019': 'Sant Martí (Diagonal Mar / Besòs)',
  '08020': 'Sant Martí (Sant Martí de Provençals)',
  '08021': 'Sarrià-Sant Gervasi (Sant Gervasi - Galvany)',
  '08022': 'Sarrià-Sant Gervasi (Bonanova)',
  '08023': 'Gràcia (Vallcarca / Penitents)',
  '08024': 'Gràcia (Camp d\'en Grassot)',
  '08025': 'Eixample / Horta-Guinardó (Baix Guinardó)',
  '08026': 'Sant Martí (El Clot / Camp de l\'Arpa)',
  '08027': 'Sant Andreu (La Sagrera / Congrés)',
  '08028': 'Les Corts (Maternitat)',
  '08029': 'Les Corts (Les Corts)',
  '08030': 'Sant Andreu (Sant Andreu Palomar)',
  '08031': 'Horta-Guinardó / Nou Barris (Horta / Canyelles)',
  '08032': 'Horta-Guinardó (El Carmel)',
  '08034': 'Les Corts (Pedralbes)',
  '08035': 'Horta-Guinardó (Montbau / Vall d\'Hebron)',
  '08036': 'Eixample (Nova Esquerra)',
  '08037': 'Eixample (Dreta)',
  '08038': 'Sants-Montjuïc (Font de la Guatlla)',
  '08041': 'Horta-Guinardó (Guinardó)',
  '08042': 'Nou Barris (Trinitat Nova / Roquetes)',
};

const BARCELONA_NEIGHBORHOODS = [
  'Eixample', 'Dreta de l\'Eixample', 'Esquerra de l\'Eixample', 'Sagrada Família', 'Fort Pienc', 'Sant Antoni',
  'Gràcia', 'Vila de Gràcia', 'Camp d\'en Grassot', 'Vallcarca',
  'Ciutat Vella', 'Gòtic', 'Raval', 'Born', 'Barceloneta',
  'Sant Martí', 'Poblenou', 'Diagonal Mar', 'Clot', 'Besòs',
  'Sants-Montjuïc', 'Sants', 'Poble Sec', 'Hostafrancs',
  'Les Corts', 'Pedralbes', 'Maternitat',
  'Sarrià-Sant Gervasi', 'Sarrià', 'Sant Gervasi', 'Galvany', 'Tres Torres', 'Bonanova',
  'Horta-Guinardó', 'Guinardó', 'Carmel', 'Horta', 'Vall d\'Hebron', 'HortaVall',
  'Nou Barris', 'Vilapicina', 'Canyelles',
  'Sant Andreu', 'Sagrera', 'Navas',
  'Barcelona'
];

/**
 * Detecta distrito o barrio a partir de un texto o código postal
 */
function detectDistrict(text: string, subject?: string): string {
  const combined = `${subject || ''} ${text}`;

  // 1. Buscar código postal (080XX)
  const cpMatch = combined.match(/\b(080\d{2})\b/);
  if (cpMatch && POSTAL_CODES_BARCELONA[cpMatch[1]]) {
    return POSTAL_CODES_BARCELONA[cpMatch[1]];
  }

  // 2. Buscar nombre de distrito o barrio
  for (const n of BARCELONA_NEIGHBORHOODS) {
    if (new RegExp(`\\b${n}\\b`, 'i').test(combined)) {
      if (n === 'HortaVall') return 'Horta-Guinardó (Vall d\'Hebron)';
      return n;
    }
  }

  return 'Barcelona';
}

/**
 * Limpia y normaliza una URL extraída de un email
 */
function cleanPropertyUrl(rawUrl?: string): string | undefined {
  if (!rawUrl) return undefined;
  try {
    // Si es un redirect de tracking de idealista (click.idealista.com/?...url=...)
    if (rawUrl.includes('url=')) {
      const parsed = new URL(rawUrl);
      const target = parsed.searchParams.get('url');
      if (target) return decodeURIComponent(target);
    }
    return rawUrl.trim();
  } catch {
    return rawUrl.trim();
  }
}

/**
 * Extrae el número de precio desde cualquier formato común
 * Ejemplos: "275.000 €", "275.000€", "275 000 €", "275000 €", "€ 275.000"
 */
function parsePrice(text: string): number | null {
  const match = text.match(/(?:€\s*|\bEUR\s*|precio:?\s*|por\s*)?(\d{1,3}(?:[.\s]\d{3})+|\d{5,7})\s*(?:€|EUR|&euro;|euros)?/i);
  if (!match) return null;
  const clean = match[1].replace(/[.\s]/g, '').trim();
  const val = parseInt(clean, 10);
  return val >= 40000 && val <= 10000000 ? val : null;
}

/**
 * Parsea contenido HTML (emails de Idealista, Fotocasa, Habitaclia, etc.)
 */
export function parsePropertiesFromHtml(
  html: string,
  options?: { subject?: string; from?: string }
): PropertyData[] {
  if (!html || typeof html !== 'string') {
    return [];
  }

  const $ = cheerio.load(html);
  const properties: PropertyData[] = [];
  const seenKeys = new Set<string>();

  const subjectDistrict = options?.subject ? detectDistrict('', options.subject) : undefined;

  // =========================================================================
  // Estrategia 1: Buscar enlaces directos a inmuebles (Idealista / Fotocasa / Habitaclia)
  // En emails de Idealista, cada anuncio está vinculado a idealista.com/inmueble/XXXX/
  // =========================================================================
  const propertyLinks = $('a[href*="inmueble"], a[href*="idealista.com"], a[href*="fotocasa.es"], a[href*="habitaclia.com"]');

  propertyLinks.each((index, linkEl) => {
    const linkHref = cleanPropertyUrl($(linkEl).attr('href'));
    if (!linkHref) return;

    // Ignorar enlaces corporativos o de bajas
    if (linkHref.includes('/baja') || linkHref.includes('/legal') || linkHref.includes('/app') || linkHref.includes('/news')) {
      return;
    }

    // Buscamos el contenedor más cercano del anuncio (tabla, celda, tarjeta o bloque)
    const container = $(linkEl).closest('tr, table, div, article');
    const containerText = container.length > 0 ? container.text() : $(linkEl).text();

    const price = parsePrice(containerText);
    if (!price) return;

    // Deduplicación por precio + URL aproximada
    const dedupKey = `${price}-${linkHref.split('?')[0]}`;
    if (seenKeys.has(dedupKey)) return;
    seenKeys.add(dedupKey);

    // Extraer m²
    const m2Match = containerText.match(/(\d{2,4})\s*(?:m²|m2|metros)/i);
    const m2 = m2Match ? parseInt(m2Match[1], 10) : undefined;

    // Extraer habitaciones
    const roomMatch = containerText.match(/(\d+)\s*(?:hab|dorm|habitaci)/i);
    const rooms = roomMatch ? parseInt(roomMatch[1], 10) : undefined;

    // Extraer baños
    const bathMatch = containerText.match(/(\d+)\s*(?:baño|bany|wc)/i);
    const bathrooms = bathMatch ? parseInt(bathMatch[1], 10) : undefined;

    // Imagen
    const img = container.find('img').first().attr('src') || undefined;

    // Título
    let title = $(linkEl).text().trim() ||
      container.find('h1, h2, h3, h4, strong, b').first().text().trim();
    if (!title || title.length < 5 || title.includes('€') || title.toLowerCase().includes('ver')) {
      title = options?.subject?.replace(/^¡|!$/g, '').trim() || `Inmueble en venta en Barcelona #${index + 1}`;
    }

    const location = detectDistrict(containerText, options?.subject) || subjectDistrict || 'Barcelona';

    properties.push({
      id: `prop-link-${index + 1}-${Date.now().toString(36)}`,
      title,
      price,
      location,
      district: location,
      m2,
      rooms,
      bathrooms,
      url: linkHref,
      imageUrl: img,
      description: containerText.substring(0, 250).replace(/\s+/g, ' ').trim(),
      source: 'idealista_email_parser',
    });
  });

  // =========================================================================
  // Estrategia 2: Si no hubo enlaces específicos, buscar tarjetas clásicas (.item, article)
  // =========================================================================
  if (properties.length === 0) {
    const cardSelectors = ['article', '.item', '.property-card', '.ad-card', 'table.property', 'tr.property-row'];
    for (const sel of cardSelectors) {
      $(sel).each((index, el) => {
        const text = $(el).text();
        const price = parsePrice(text);
        if (price) {
          const dedupKey = `${price}-${index}`;
          if (seenKeys.has(dedupKey)) return;
          seenKeys.add(dedupKey);

          const link = cleanPropertyUrl($(el).find('a').attr('href'));
          const img = $(el).find('img').attr('src');
          const location = detectDistrict(text, options?.subject);

          properties.push({
            id: `prop-card-${index + 1}`,
            title: $(el).find('h1, h2, h3, a').first().text().trim() || `Inmueble en ${location} (${price.toLocaleString('es-ES')} €)`,
            price,
            location,
            district: location,
            url: link,
            imageUrl: img,
            description: text.substring(0, 200).replace(/\s+/g, ' ').trim(),
            source: 'card_parser',
          });
        }
      });
      if (properties.length > 0) break;
    }
  }

  // =========================================================================
  // Estrategia 3: Fallback de escaneo de texto completo si el email no tenía tablas complejas
  // =========================================================================
  if (properties.length === 0) {
    const fullText = $('body').text() || html;
    const priceRegex = /(?:precio:?\s*|por\s*|valor:?\s*)?(\d{1,3}(?:[.\s]\d{3})+|\d{5,7})\s*(?:€|EUR|&euro;|euros)/gi;
    let match;
    let fallbackIdx = 1;

    while ((match = priceRegex.exec(fullText)) !== null) {
      const rawPrice = match[1].replace(/[.\s]/g, '').trim();
      const priceVal = parseInt(rawPrice, 10);

      if (priceVal >= 40000 && priceVal <= 5000000) {
        const dedupKey = `text-${priceVal}`;
        if (seenKeys.has(dedupKey)) continue;
        seenKeys.add(dedupKey);

        const start = Math.max(0, match.index - 80);
        const end = Math.min(fullText.length, match.index + 120);
        const snippet = fullText.substring(start, end).replace(/\s+/g, ' ').trim();
        const location = detectDistrict(snippet, options?.subject);

        const title = options?.subject
          ? `${options.subject.replace(/^¡|!$/g, '').trim()} (${priceVal.toLocaleString('es-ES')} €)`
          : `Inmueble detectado (${location}) - ${priceVal.toLocaleString('es-ES')} €`;

        properties.push({
          id: `prop-text-${fallbackIdx}`,
          title,
          price: priceVal,
          location,
          district: location,
          description: snippet,
          source: 'html_text_extractor',
        });
        fallbackIdx++;
        if (properties.length >= 10) break;
      }
    }
  }

  return properties;
}
