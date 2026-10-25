import { NextRequest, NextResponse } from 'next/server';
import { getSavedProperties, deleteProperty, isSupabaseConnected } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filter = (searchParams.get('filter') as 'all' | 'viable' | 'broker_viable') || 'all';
    const limit = Number(searchParams.get('limit')) || 50;

    const { properties, source } = await getSavedProperties({ filter, limit });

    // Excluir de forma absoluta cualquier inmueble que indique "no está publicado" o "ya no está"
    // y asegurar que todos los inmuebles devuelvan un título descriptivo y una URL válida para ver fotos y anuncio
    const titlePattern = /(?:Piso|Ático|Chalet|Casa|Dúplex|Estudio|Apartamento|Bajo|Vivienda|Planta baja)\s+(?:pareado\s+|adosado\s+|rural\s+|unifamiliar\s+|o chalet\s+)?(?:independiente\s+)?en\s+[^,.\n<>0-9]+(?:,\s*[^,.\n<>0-9]+)?/i;
    const knownTowns = [
      'Vallirana', 'Terrassa', 'Santa Maria de Palautordera', 'Sabadell', 'Badalona', 'Hospitalet',
      'Sant Cugat', 'Sitges', 'Mataró', 'Granollers', 'Castelldefels', 'Gavà', 'Viladecans', 'Barcelona'
    ];

    const cleaned = properties
      .filter((p) => {
        const t = (p.title || '').toLowerCase();
        const s = (p.email_subject || '').toLowerCase();
        const d = (p.description || '').toLowerCase();
        return (
          !t.includes('no está publicado') &&
          !t.includes('no esta publicado') &&
          !t.includes('ya no está') &&
          !t.includes('ya no esta') &&
          !t.includes('despublicado') &&
          !s.includes('no está publicado') &&
          !s.includes('no esta publicado') &&
          !s.includes('ya no está') &&
          !s.includes('ya no esta') &&
          !d.includes('ya no está publicado') &&
          !d.includes('ya no esta publicado')
        );
      })
      .map((p) => {
        let district = p.district || 'Barcelona';
        let title = p.title;

        // Detectar municipio si p.district es genérico o se encuentra en la descripción
        if (p.description) {
          for (const town of knownTowns) {
            if (new RegExp(`\\b${town}\\b`, 'i').test(p.description)) {
              district = town;
              break;
            }
          }
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

    return NextResponse.json({
      success: true,
      count: cleaned.length,
      source,
      isSupabaseConnected: isSupabaseConnected(),
      properties: cleaned,
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
