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

  status: 'VIABLE' | 'MODERATE_RISK' | 'NOT_VIABLE';
  is_viable: boolean;
  is_broker_viable: boolean;
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
        .order('created_at', { ascending: false })
        .limit(limit);

      if (options?.filter === 'viable') {
        query = query.eq('status', 'VIABLE');
      } else if (options?.filter === 'broker_viable') {
        query = query.eq('is_broker_viable', true);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return { properties: data as SavedPropertyRecord[], source: 'supabase' };
      }
    } catch (err) {
      console.warn('Error leyendo de Supabase, usando almacén local:', err);
    }
  }

  // Fallback al almacén en memoria
  const localItems = propertyStore.getAll();
  const mapped: SavedPropertyRecord[] = localItems.map((item) => {
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
 */
export async function deleteProperty(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('properties').delete().eq('id', id);
    } catch (err) {
      console.warn('Error eliminando en Supabase:', err);
    }
  }
  return true;
}
