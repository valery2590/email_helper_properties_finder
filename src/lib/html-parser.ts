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
  'Vallirana', 'Santa Maria de Palautordera', 'Terrassa', 'Sabadell', 'Badalona', 'Hospitalet',
  'Sant Cugat', 'Sitges', 'Mataró', 'Granollers', 'Castelldefels', 'Gavà', 'Viladecans', 'Barcelona'
];

/**
 * Detecta distrito, barrio o municipio
 */
function detectDistrict(text: string, subject?: string): string {
  const combined = `${subject || ''} ${text}`;

  const cpMatch = combined.match(/\b(080\d{2})\b/);
  if (cpMatch && POSTAL_CODES_BARCELONA[cpMatch[1]]) {
    return POSTAL_CODES_BARCELONA[cpMatch[1]];
  }

  for (const n of BARCELONA_NEIGHBORHOODS) {
    if (new RegExp(`\\b${n}\\b`, 'i').test(combined)) {
      if (n === 'HortaVall') return 'Horta-Guinardó (Vall d\'Hebron)';
      return n;
    }
  }

  return 'Barcelona';
}

/**
 * Limpia y normaliza una URL extraída de un email, desempaquetando
 * enlaces de tracking para obtener la URL directa al inmueble (/inmueble/ID/)
 */
function cleanPropertyUrl(rawUrl?: string): string | undefined {
  if (!rawUrl) return undefined;
  try {
    const trimmed = rawUrl.trim();
    // 1. Extraer URL de parámetros típicos de tracking (u=, url=, target=, redirect=, dest=)
    const match = trimmed.match(/[?&](?:url|u|target|redirect|dest)=([^&]+)/i);
    if (match && match[1]) {
      const decoded = decodeURIComponent(match[1]);
      if (decoded.startsWith('http')) {
        return decoded;
      }
    }

    // 2. Si el link contiene una URL codificada a idealista.com/inmueble/
    const inmuebleMatch = trimmed.match(/(https?(?:%3A%2F%2F|\:\/\/)[^&"'\s]*inmueble[^&"'\s]*)/i);
    if (inmuebleMatch && inmuebleMatch[1]) {
      const decoded = decodeURIComponent(inmuebleMatch[1]);
      if (decoded.startsWith('http')) {
        return decoded;
      }
    }

    return trimmed;
  } catch {
    return rawUrl.trim();
  }
}

/**
 * Extrae el número de precio desde cualquier formato común
 */
function parsePrice(text: string): number | null {
  const match = text.match(/(?:€\s*|\bEUR\s*|precio:?\s*|por\s*)?(\d{1,3}(?:[.\s]\d{3})+|\d{5,7})\s*(?:€|EUR|&euro;|euros)?/i);
  if (!match) return null;
  const clean = match[1].replace(/[.\s]/g, '').trim();
  const val = parseInt(clean, 10);
  return val >= 40000 && val <= 10000000 ? val : null;
}

/**
 * Extrae el título real del inmueble desde el texto (ej. "Piso en Ca n'Anglada, Terrassa")
 */
function extractRealTitle(text: string, location: string, price: number): string {
  const titlePattern = /(?:Piso|Ático|Chalet|Casa|Dúplex|Estudio|Apartamento|Bajo|Vivienda|Planta baja)\s+(?:pareado\s+|adosado\s+|rural\s+|unifamiliar\s+|o chalet\s+)?(?:independiente\s+)?en\s+[^,.\n<>0-9]+(?:,\s*[^,.\n<>0-9]+)?/i;
  const m = text.match(titlePattern);
  if (m && m[0] && m[0].length >= 8 && m[0].length <= 80) {
    return `${m[0].replace(/\s+/g, ' ').trim()} (${price.toLocaleString('es-ES')} €)`;
  }
  return `Inmueble en ${location} (${price.toLocaleString('es-ES')} €)`;
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

  // 1. REGLA FUNDAMENTAL: Si el asunto o cuerpo indica que ya NO está publicado, se omite por completo
  const subjectLower = (options?.subject || '').toLowerCase();
  const htmlLower = html.toLowerCase();
  if (
    subjectLower.includes('no está publicado') ||
    subjectLower.includes('no esta publicado') ||
    subjectLower.includes('ya no está') ||
    subjectLower.includes('ya no esta') ||
    subjectLower.includes('despublicado') ||
    htmlLower.includes('este inmueble ya no está publicado') ||
    htmlLower.includes('uno de tus favoritos ya no está publicado') ||
    htmlLower.includes('ya no está disponible') ||
    htmlLower.includes('ya no esta disponible')
  ) {
    return [];
  }

  const $ = cheerio.load(html);
  const properties: PropertyData[] = [];
  const seenKeys = new Set<string>();

  // Recolectar todos los enlaces a fotos y anuncios en el correo
  const candidateLinks: string[] = [];
  $('a').each((_, aEl) => {
    const href = cleanPropertyUrl($(aEl).attr('href'));
    if (
      href &&
      !href.includes('/baja') &&
      !href.includes('/legal') &&
      !href.includes('/app') &&
      !href.includes('/news') &&
      !href.includes('unsubscribe') &&
      !href.includes('google.com')
    ) {
      // Priorizar enlaces a idealista, mailing de idealista, fotocasa o habitaclia
      if (
        href.includes('idealista') ||
        href.includes('inmueble') ||
        href.includes('fotocasa') ||
        href.includes('habitaclia') ||
        href.includes('mailing')
      ) {
        candidateLinks.push(href);
      }
    }
  });

  // Recolectar imágenes candidatas (fotos de inmuebles, excluyendo logos e iconos)
  const candidateImages: string[] = [];
  $('img').each((_, imgEl) => {
    const src = $(imgEl).attr('src');
    if (
      src &&
      !src.includes('logo') &&
      !src.includes('pixel') &&
      !src.includes('icon') &&
      !src.includes('facebook') &&
      !src.includes('twitter') &&
      !src.includes('instagram') &&
      !src.includes('banner')
    ) {
      candidateImages.push(src);
    }
  });

  // =========================================================================
  // Estrategia 1: Buscar enlaces de anuncios y sus bloques contenedores
  // =========================================================================
  const propertyLinks = $('a[href*="inmueble"], a[href*="mailing"], a[href*="idealista"], a[href*="fotocasa"], a[href*="habitaclia"]');

  propertyLinks.each((index, linkEl) => {
    const linkHref = cleanPropertyUrl($(linkEl).attr('href'));
    if (!linkHref) return;

    if (linkHref.includes('/baja') || linkHref.includes('/legal') || linkHref.includes('/app') || linkHref.includes('/news')) {
      return;
    }

    let container = $(linkEl).closest('tr, table, div, article');
    let depth = 0;
    while (container.length > 0 && !parsePrice(container.text()) && depth < 4 && !container.is('body')) {
      container = container.parent().closest('tr, table, div, article');
      depth++;
    }
    const containerText = container.length > 0 ? container.text() : $(linkEl).text();

    const price = parsePrice(containerText);
    if (!price) return;

    const dedupKey = `${price}-${linkHref.split('?')[0]}`;
    if (seenKeys.has(dedupKey)) return;
    seenKeys.add(dedupKey);

    const m2Match = containerText.match(/(\d{2,4})\s*(?:m²|m2|metros)/i);
    const m2 = m2Match ? parseInt(m2Match[1], 10) : undefined;

    const roomMatch = containerText.match(/(\d+)\s*(?:hab|dorm|habitaci)/i);
    const rooms = roomMatch ? parseInt(roomMatch[1], 10) : undefined;

    const bathMatch = containerText.match(/(\d+)\s*(?:baño|bany|wc)/i);
    const bathrooms = bathMatch ? parseInt(bathMatch[1], 10) : undefined;

    // Buscar foto en el contenedor o primera imagen candidata
    const img = container.find('img').first().attr('src') || candidateImages[properties.length] || undefined;

    const location = detectDistrict(containerText, options?.subject);
    const title = extractRealTitle(containerText, location, price);

    const safeUrl =
      (linkHref && linkHref.startsWith('http') ? linkHref : undefined) ||
      candidateLinks[properties.length] ||
      candidateLinks[0] ||
      `https://www.idealista.com/buscar/venta-viviendas/${encodeURIComponent(location.toLowerCase().replace(/[\s\']/g, '-'))}/?precio-hasta=${price}`;

    properties.push({
      id: `prop-link-${index + 1}-${Date.now().toString(36)}`,
      title,
      price,
      location,
      district: location,
      m2,
      rooms,
      bathrooms,
      url: safeUrl,
      imageUrl: img,
      description: containerText.substring(0, 250).replace(/\s+/g, ' ').trim(),
      source: 'idealista_email_parser',
    });
  });

  // =========================================================================
  // Estrategia 2: Fallback por escaneo de texto de anuncios con enlaces asociados
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

        const start = Math.max(0, match.index - 120);
        const end = Math.min(fullText.length, match.index + 150);
        const snippet = fullText.substring(start, end).replace(/\s+/g, ' ').trim();
        const location = detectDistrict(snippet, options?.subject);

        const realTitle = extractRealTitle(snippet, location, priceVal);

        // Extraer m² y habitaciones del snippet
        const m2Match = snippet.match(/(\d{2,4})\s*(?:m²|m2|metros)/i);
        const m2 = m2Match ? parseInt(m2Match[1], 10) : undefined;

        const roomMatch = snippet.match(/(\d+)\s*(?:hab|dorm|habitaci)/i);
        const rooms = roomMatch ? parseInt(roomMatch[1], 10) : undefined;

        // Asignar el enlace real del anuncio o búsqueda directa
        const assignedUrl =
          candidateLinks[fallbackIdx - 1] ||
          candidateLinks[0] ||
          `https://www.idealista.com/buscar/venta-viviendas/${encodeURIComponent(location.toLowerCase().replace(/[\s\']/g, '-'))}/?precio-hasta=${priceVal}`;

        // Asignar foto real del correo
        const assignedImg = candidateImages[fallbackIdx - 1] || candidateImages[0] || undefined;

        properties.push({
          id: `prop-text-${fallbackIdx}-${Date.now().toString(36)}`,
          title: realTitle,
          price: priceVal,
          location,
          district: location,
          m2,
          rooms,
          url: assignedUrl,
          imageUrl: assignedImg,
          description: snippet,
          source: 'idealista_text_extractor',
        });
        fallbackIdx++;
        if (properties.length >= 15) break;
      }
    }
  }

  // Filtrado final de seguridad: descartar cualquier propiedad cuyo título contenga "no está publicado"
  return properties.filter((p) => {
    const t = (p.title || '').toLowerCase();
    const d = (p.description || '').toLowerCase();
    return (
      !t.includes('no está publicado') &&
      !t.includes('no esta publicado') &&
      !t.includes('ya no está') &&
      !t.includes('ya no esta') &&
      !t.includes('despublicado') &&
      !d.includes('ya no está publicado') &&
      !d.includes('ya no esta publicado')
    );
  });
}
