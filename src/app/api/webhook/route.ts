import { NextRequest, NextResponse } from 'next/server';
import {
  DEFAULT_BUYER_PROFILE,
  DEFAULT_MORTGAGE_CONFIG,
  evaluatePropertyViability,
  calculateMaxAffordablePropertyPrice,
  calculateFinancingScenarios,
  PropertyData,
  FinancialViabilityReport,
  BuyerProfile,
  MortgageConfig,
} from '@/lib/financial-engine';
import { parsePropertiesFromHtml } from '@/lib/html-parser';
import { propertyStore } from '@/lib/property-store';
import { saveEvaluatedProperty } from '@/lib/supabase';

interface WebhookRequestBody {
  property?: PropertyData;
  properties?: PropertyData[];
  items?: PropertyData[];
  html?: string;
  rawBody?: string;
  lang?: 'es' | 'it';
  buyerProfile?: Partial<BuyerProfile>;
  mortgageConfig?: Partial<MortgageConfig>;
  filterOnlyViable?: boolean;
}

/**
 * Normaliza y extrae la lista de propiedades a partir del cuerpo de la petición
 */
function extractPropertiesFromPayload(
  body: unknown,
  contentType: string
): { properties: PropertyData[]; buyerOverrides?: Partial<BuyerProfile>; mortgageOverrides?: Partial<MortgageConfig>; filterOnlyViable?: boolean } {
  // Caso 1: Texto HTML plano
  if (typeof body === 'string' && (contentType.includes('text/html') || body.trim().startsWith('<'))) {
    return {
      properties: parsePropertiesFromHtml(body),
    };
  }

  // Caso 2: Array directo de propiedades en JSON
  if (Array.isArray(body)) {
    return {
      properties: body.filter((item): item is PropertyData => typeof item === 'object' && item !== null && 'price' in item),
    };
  }

  // Caso 3: Objeto JSON estructurado
  if (typeof body === 'object' && body !== null) {
    const payload = body as WebhookRequestBody;

    // Si viene contenido HTML en el campo `html` o `rawBody`
    if (payload.html || payload.rawBody) {
      const htmlContent = payload.html || payload.rawBody || '';
      const metadata = (payload as unknown as Record<string, unknown>).metadata as { subject?: string; from?: string } | undefined;
      const parsedFromHtml = parsePropertiesFromHtml(htmlContent, {
        subject: metadata?.subject,
        from: metadata?.from,
      });
      if (parsedFromHtml.length > 0) {
        return {
          properties: parsedFromHtml,
          buyerOverrides: payload.buyerProfile,
          mortgageOverrides: payload.mortgageConfig,
          filterOnlyViable: payload.filterOnlyViable,
        };
      }
    }

    // Si viene un array en `properties` o `items`
    if (Array.isArray(payload.properties)) {
      return {
        properties: payload.properties,
        buyerOverrides: payload.buyerProfile,
        mortgageOverrides: payload.mortgageConfig,
        filterOnlyViable: payload.filterOnlyViable,
      };
    }

    if (Array.isArray(payload.items)) {
      return {
        properties: payload.items,
        buyerOverrides: payload.buyerProfile,
        mortgageOverrides: payload.mortgageConfig,
        filterOnlyViable: payload.filterOnlyViable,
      };
    }

    // Si viene una propiedad individual en la raíz o en `property`
    if (payload.property && typeof payload.property === 'object') {
      return {
        properties: [payload.property],
        buyerOverrides: payload.buyerProfile,
        mortgageOverrides: payload.mortgageConfig,
        filterOnlyViable: payload.filterOnlyViable,
      };
    }

    if ('price' in payload && (typeof payload.price === 'number' || typeof payload.price === 'string')) {
      const single: PropertyData = {
        title: (payload as unknown as Record<string, unknown>).title as string || 'Inmueble recibido por webhook',
        price: Number(payload.price),
        location: (payload as unknown as Record<string, unknown>).location as string || 'Barcelona',
        district: (payload as unknown as Record<string, unknown>).district as string,
        m2: (payload as unknown as Record<string, unknown>).m2 ? Number((payload as unknown as Record<string, unknown>).m2) : undefined,
        rooms: (payload as unknown as Record<string, unknown>).rooms ? Number((payload as unknown as Record<string, unknown>).rooms) : undefined,
        bathrooms: (payload as unknown as Record<string, unknown>).bathrooms ? Number((payload as unknown as Record<string, unknown>).bathrooms) : undefined,
        url: (payload as unknown as Record<string, unknown>).url as string,
        description: (payload as unknown as Record<string, unknown>).description as string,
        imageUrl: (payload as unknown as Record<string, unknown>).imageUrl as string,
        source: 'webhook_direct',
      };
      return {
        properties: [single],
        buyerOverrides: payload.buyerProfile,
        mortgageOverrides: payload.mortgageConfig,
        filterOnlyViable: payload.filterOnlyViable,
      };
    }
  }

  return { properties: [] };
}

/**
 * Genera un texto amigable para alertas (email, telegram, webhook outgoing)
 */
function generateFormattedNotificationSummary(
  reports: FinancialViabilityReport[],
  buyerProfile: BuyerProfile,
  lang: 'es' | 'it' = 'es'
): string {
  const viable = reports.filter((r) => r.isViable);
  const topViable = viable.slice(0, 3);
  const numLocale = lang === 'it' ? 'it-IT' : 'es-ES';

  if (lang === 'it') {
    let message = `🏢 Consulente Immobiliare Barcellona\n`;
    message += `👤 Profilo: ${buyerProfile.netMonthlySalary.toLocaleString(numLocale)} €/mese netti | Risparmio: ${buyerProfile.monthlySavingsCapacity.toLocaleString(numLocale)} €/mese (Giorno 1)\n`;
    message += `💰 Risparmio accumulato attuale disponibile: ${buyerProfile.currentSavings.toLocaleString(numLocale)} € (Portafoglio completo)\n`;
    message += `📊 Totale analizzati: ${reports.length} | Fattibili: ${viable.length}\n\n`;

    if (topViable.length > 0) {
      message += `⭐ TOP OPPORTUNITÀ FATTIBILI:\n`;
      topViable.forEach((item, idx) => {
        message += `\n${idx + 1}. ${item.property.title}\n`;
        message += `   • Prezzo: ${item.propertyPrice.toLocaleString(numLocale)} €\n`;
        message += `   • Acconto (${item.downPaymentPercent}%) + Spese Catalogna (11.5%): ${item.totalUpfrontRequired.toLocaleString(numLocale)} €\n`;
        message += `   • Rata francese (${item.mortgageConfig.loanTermYears}a @ ${item.annualInterestRatePercent}%): ${item.monthlyMortgagePayment.toLocaleString(numLocale)} €/mese (Sforzo: ${item.dtiPercent}%)\n`;
        message += `   • Tempo risparmio (Giorno 1): ${item.savingsTimeline.targetDateFormatted} (${item.savingsTimeline.monthsNeeded} mesi)\n`;
        if (item.property.url) message += `   • Link: ${item.property.url}\n`;
      });
    } else {
      message += `⚠️ Nessuno degli immobili analizzati soddisfa i criteri di fattibilità bancaria (<40% DTI).\n`;
    }
    return message;
  }

  let message = `🏢 Recomendador Inmobiliario Barcelona\n`;
  message += `👤 Perfil: ${buyerProfile.netMonthlySalary.toLocaleString(numLocale)} €/mes netos | Ahorro: ${buyerProfile.monthlySavingsCapacity.toLocaleString(numLocale)} €/mes (Cobro día 1)\n`;
  message += `💰 Ahorro acumulado actual disponible: ${buyerProfile.currentSavings.toLocaleString(numLocale)} € (Cartera completa)\n`;
  message += `📊 Total analizados: ${reports.length} | Viables: ${viable.length}\n\n`;

  if (topViable.length > 0) {
    message += `⭐ TOP OPORTUNIDADES VIABLES:\n`;
    topViable.forEach((item, idx) => {
      message += `\n${idx + 1}. ${item.property.title}\n`;
      message += `   • Precio: ${item.propertyPrice.toLocaleString(numLocale)} €\n`;
      message += `   • Entrada (${item.downPaymentPercent}%) + Gastos Cataluña (11.5%): ${item.totalUpfrontRequired.toLocaleString(numLocale)} €\n`;
      message += `   • Cuota francesa (${item.mortgageConfig.loanTermYears}a @ ${item.annualInterestRatePercent}%): ${item.monthlyMortgagePayment.toLocaleString(numLocale)} €/mes (Esfuerzo: ${item.dtiPercent}%)\n`;
      message += `   • Plazo de ahorro (Día 1): ${item.savingsTimeline.targetDateFormatted} (${item.savingsTimeline.monthsNeeded} meses)\n`;
      if (item.property.url) message += `   • Enlace: ${item.property.url}\n`;
    });
  } else {
    message += `⚠️ Ninguno de los inmuebles analizados cumple los criterios de viabilidad bancaria (<40% DTI).\n`;
  }

  return message;
}

/**
 * Handler HTTP POST: Recibe datos de pisos (JSON o HTML de alertas de correo),
 * evalúa su viabilidad con el motor financiero y devuelve la recomendación y filtro.
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let parsedBody: unknown;

    if (contentType.includes('application/json')) {
      parsedBody = await request.json();
    } else {
      parsedBody = await request.text();
    }

    const { properties, buyerOverrides, mortgageOverrides, filterOnlyViable } =
      extractPropertiesFromPayload(parsedBody, contentType);

    const lang: 'es' | 'it' =
      (request.nextUrl.searchParams.get('lang') as 'es' | 'it') ||
      (typeof parsedBody === 'object' && parsedBody !== null && 'lang' in parsedBody ? (parsedBody as { lang?: 'es' | 'it' }).lang : 'es') ||
      'es';

    if (!properties || properties.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: lang === 'it' ? 'Nessun dato immobiliare trovato nella richiesta.' : 'No se encontraron datos de pisos en la petición.',
          message: lang === 'it'
            ? 'Invia un JSON con un immobile o array di immobili ({ title, price, ... }), o HTML con annunci.'
            : 'Envía un JSON con un inmueble o array de inmuebles ({ title, price, ... }), o bien HTML con alertas inmobiliarias.',
          examplePayload: {
            title: 'Piso luminoso en Eixample Esquerra',
            price: 260000,
            location: 'Barcelona',
            district: 'Eixample',
            m2: 70,
            rooms: 2,
            bathrooms: 1,
            url: 'https://ejemplo.com/piso-eixample',
          },
        },
        { status: 400 }
      );
    }

    // Evaluación financiera de cada inmueble con los parámetros establecidos
    const reports: FinancialViabilityReport[] = properties.map((prop) =>
      evaluatePropertyViability(prop, buyerOverrides, mortgageOverrides, lang)
    );

    // Ordenar: primero viables (por score descendente), luego riesgo moderado, luego no viables
    reports.sort((a, b) => {
      const order = { VIABLE: 0, MODERATE_RISK: 1, NOT_VIABLE: 2 };
      if (order[a.status] !== order[b.status]) {
        return order[a.status] - order[b.status];
      }
      return b.score - a.score;
    });

    const activeBuyerProfile: BuyerProfile = {
      ...DEFAULT_BUYER_PROFILE,
      ...buyerOverrides,
    };

    const activeMortgageConfig: MortgageConfig = {
      ...DEFAULT_MORTGAGE_CONFIG,
      ...mortgageOverrides,
    };

    const maxRecommended = calculateMaxAffordablePropertyPrice(
      activeBuyerProfile,
      activeMortgageConfig,
      activeBuyerProfile.maxDtiRecommended
    );

    const maxHardLimit = calculateMaxAffordablePropertyPrice(
      activeBuyerProfile,
      activeMortgageConfig,
      activeBuyerProfile.maxDtiHardLimit
    );

    const viableList = reports.filter((r) => r.isViable);
    const moderateRiskList = reports.filter((r) => r.status === 'MODERATE_RISK');
    const notViableList = reports.filter((r) => r.status === 'NOT_VIABLE');

    const filteredReports = filterOnlyViable ? viableList : reports;

    const notificationSummary = generateFormattedNotificationSummary(reports, activeBuyerProfile, lang);

    // Comparativa de escenarios para el primer inmueble analizado
    const brokerFinancingScenarios = properties.length > 0
      ? calculateFinancingScenarios(properties[0].price, activeBuyerProfile, activeMortgageConfig, lang)
      : [];

    const metadata = typeof parsedBody === 'object' && parsedBody !== null && 'metadata' in parsedBody
      ? (parsedBody as { metadata?: { subject?: string; from?: string } }).metadata
      : undefined;

    // Registrar en Supabase y almacén
    const savedRecords: unknown[] = [];
    for (const rep of filteredReports) {
      const scenarios = calculateFinancingScenarios(rep.propertyPrice, activeBuyerProfile, activeMortgageConfig, lang);
      const saved = await saveEvaluatedProperty(
        rep,
        scenarios,
        metadata
          ? {
              subject: metadata.subject,
              from: metadata.from,
              date: (metadata as unknown as Record<string, string>).date,
            }
          : undefined
      );
      savedRecords.push(saved);
    }

    return NextResponse.json(
      {
        success: true,
        lang,
        timestamp: new Date().toISOString(),
        buyerProfile: {
          netMonthlySalary: activeBuyerProfile.netMonthlySalary,
          monthlySavingsCapacity: activeBuyerProfile.monthlySavingsCapacity,
          savingsPayday: activeBuyerProfile.savingsPayday,
          currentSavings: activeBuyerProfile.currentSavings,
          savingsPortfolio: activeBuyerProfile.savingsPortfolio,
          maxDtiRecommended: `${activeBuyerProfile.maxDtiRecommended * 100}%`,
          maxDtiHardLimit: `${activeBuyerProfile.maxDtiHardLimit * 100}%`,
        },
        mortgageEngineCatalonia: {
          downPaymentRate: `${activeMortgageConfig.downPaymentPercent}%`,
          itpAndExpensesCatalonia: `${activeMortgageConfig.itpAndExpensesPercent}% (10% ITP + ~1.5% gastos)`,
          totalUpfrontRequiredRate: `${activeMortgageConfig.downPaymentPercent + activeMortgageConfig.itpAndExpensesPercent}%`,
          annualInterestRate: `${(activeMortgageConfig.annualInterestRate > 1 ? activeMortgageConfig.annualInterestRate : activeMortgageConfig.annualInterestRate * 100)}%`,
          loanTermYears: activeMortgageConfig.loanTermYears,
          amortizationSystem: lang === 'it'
            ? 'Sistema Francese (Rata mensile fissa costante)'
            : 'Sistema Francés (Cuota mensual fija constante)',
          limits: {
            recommendedMaxPrice33Dti: maxRecommended.maxPropertyPrice,
            recommendedMaxMonthlyPayment: maxRecommended.maxMonthlyPayment,
            hardLimitMaxPrice40Dti: maxHardLimit.maxPropertyPrice,
            hardLimitMaxMonthlyPayment: maxHardLimit.maxMonthlyPayment,
          },
        },
        brokerScenariosComparison: brokerFinancingScenarios,
        stats: {
          receivedCount: properties.length,
          viableCount: viableList.length,
          moderateRiskCount: moderateRiskList.length,
          notViableCount: notViableList.length,
        },
        notificationSummary,
        results: filteredReports,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Error desconocido al procesar webhook';
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno al procesar los datos de las propiedades',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * Handler HTTP GET: Proporciona el estado del servicio, la configuración del motor
 * financiero y la documentación interactiva de uso del Webhook.
 */
export async function GET(request: NextRequest) {
  const lang: 'es' | 'it' =
    (request.nextUrl.searchParams.get('lang') as 'es' | 'it') || 'es';
  const numLocale = lang === 'it' ? 'it-IT' : 'es-ES';

  const maxRecommended = calculateMaxAffordablePropertyPrice(
    DEFAULT_BUYER_PROFILE,
    DEFAULT_MORTGAGE_CONFIG,
    0.33
  );
  const maxHardLimit = calculateMaxAffordablePropertyPrice(
    DEFAULT_BUYER_PROFILE,
    DEFAULT_MORTGAGE_CONFIG,
    0.40
  );

  if (lang === 'it') {
    return NextResponse.json({
      status: 'online',
      lang: 'it',
      endpoint: '/api/webhook',
      description: 'Webhook consulente e filtro immobiliare per Barcellona con ammortamento francese',
      buyerProfile: {
        netMonthlySalary: `${DEFAULT_BUYER_PROFILE.netMonthlySalary} €/mese`,
        monthlySavingsCapacity: `${DEFAULT_BUYER_PROFILE.monthlySavingsCapacity} €/mese`,
        savingsPayday: `Giorno ${DEFAULT_BUYER_PROFILE.savingsPayday} di ogni mese`,
        currentSavingsAccumulated: `${DEFAULT_BUYER_PROFILE.currentSavings.toLocaleString(numLocale)} €`,
        savingsPortfolio: DEFAULT_BUYER_PROFILE.savingsPortfolio,
        livingExpensesAssumed: `${DEFAULT_BUYER_PROFILE.netMonthlySalary - DEFAULT_BUYER_PROFILE.monthlySavingsCapacity} €/mese`,
      },
      cataloniaFiscalAndMortgageRules: {
        downPayment: '20% del valore dell\'immobile (Banca standard)',
        itpAndExpenses: '11,5% (10% ITP Generale Catalogna + 1,5% Notaio, Registro e Gestione)',
        totalUpfrontCapital: '31,5% del valore dell\'immobile',
        amortizationSystem: 'Ammortamento Francese (rata periodica costante)',
        nominalInterestRate: '2,80% annuo',
        loanTerm: '30 anni (360 rate)',
        budgetLimits: {
          healthyMaxPrice33Dti: `${maxRecommended.maxPropertyPrice.toLocaleString(numLocale)} € (Rata: ${maxRecommended.maxMonthlyPayment.toLocaleString(numLocale)} €/mese)`,
          maximumBankLimit40Dti: `${maxHardLimit.maxPropertyPrice.toLocaleString(numLocale)} € (Rata: ${maxHardLimit.maxMonthlyPayment.toLocaleString(numLocale)} €/mese)`,
        },
      },
      brokerOptions: {
        description: 'Finanziamento con broker mutui al 90%, 95% o 100% per ridurre l\'acconto iniziale.',
      },
      instructions: {
        method: 'POST',
        acceptedFormats: [
          'application/json con oggetto immobile: { title, price, location, m2, rooms, url }',
          'application/json con elenco immobili: [ { ... }, { ... } ]',
          'application/json con HTML di avvisi email: { html: "<div>...</div>" }',
          'text/html diretto da webhook di inbound email',
        ],
      },
    });
  }

  return NextResponse.json({
    status: 'online',
    lang: 'es',
    endpoint: '/api/webhook',
    description: 'Webhook recomendador y filtro inmobiliario para Barcelona con amortización francesa',
    buyerProfile: {
      netMonthlySalary: `${DEFAULT_BUYER_PROFILE.netMonthlySalary} €/mes`,
      monthlySavingsCapacity: `${DEFAULT_BUYER_PROFILE.monthlySavingsCapacity} €/mes`,
      savingsPayday: `Día ${DEFAULT_BUYER_PROFILE.savingsPayday} de cada mes`,
      currentSavingsAccumulated: `${DEFAULT_BUYER_PROFILE.currentSavings.toLocaleString(numLocale)} €`,
      savingsPortfolio: DEFAULT_BUYER_PROFILE.savingsPortfolio,
      livingExpensesAssumed: `${DEFAULT_BUYER_PROFILE.netMonthlySalary - DEFAULT_BUYER_PROFILE.monthlySavingsCapacity} €/mes`,
    },
    cataloniaFiscalAndMortgageRules: {
      downPayment: '20% del valor del inmueble',
      itpAndExpenses: '11.5% (10% ITP General Cataluña + 1.5% Notaría, Registro y Gestoría)',
      totalUpfrontCapital: '31.5% del valor del inmueble',
      amortizationSystem: 'Amortización Francesa (cuota periódica constante)',
      nominalInterestRate: '2.80% anual',
      loanTerm: '30 años (360 cuotas)',
      budgetLimits: {
        healthyMaxPrice33Dti: `${maxRecommended.maxPropertyPrice.toLocaleString(numLocale)} € (Cuota: ${maxRecommended.maxMonthlyPayment.toLocaleString(numLocale)} €/mes)`,
        maximumBankLimit40Dti: `${maxHardLimit.maxPropertyPrice.toLocaleString(numLocale)} € (Cuota: ${maxHardLimit.maxMonthlyPayment.toLocaleString(numLocale)} €/mes)`,
      },
    },
    brokerOptions: {
      description: 'Financiación mediante broker hipotecario al 90%, 95% o 100% para reducir la entrada requerida.',
    },
    instructions: {
      method: 'POST',
      acceptedFormats: [
        'application/json con objeto de piso: { title, price, location, m2, rooms, url }',
        'application/json con array de pisos: [ { ... }, { ... } ]',
        'application/json con HTML de alertas de correo: { html: "<div>...</div>" }',
        'text/html directo desde webhooks de inbound email',
      ],
    },
  });
}
