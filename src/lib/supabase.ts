import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { FinancialViabilityReport, FinancingScenarioResult, PropertyData } from './financial-engine';
import { propertyStore } from './property-store';

export interface SavedPropertyRecord {
  id: string;
  created_at: string;
  title: string;
  price: number;
  district?: string;
  location?: string;
  m2?: number;
  rooms?: number;
  bathrooms?: number;
  url?: string;
  image_url?: string;
  description?: string;
  source?: string;

  status: 'VIABLE' | 'MODERATE_RISK' | 'NOT_VIABLE' | 'DELETED' | 'FAVORITE';
  is_viable: boolean;
  is_broker_viable: boolean;
  is_favorite?: boolean;
  score: number;

  monthly_payment_80: number;
  dti_percent_80: number;
  total_upfront_80: number;
  shortfall_80: number;
  months_needed_80: number;
  target_date_80?: string;

  best_broker_ltv?: number;
  monthly_payment_broker?: number;
  dti_percent_broker?: number;
  total_upfront_broker?: number;
  shortfall_broker?: number;
  months_needed_broker?: number;
  target_date_broker?: string;

  email_subject?: string;
  email_from?: string;
  email_date?: string;
}

const supabaseUrl =
  process.env.SPBS_URL ||
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseKey =
  process.env.SPBS_KEY ||
  process.env.SPBS_ANON_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;
  if (!supabaseUrl || !supabaseKey) {
    return null;
  }
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
    return supabaseInstance;
  } catch (err) {
    console.warn('Error al inicializar cliente de Supabase:', err);
    return null;
  }
}

export function isSupabaseConnected(): boolean {
  return Boolean(supabaseUrl && supabaseKey);
}

/**
 * Guarda una propiedad evaluada en Supabase (o en memoria si aún no se han configurado las claves)
 */
export async function saveEvaluatedProperty(
  report: FinancialViabilityReport,
  scenarios: FinancingScenarioResult[],
  metadata?: { subject?: string; from?: string; date?: string }
): Promise<SavedPropertyRecord> {
  const scenario80 = scenarios.find((s) => s.ltvPercent === 80);
  // Buscamos el mejor escenario con broker (90%, 95% o 100%) que sea viable
  const brokerViableScenarios = scenarios.filter((s) => s.ltvPercent > 80 && s.status === 'VIABLE');
  // Ordenamos por menor tiempo necesario de ahorro
  brokerViableScenarios.sort((a, b) => a.monthsNeeded - b.monthsNeeded);
  const bestBroker = brokerViableScenarios.length > 0 ? brokerViableScenarios[0] : undefined;

  const record: SavedPropertyRecord = {
    id: `prop-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    created_at: new Date().toISOString(),
    title: report.property.title,
    price: report.propertyPrice,
    district: report.property.district || 'Barcelona',
    location: report.property.location || 'Barcelona',
    m2: report.property.m2,
    rooms: report.property.rooms,
    bathrooms: report.property.bathrooms,
    url: report.property.url,
    image_url: report.property.imageUrl,
    description: report.property.description || report.summary,
    source: metadata ? 'gmail' : (report.property.source || 'webhook'),

    status: report.status,
    is_viable: report.isViable,
    is_broker_viable: Boolean(bestBroker),
    score: report.score,

    monthly_payment_80: scenario80 ? scenario80.monthlyMortgagePayment : report.monthlyMortgagePayment,
    dti_percent_80: scenario80 ? scenario80.dtiPercent : report.dtiPercent,
    total_upfront_80: scenario80 ? scenario80.totalUpfrontRequired : report.totalUpfrontRequired,
    shortfall_80: scenario80 ? scenario80.shortfall : report.savingsTimeline.shortfall,
    months_needed_80: scenario80 ? scenario80.monthsNeeded : report.savingsTimeline.monthsNeeded,
    target_date_80: scenario80 ? scenario80.targetDateFormatted : report.savingsTimeline.targetDateFormatted,

    best_broker_ltv: bestBroker ? bestBroker.ltvPercent : undefined,
    monthly_payment_broker: bestBroker ? bestBroker.monthlyMortgagePayment : undefined,
    dti_percent_broker: bestBroker ? bestBroker.dtiPercent : undefined,
    total_upfront_broker: bestBroker ? bestBroker.totalUpfrontRequired : undefined,
    shortfall_broker: bestBroker ? bestBroker.shortfall : undefined,
    months_needed_broker: bestBroker ? bestBroker.monthsNeeded : undefined,
    target_date_broker: bestBroker ? bestBroker.targetDateFormatted : undefined,

    email_subject: metadata?.subject,
    email_from: metadata?.from,
    email_date: metadata?.date,
  };

  // Asegurar URL canónica limpia sin parámetros de tracking
  if (record.url) {
    const idMatch = record.url.match(/inmueble\/(\d+)/i);
    record.url = idMatch ? `https://www.idealista.com/inmueble/${idMatch[1]}/` : record.url.split('?')[0];
  }

  // Siempre guardamos en el store local para consistencia inmediata
  propertyStore.add({
    report,
    brokerScenarios: scenarios,
    sourceSubject: metadata?.subject,
    sourceFrom: metadata?.from,
  });

  const client = getSupabaseClient();
  if (client) {
    try {
      // Evitar duplicados si la propiedad ya fue registrada previamente
      if (record.url) {
        const { data: existing } = await client
          .from('properties')
          .select('id, status')
          .eq('url', record.url)
          .limit(1);
        if (existing && existing.length > 0) {
          // Si el usuario la había eliminado, NO resucitarla
          if (existing[0].status === 'DELETED') {
            return { ...record, id: existing[0].id, status: 'DELETED' };
          }
          await client.from('properties').update(record).eq('id', existing[0].id);
          return { ...record, id: existing[0].id };
        }
      } else if (record.title && record.price) {
        const { data: existing } = await client
          .from('properties')
          .select('id, status')
          .eq('title', record.title)
          .eq('price', record.price)
          .limit(1);
        if (existing && existing.length > 0) {
          if (existing[0].status === 'DELETED') {
            return { ...record, id: existing[0].id, status: 'DELETED' };
          }
          await client.from('properties').update(record).eq('id', existing[0].id);
          return { ...record, id: existing[0].id };
        }
      }

      const { error } = await client.from('properties').insert([record]);
      if (error) {
        console.error('Error insertando en Supabase properties:', error.message);
      }
    } catch (err) {
      console.error('Excepción al conectar con Supabase:', err);
    }
  }

  return record;
}

/**
 * Obtiene las propiedades guardadas de Supabase o del almacén en memoria
 */
export async function getSavedProperties(options?: {
  filter?: 'all' | 'viable' | 'broker_viable';
  limit?: number;
}): Promise<{ properties: SavedPropertyRecord[]; source: 'supabase' | 'memory' }> {
  const client = getSupabaseClient();
  const limit = options?.limit || 50;

  if (client) {
    try {
      let query = client
        .from('properties')
        .select('*')
        .neq('status', 'DELETED')
        .neq('status', 'FAVORITE')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (options?.filter === 'viable') {
        query = query.eq('status', 'VIABLE');
      } else if (options?.filter === 'broker_viable') {
        query = query.eq('is_broker_viable', true);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        // Consultar favoritos guardados en Supabase
        const { data: favoriteRows } = await client
          .from('properties')
          .select('id, url, title, price')
          .eq('status', 'FAVORITE');

        const favSet = new Set<string>();
        if (favoriteRows && Array.isArray(favoriteRows)) {
          for (const f of favoriteRows) {
            if (f.url) {
              const m = f.url.match(/inmueble\/(\d+)/i);
              if (m) favSet.add(m[1]);
              favSet.add(f.url.split('?')[0]);
            }
            if (f.id) favSet.add(f.id.replace('fav-', ''));
            if (f.title && f.price) favSet.add(`${f.title}-${f.price}`);
          }
        }

        const mappedFromDb = (data as SavedPropertyRecord[]).map((p) => {
          const m = p.url ? p.url.match(/inmueble\/(\d+)/i) : null;
          const cleanUrl = m ? `https://www.idealista.com/inmueble/${m[1]}/` : (p.url ? p.url.split('?')[0] : '');
          const isFav =
            (m && favSet.has(m[1])) ||
            (cleanUrl && favSet.has(cleanUrl)) ||
            favSet.has(p.id) ||
            favSet.has(`${p.title}-${p.price}`);

          return {
            ...p,
            is_favorite: Boolean(isFav),
          };
        });

        return { properties: mappedFromDb, source: 'supabase' };
      }
    } catch (err) {
      console.warn('Error leyendo de Supabase, usando almacén local:', err);
    }
  }

  // Fallback al almacén en memoria
  const localItems = propertyStore.getAll();
  const mapped: SavedPropertyRecord[] = localItems
    .filter((item) => (item.report.status as unknown as string) !== 'DELETED')
    .map((item) => {
      const sc80 = item.brokerScenarios.find((s) => s.ltvPercent === 80);
      const brokerViable = item.brokerScenarios.filter((s) => s.ltvPercent > 80 && s.status === 'VIABLE');
      brokerViable.sort((a, b) => a.monthsNeeded - b.monthsNeeded);
      const bestBroker = brokerViable[0];

      return {
        id: item.id,
        created_at: item.receivedAt,
        title: item.report.property.title,
        price: item.report.propertyPrice,
        district: item.report.property.district || 'Barcelona',
        location: item.report.property.location || 'Barcelona',
        m2: item.report.property.m2,
        rooms: item.report.property.rooms,
        bathrooms: item.report.property.bathrooms,
        url: item.report.property.url,
        image_url: item.report.property.imageUrl,
        description: item.report.property.description || item.report.summary,
        source: item.sourceSubject ? 'gmail' : (item.report.property.source || 'webhook'),

        status: item.report.status,
        is_viable: item.report.isViable,
        is_broker_viable: Boolean(bestBroker),
        score: item.report.score,

        monthly_payment_80: sc80 ? sc80.monthlyMortgagePayment : item.report.monthlyMortgagePayment,
        dti_percent_80: sc80 ? sc80.dtiPercent : item.report.dtiPercent,
        total_upfront_80: sc80 ? sc80.totalUpfrontRequired : item.report.totalUpfrontRequired,
        shortfall_80: sc80 ? sc80.shortfall : item.report.savingsTimeline.shortfall,
        months_needed_80: sc80 ? sc80.monthsNeeded : item.report.savingsTimeline.monthsNeeded,
        target_date_80: sc80 ? sc80.targetDateFormatted : item.report.savingsTimeline.targetDateFormatted,

        best_broker_ltv: bestBroker ? bestBroker.ltvPercent : undefined,
        monthly_payment_broker: bestBroker ? bestBroker.monthlyMortgagePayment : undefined,
        dti_percent_broker: bestBroker ? bestBroker.dtiPercent : undefined,
        total_upfront_broker: bestBroker ? bestBroker.totalUpfrontRequired : undefined,
        shortfall_broker: bestBroker ? bestBroker.shortfall : undefined,
        months_needed_broker: bestBroker ? bestBroker.monthsNeeded : undefined,
        target_date_broker: bestBroker ? bestBroker.targetDateFormatted : undefined,

        email_subject: item.sourceSubject,
        email_from: item.sourceFrom,
      };
    });

  return { properties: mapped, source: 'memory' };
}

/**
 * Elimina una propiedad por ID (en Supabase y memoria)
 * y marca su estado como DELETED para servir de tombstone permanente
 */
export async function deleteProperty(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  let targetUrl: string | undefined;
  let targetTitle: string | undefined;
  let targetPrice: number | undefined;

  // 1. Obtener datos de la propiedad para identificarla unívocamente
  if (client) {
    try {
      const { data } = await client
        .from('properties')
        .select('id, url, title, price')
        .eq('id', id)
        .limit(1);
      if (data && data.length > 0) {
        targetUrl = data[0].url;
        targetTitle = data[0].title;
        targetPrice = data[0].price;
      }
    } catch (err) {
      console.warn('Error buscando propiedad para borrar:', err);
    }
  }

  // Si no se encontró en Supabase, buscar en memoria
  if (!targetUrl) {
    const memItem = propertyStore.getAll().find((p) => p.id === id);
    if (memItem) {
      targetUrl = memItem.report.property.url;
      targetTitle = memItem.report.property.title;
      targetPrice = memItem.report.propertyPrice;
    }
  }

  // 2. Extraer URL canónica
  let canonicalUrl = targetUrl;
  const idMatch = canonicalUrl ? canonicalUrl.match(/inmueble\/(\d+)/i) : null;
  if (idMatch) {
    canonicalUrl = `https://www.idealista.com/inmueble/${idMatch[1]}/`;
  } else if (canonicalUrl && canonicalUrl.includes('?')) {
    canonicalUrl = canonicalUrl.split('?')[0];
  }

  // 3. Eliminar de Supabase (DELETE garantizado) e insertar tombstone DELETED
  if (client) {
    try {
      // a) Eliminar la fila principal
      await client.from('properties').delete().eq('id', id);

      // b) Eliminar cualquier duplicado que comparta la misma URL o listing ID
      if (canonicalUrl && idMatch) {
        await client
          .from('properties')
          .delete()
          .ilike('url', `%${idMatch[1]}%`);
      } else if (canonicalUrl) {
        await client
          .from('properties')
          .delete()
          .eq('url', canonicalUrl);
      }

      // c) Si tenemos título y precio, eliminar duplicados residuales
      if (targetTitle && targetPrice) {
        await client
          .from('properties')
          .delete()
          .eq('title', targetTitle)
          .eq('price', targetPrice);
      }

      // d) Insertar registro tombstone con status DELETED para que futuros emails no lo re-inserten
      if (canonicalUrl || targetTitle) {
        await client.from('properties').insert([
          {
            id: `tombstone-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            url: canonicalUrl,
            title: targetTitle || 'Inmueble descartado',
            price: targetPrice || 0,
            status: 'DELETED',
            is_viable: false,
            is_broker_viable: false,
            score: 0,
            monthly_payment_80: 0,
            dti_percent_80: 0,
            total_upfront_80: 0,
            shortfall_80: 0,
            months_needed_80: 0,
          },
        ]);
      }
    } catch (err) {
      console.warn('Error eliminando en Supabase:', err);
    }
  }

  // 4. Eliminar de la memoria local
  propertyStore.remove(id);

  return true;
}

/**
 * Alterna el estado de favorito de una propiedad en Supabase de forma persistente
 */
export async function toggleFavoriteProperty(params: {
  id: string;
  url?: string;
  title?: string;
  price?: number;
  isFavorite: boolean;
}): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) {
    return false;
  }

  const idMatch = params.url ? params.url.match(/inmueble\/(\d+)/i) : null;
  const listingId = idMatch ? idMatch[1] : params.id.replace(/[^a-zA-Z0-9_-]/g, '');
  const canonicalUrl = idMatch ? `https://www.idealista.com/inmueble/${idMatch[1]}/` : (params.url ? params.url.split('?')[0] : '');
  const favRowId = `fav-${listingId}`;

  try {
    if (params.isFavorite) {
      // 1. Limpiar cualquier registro previo de favorito para este inmueble
      await client.from('properties').delete().eq('id', favRowId);
      if (canonicalUrl) {
        await client.from('properties').delete().eq('status', 'FAVORITE').eq('url', canonicalUrl);
      }
      if (idMatch) {
        await client.from('properties').delete().eq('status', 'FAVORITE').ilike('url', `%${idMatch[1]}%`);
      }
      if (params.title && params.price) {
        await client
          .from('properties')
          .delete()
          .eq('status', 'FAVORITE')
          .eq('title', params.title)
          .eq('price', params.price);
      }

      // 2. Insertar fila marcadora de favorito
      const { error } = await client.from('properties').insert([
        {
          id: favRowId,
          url: canonicalUrl || params.url,
          title: params.title || 'Inmueble favorito',
          price: params.price || 0,
          status: 'FAVORITE',
          is_viable: true,
          is_broker_viable: false,
          score: 100,
          monthly_payment_80: 0,
          dti_percent_80: 0,
          total_upfront_80: 0,
          shortfall_80: 0,
          months_needed_80: 0,
        },
      ]);

      if (error) {
        console.warn('Error guardando favorito en Supabase:', error.message);
        return false;
      }
    } else {
      // Quitar favorito: borrar cualquier fila de favorito asociada
      await client.from('properties').delete().eq('id', favRowId);
      if (canonicalUrl) {
        await client.from('properties').delete().eq('status', 'FAVORITE').eq('url', canonicalUrl);
      }
      if (idMatch) {
        await client.from('properties').delete().eq('status', 'FAVORITE').ilike('url', `%${idMatch[1]}%`);
      }
      if (params.title && params.price) {
        await client
          .from('properties')
          .delete()
          .eq('status', 'FAVORITE')
          .eq('title', params.title)
          .eq('price', params.price);
      }
    }
    return true;
  } catch (err) {
    console.warn('Excepción al alternar favorito en Supabase:', err);
    return false;
  }
}

