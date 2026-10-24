import { NextRequest, NextResponse } from 'next/server';
import { getSavedProperties, deleteProperty, isSupabaseConnected } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filter = (searchParams.get('filter') as 'all' | 'viable' | 'broker_viable') || 'all';
    const limit = Number(searchParams.get('limit')) || 50;

    const { properties, source } = await getSavedProperties({ filter, limit });

    return NextResponse.json({
      success: true,
      count: properties.length,
      source,
      isSupabaseConnected: isSupabaseConnected(),
      properties,
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
