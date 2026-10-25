import { NextRequest, NextResponse } from 'next/server';
import { toggleFavoriteProperty } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, url, title, price, isFavorite } = body;

    if (!id && !url) {
      return NextResponse.json(
        { success: false, error: 'Falta el id o url de la propiedad' },
        { status: 400 }
      );
    }

    const success = await toggleFavoriteProperty({
      id: String(id || ''),
      url: url ? String(url) : undefined,
      title: title ? String(title) : undefined,
      price: typeof price === 'number' ? price : undefined,
      isFavorite: Boolean(isFavorite),
    });

    return NextResponse.json({
      success,
      isFavorite: Boolean(isFavorite),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido al actualizar favorito';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
