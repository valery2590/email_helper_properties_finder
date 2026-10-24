import * as cheerio from 'cheerio';
import { PropertyData } from './financial-engine';

/**
 * Parsea contenido HTML (por ejemplo de emails de alertas inmobiliarias o portales)
 * utilizando Cheerio para extraer información de propiedades en Barcelona.
 */
export function parsePropertiesFromHtml(html: string): PropertyData[] {
  if (!html || typeof html !== 'string') {
    return [];
  }

  const $ = cheerio.load(html);
  const properties: PropertyData[] = [];

  // Lista de distritos y barrios conocidos de Barcelona para matching contextual
  const barcelonaNeighborhoods = [
    'Eixample', 'Dreta de l\'Eixample', 'Esquerra de l\'Eixample', 'Sagrada Família', 'Fort Pienc', 'Sant Antoni',
    'Gràcia', 'Vila de Gràcia', 'Camp d\'en Grassot', 'Vallcarca',
    'Ciutat Vella', 'Gòtic', 'Raval', 'Born', 'Barceloneta',
    'Sant Martí', 'Poblenou', 'Diagonal Mar', 'Clot', 'Besòs',
    'Sants-Montjuïc', 'Sants', 'Poble Sec', 'Hostafrancs',
    'Les Corts', 'Pedralbes', 'Maternitat',
    'Sarrià-Sant Gervasi', 'Sarrià', 'Sant Gervasi', 'Galvany', 'Tres Torres',
    'Horta-Guinardó', 'Guinardó', 'Carmel', 'Horta',
    'Nou Barris', 'Vilapicina', 'Canyelles',
    'Sant Andreu', 'Sagrera', 'Navas',
    'Barcelona'
  ];

  // Estrategia 1: Buscar bloques / artículos / tarjetas inmobiliarias comunes
  const cardSelectors = [
    'article',
    '.item',
    '.property-card',
    '.ad-card',
    '.item-multimedia-container',
    '.listing-item',
    'table.property',
    'tr.property-row',
    '.mail-card'
  ];

  let foundInCards = false;

  for (const selector of cardSelectors) {
    const cards = $(selector);
    if (cards.length > 0) {
      cards.each((index, el) => {
        const text = $(el).text();
        const priceMatch = text.match(/(?:€\s*|\bEUR\s*|precio:?\s*)?(\d{1,3}(?:\.\d{3})+|\d{4,7})\s*(?:€|EUR|euros)?/i);
        
        if (priceMatch) {
          const rawPriceStr = priceMatch[1].replace(/\./g, '').trim();
          const parsedPrice = parseInt(rawPriceStr, 10);

          // Filtro de cordura para precios de venta (ej. > 40.000 € y < 10.000.000 €)
          if (parsedPrice >= 40000 && parsedPrice <= 10000000) {
            const title = $(el).find('h1, h2, h3, h4, .title, a').first().text().trim() ||
              `Piso en venta en Barcelona #${index + 1}`;
            
            const link = $(el).find('a').attr('href') || undefined;
            const img = $(el).find('img').attr('src') || undefined;

            // Extraer m²
            const m2Match = text.match(/(\d{2,4})\s*(?:m²|m2|metros)/i);
            const m2 = m2Match ? parseInt(m2Match[1], 10) : undefined;

            // Extraer habitaciones
            const roomMatch = text.match(/(\d+)\s*(?:hab|habitaci|dormitorio|habs)/i);
            const rooms = roomMatch ? parseInt(roomMatch[1], 10) : undefined;

            // Extraer baños
            const bathMatch = text.match(/(\d+)\s*(?:baño|bany|wc)/i);
            const bathrooms = bathMatch ? parseInt(bathMatch[1], 10) : undefined;

            // Detectar distrito
            let detectedDistrict = 'Barcelona';
            for (const n of barcelonaNeighborhoods) {
              if (new RegExp(`\\b${n}\\b`, 'i').test(text)) {
                detectedDistrict = n;
                break;
              }
            }

            properties.push({
              id: `html-card-${index + 1}`,
              title,
              price: parsedPrice,
              location: detectedDistrict,
              district: detectedDistrict,
              m2,
              rooms,
              bathrooms,
              url: link,
              imageUrl: img,
              description: text.substring(0, 200).replace(/\s+/g, ' ').trim(),
              source: 'html_parser',
            });
            foundInCards = true;
          }
        }
      });
      if (foundInCards) break;
    }
  }

  // Estrategia 2: Si no hubo tarjetas estructuradas, parsear texto plano de la página o enlaces con precio
  if (properties.length === 0) {
    const fullText = $('body').text() || html;
    
    // Buscar patrones de precios en el texto completo
    const priceRegex = /(?:precio:?\s*|por\s*|valor:?\s*)?(\d{1,3}(?:\.\d{3})+)\s*(?:€|EUR)/gi;
    let match;
    let fallbackIndex = 1;

    while ((match = priceRegex.exec(fullText)) !== null) {
      const priceVal = parseInt(match[1].replace(/\./g, ''), 10);
      if (priceVal >= 50000 && priceVal <= 5000000) {
        // Encontrar contexto cercano (150 caracteres alrededor)
        const start = Math.max(0, match.index - 80);
        const end = Math.min(fullText.length, match.index + 120);
        const snippet = fullText.substring(start, end).replace(/\s+/g, ' ').trim();

        // Detectar si nombra algún distrito de Barcelona
        let district = 'Barcelona';
        for (const n of barcelonaNeighborhoods) {
          if (new RegExp(`\\b${n}\\b`, 'i').test(snippet)) {
            district = n;
            break;
          }
        }

        properties.push({
          id: `html-text-${fallbackIndex}`,
          title: `Inmueble detectado (${district}) - ${priceVal.toLocaleString('es-ES')} €`,
          price: priceVal,
          location: district,
          district,
          description: snippet,
          source: 'html_text_extractor',
        });

        fallbackIndex++;
        if (properties.length >= 20) break; // Límite razonable
      }
    }
  }

  return properties;
}
