import { NextRequest, NextResponse } from 'next/server';
import { getSavedProperties, deleteProperty, isSupabaseConnected } from '@/lib/supabase';
import { isUnwantedProperty, extractPhotoCount } from '@/lib/html-parser';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filter = (searchParams.get('filter') as 'all' | 'viable' | 'broker_viable') || 'all';
    const limit = Number(searchParams.get('limit')) || 50;

    const { properties, source } = await getSavedProperties({ filter, limit });

    // Excluir de forma absoluta cualquier inmueble que indique "no está publicado",
    // tags no deseados ("alquilada", "ocupada", "nuda") o que tenga menos de 5 fotos (< 5 fotos)
    const titlePattern = /(?:Piso|Ático|Chalet|Casa|Dúplex|Estudio|Apartamento|Bajo|Vivienda|Planta baja)\s+(?:pareado\s+|adosado\s+|rural\s+|unifamiliar\s+|o chalet\s+)?(?:independiente\s+)?en\s+[^,.\n<>0-9]+(?:,\s*[^,.\n<>0-9]+)?/i;
    const knownTowns = [
      'Vallirana', 'Terrassa', 'Santa Maria de Palautordera', 'Sabadell', 'Badalona', 'Hospitalet',
      'Sant Cugat', 'Sitges', 'Mataró', 'Granollers', 'Castelldefels', 'Gavà', 'Viladecans', 'Barcelona'
    ];

    const cleaned = properties
      .filter((p) => {
        const combined = `${p.title || ''} ${p.email_subject || ''} ${p.description || ''} ${p.url || ''}`;
        if (isUnwantedProperty(combined)) {
          return false;
        }
        const photoCount = extractPhotoCount(combined);
        if (photoCount !== null && photoCount < 5) {
          return false;
        }
        return true;
      })
      .map((p) => {
        let district = p.district && p.district !== 'Barcelona' && p.district !== 'Indefinido' ? p.district : 'Barcelona';
        let title = p.title;

        // Detectar municipio específico en el título, descripción o URL (priorizando pueblos concretos sobre Barcelona)
        const searchContext = `${p.title || ''} ${p.description || ''} ${p.url || ''}`;
        for (const town of knownTowns) {
          if (town !== 'Barcelona' && new RegExp(`\\b${town}\\b`, 'i').test(searchContext)) {
            district = town;
            break;
          }
        }

        // Extraer título real si el título actual es genérico (ej. "Uno de tus favoritos vuelve a estar publicado")
        if (p.description) {
          // Extraer título real si el título actual es genérico (ej. "Uno de tus favoritos vuelve a estar publicado")
          if (
            title.includes('favoritos') ||
            title.includes('Recomendaciones') ||
            title.includes('Cambio de precio') ||
            title.includes('nuevas fotos') ||
            title.startsWith('Inmueble en')
          ) {
            const m = p.description.match(titlePattern);
            if (m && m[0]) {
              title = `${m[0].trim()} (${p.price.toLocaleString('es-ES')} €)`;
            }
          }
        }

        // Asegurar que la URL esté siempre disponible para ver las fotos y el anuncio
        let url = p.url;
        if (!url || !url.startsWith('http')) {
          const distSlug = district.toLowerCase().replace(/[\s\']/g, '-');
          url = `https://www.idealista.com/buscar/venta-viviendas/${encodeURIComponent(distSlug)}/?precio-hasta=${p.price}`;
        }

        return {
          ...p,
          title,
          district,
          location: district,
          url,
        };
      });

    // Desduplicación por URL canónica y exclusión de DELETED
    const seen = new Set<string>();
    const deduplicated = cleaned.filter((p) => {
      if ((p.status as unknown as string) === 'DELETED') return false;
      const cleanUrl = p.url ? p.url.split('?')[0] : '';
      const key = cleanUrl || `${p.title}-${p.price}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json({
      success: true,
      count: deduplicated.length,
      source,
      isSupabaseConnected: isSupabaseConnected(),
      properties: deduplicated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido al obtener propiedades';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Se requiere el parámetro ?id=' },
        { status: 400 }
      );
    }

    await deleteProperty(id);
    return NextResponse.json({ success: true, message: `Propiedad ${id} eliminada` });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido al eliminar propiedad';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
