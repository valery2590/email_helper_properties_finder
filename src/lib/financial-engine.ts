/**
 * Motor Financiero Inmobiliario para Barcelona / Cataluña
 * 
 * Parámetros base del comprador:
 * - Sueldo neto mensual: 3.250 €
 * - Capacidad de ahorro mensual: 2.500 € (cobro el día 1 de cada mes)
 * - Ahorro actual acumulado en cartera: 32.629 € (Trade Republic, Revolut, Sabadell, Bitpanda)
 * - Entrada requerida: 20% del valor del inmueble
 * - ITP y gastos en Cataluña: 11.5% (10% ITP general Cataluña + ~1.5% notaría, registro, gestoría y tasación)
 * - Aportación inicial total necesaria: 31.5% del precio de compra
 * - Amortización: Sistema Francés (cuota fija mensual de amortización e intereses decrecientes)
 */

export interface SavingsAccountItem {
  id: string;
  institution: string;
  category: 'cuenta_remunerada' | 'etfs' | 'criptos';
  label: string;
  amount: number;
  isLiquid: boolean;
  notes?: string;
}

export interface BuyerProfile {
  /** Sueldo neto mensual en euros (ej. 3250) */
  netMonthlySalary: number;
  /** Capacidad de ahorro mensual en euros (ej. 1300 o 2500) */
  monthlySavingsCapacity: number;
  /** Día del mes en el que se cobra e ingresa el ahorro (ej. 1) */
  savingsPayday: number;
  /** Ahorro líquido actual disponible en euros (por defecto 32.629 € según cartera real) */
  currentSavings: number;
  /** Desglose de cuentas y posiciones de ahorro actuales */
  savingsPortfolio?: SavingsAccountItem[];
  /** Límite recomendado de endeudamiento (DTI) según Banco de España (por defecto 0.33 = 33%) */
  maxDtiRecommended: number;
  /** Límite máximo estricto de endeudamiento admisible por banca (por defecto 0.40 = 40%) */
  maxDtiHardLimit: number;
}

export interface MortgageConfig {
  /** Tipo de interés nominal anual (TIN) en tanto por uno (ej. 0.028 para 2.8%) o en porcentaje (ej. 2.8) */
  annualInterestRate: number;
  /** Plazo del préstamo hipotecario en años (ej. 30) */
  loanTermYears: number;
  /** Porcentaje de entrada mínima sobre el precio de compra (ej. 20.0 para 20%, 10% para 90%, 5% para 95%, 0% para 100%) */
  downPaymentPercent: number;
  /** Porcentaje de financiación sobre el precio de compra (LTV: ej. 80, 90, 95 o 100) */
  financingPercent?: number;
  /** Porcentaje de ITP y gastos en Cataluña (ej. 11.5 para 11.5%) */
  itpAndExpensesPercent: number;
}

export interface PropertyData {
  id?: string;
  title: string;
  price: number;
  location?: string;
  district?: string;
  m2?: number;
  rooms?: number;
  bathrooms?: number;
  url?: string;
  description?: string;
  imageUrl?: string;
  source?: string;
}

export interface AmortizationScheduleRow {
  month: number;
  year: number;
  payment: number;
  interestPaid: number;
  principalPaid: number;
  remainingBalance: number;
}

export interface SavingsTimeline {
  currentSavings: number;
  targetAmount: number;
  shortfall: number;
  isReadyNow: boolean;
  monthsNeeded: number;
  targetDateIso: string;
  targetDateFormatted: string;
}

export type ViabilityStatus = 'VIABLE' | 'MODERATE_RISK' | 'NOT_VIABLE';

export interface FinancialViabilityReport {
  property: PropertyData;
  buyerProfile: BuyerProfile;
  mortgageConfig: MortgageConfig;
  
  // Desglose de costes iniciales
  propertyPrice: number;
  downPaymentPercent: number;
  downPaymentAmount: number;
  itpAndExpensesPercent: number;
  itpAndExpensesAmount: number;
  totalUpfrontRequired: number; // 20% + 11.5% = 31.5%
  
  // Préstamo hipotecario
  loanAmount: number; // 80%
  annualInterestRatePercent: number;
  monthlyInterestRate: number;
  loanTermYears: number;
  totalInstallments: number; // loanTermYears * 12
  
  // Cuotas y costes amortización francesa
  monthlyMortgagePayment: number; // Cuota mensual fija
  totalInterestPaid: number;
  totalMortgageCost: number;
  totalAcquisitionCost: number; // Precio + ITP/gastos + Intereses totales
  firstMonthInterest: number;
  firstMonthPrincipal: number;
  
  // Ratios bancarios y de esfuerzo
  dtiRatio: number; // monthlyMortgagePayment / netMonthlySalary
  dtiPercent: number; // dtiRatio * 100
  residualNetIncome: number; // netMonthlySalary - monthlyMortgagePayment
  residualSavingsCapacity: number; // Ahorro neto restante tras pagar la hipoteca
  
  // Viabilidad y veredicto
  status: ViabilityStatus;
  isViable: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  score: number; // 0 - 100
  summary: string;
  recommendation: string;
  tags: string[];
  
  // Plan de ahorro
  savingsTimeline: SavingsTimeline;
}

/**
 * Cartera real de ahorros e inversiones del comprador
 * Datos exactos de la cartera:
 * - Trade Republic (cuenta remunerada): 20.450 €
 * - Revolut (cuenta remunerada): 5.900 €
 * - Trade Republic (ETFs): 2.800 €
 * - Bitpanda (criptos): 325 €
 * - Sabadell (cuenta remunerada): 3.154 €
 * Total: 32.629 €
 */
export const DEFAULT_SAVINGS_PORTFOLIO: SavingsAccountItem[] = [
  {
    id: 'tr-remunerada',
    institution: 'Trade Republic',
    category: 'cuenta_remunerada',
    label: 'Cuenta remunerada',
    amount: 20450,
    isLiquid: true,
    notes: 'Liquidez inmediata de alta remuneración',
  },
  {
    id: 'revolut-remunerada',
    institution: 'Revolut',
    category: 'cuenta_remunerada',
    label: 'Cuenta remunerada',
    amount: 5900,
    isLiquid: true,
    notes: 'Disponible y remunerada',
  },
  {
    id: 'sabadell-remunerada',
    institution: 'Banco Sabadell',
    category: 'cuenta_remunerada',
    label: 'Cuenta remunerada',
    amount: 3154,
    isLiquid: true,
    notes: 'Cuenta bancaria remunerada disponible',
  },
  {
    id: 'tr-etfs',
    institution: 'Trade Republic',
    category: 'etfs',
    label: 'ETFs',
    amount: 2800,
    isLiquid: true,
    notes: 'Fondos indexados cotizados',
  },
  {
    id: 'bitpanda-criptos',
    institution: 'Bitpanda',
    category: 'criptos',
    label: 'Criptos',
    amount: 325,
    isLiquid: true,
    notes: 'Criptoactivos',
  },
];

export const TOTAL_INITIAL_SAVINGS = DEFAULT_SAVINGS_PORTFOLIO.reduce((sum, item) => sum + item.amount, 0); // 32.629 €

/**
 * Perfil base del comprador especificado en los requisitos y cartera real
 */
export const DEFAULT_BUYER_PROFILE: BuyerProfile = {
  netMonthlySalary: 3250,
  monthlySavingsCapacity: 2500, // Ajustado a 2.500 €/mes según la capacidad actual del comprador
  savingsPayday: 1, // Cobro y aportación el día 1 de cada mes
  currentSavings: TOTAL_INITIAL_SAVINGS, // 32.629 € en total acumulado
  savingsPortfolio: DEFAULT_SAVINGS_PORTFOLIO,
  maxDtiRecommended: 0.33, // 33% recomendado
  maxDtiHardLimit: 0.40, // 40% límite máximo bancario
};

/**
 * Configuración fiscal e hipotecaria estándar para Cataluña
 */
export const DEFAULT_MORTGAGE_CONFIG: MortgageConfig = {
  annualInterestRate: 0.028, // 2.8% TIN fijo de mercado
  loanTermYears: 30, // 30 años (360 meses)
  downPaymentPercent: 20.0, // 20% de entrada
  itpAndExpensesPercent: 11.5, // 11.5% ITP + gastos en Cataluña
};

/**
 * Normaliza el tipo de interés a valor decimal (ej. 2.8 o 0.028 -> 0.028)
 */
export function normalizeRate(rate: number): number {
  if (rate > 1) {
    return rate / 100;
  }
  return rate;
}

/**
 * Calcula la cuota mensual fija bajo el Sistema de Amortización Francés
 * Fórmula: Cuota = Capital * [ r * (1 + r)^n ] / [ (1 + r)^n - 1 ]
 * 
 * @param principal Capital prestado (Euros)
 * @param annualRate Tipo de interés anual nominal (ej. 0.028 para 2.8%)
 * @param termYears Plazo en años
 */
export function calculateFrenchMonthlyPayment(
  principal: number,
  annualRate: number,
  termYears: number
): number {
  if (principal <= 0) return 0;
  if (termYears <= 0) return principal;

  const rAnnual = normalizeRate(annualRate);
  const monthlyRate = rAnnual / 12;
  const n = termYears * 12;

  if (monthlyRate === 0) {
    return principal / n;
  }

  const factor = Math.pow(1 + monthlyRate, n);
  const monthlyPayment = principal * ((monthlyRate * factor) / (factor - 1));

  return Math.round(monthlyPayment * 100) / 100;
}

/**
 * Genera la tabla o un extracto del cuadro de amortización francés
 */
export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  termYears: number,
  limitMonths?: number
): AmortizationScheduleRow[] {
  const schedule: AmortizationScheduleRow[] = [];
  const rAnnual = normalizeRate(annualRate);
  const monthlyRate = rAnnual / 12;
  const totalMonths = termYears * 12;
  const payment = calculateFrenchMonthlyPayment(principal, annualRate, termYears);
  
  let balance = principal;
  const monthsToCompute = limitMonths ? Math.min(limitMonths, totalMonths) : totalMonths;

  for (let m = 1; m <= monthsToCompute; m++) {
    const interest = Math.round(balance * monthlyRate * 100) / 100;
    const principalPaid = m === totalMonths ? balance : Math.round((payment - interest) * 100) / 100;
    balance = Math.max(0, Math.round((balance - principalPaid) * 100) / 100);

    schedule.push({
      month: m,
      year: Math.ceil(m / 12),
      payment: m === totalMonths ? interest + principalPaid : payment,
      interestPaid: interest,
      principalPaid,
      remainingBalance: balance,
    });

    if (balance <= 0) break;
  }

  return schedule;
}

/**
 * Proyecta la fecha y meses necesarios para alcanzar el capital inicial requerido
 * teniendo en cuenta que la capacidad de ahorro se ingresa el día 1 de cada mes.
 * 
 * @param targetAmount Capital inicial necesario (Entrada 20% + Gastos 11.5% = 31.5%)
 * @param currentSavings Ahorro disponible actual
 * @param monthlySavings Capacidad de ahorro mensual (2.500 €)
 * @param savingsPayday Día del cobro mensual (1)
 * @param referenceDate Fecha de referencia (opcional, por defecto hoy)
 */
export function calculateSavingsTimeline(
  targetAmount: number,
  currentSavings: number = 0,
  monthlySavings: number = DEFAULT_BUYER_PROFILE.monthlySavingsCapacity,
  savingsPayday: number = DEFAULT_BUYER_PROFILE.savingsPayday,
  referenceDate?: Date,
  lang: 'es' | 'it' = 'es'
): SavingsTimeline {
  const baseDate = referenceDate || new Date('2026-10-01T00:00:00Z');
  const shortfall = Math.max(0, Math.round((targetAmount - currentSavings) * 100) / 100);

  if (shortfall === 0) {
    const todayIso = baseDate.toISOString().split('T')[0];
    return {
      currentSavings,
      targetAmount,
      shortfall: 0,
      isReadyNow: true,
      monthsNeeded: 0,
      targetDateIso: todayIso,
      targetDateFormatted: lang === 'it' ? 'Disponibile subito' : 'Disponible de inmediato',
    };
  }

  if (monthlySavings <= 0) {
    return {
      currentSavings,
      targetAmount,
      shortfall,
      isReadyNow: false,
      monthsNeeded: Infinity,
      targetDateIso: '',
      targetDateFormatted: lang === 'it' ? 'Capacità di risparmio insufficiente' : 'Capacidad de ahorro insuficiente',
    };
  }

  const monthsNeeded = Math.ceil(shortfall / monthlySavings);

  // Cálculo del calendario: los ahorros se ingresan el día 1
  const targetDate = new Date(baseDate.getTime());
  
  // Si hoy es posterior al día de cobro del mes en curso, el primer cobro efectivo será el día 1 del próximo mes
  let currentMonthOffset = 0;
  if (targetDate.getDate() > savingsPayday) {
    currentMonthOffset = 1;
  }

  // Avanzamos el número de meses necesarios
  targetDate.setDate(savingsPayday);
  targetDate.setMonth(targetDate.getMonth() + currentMonthOffset + (monthsNeeded - 1));

  const targetDateIso = targetDate.toISOString().split('T')[0];
  
  const spanishMonths = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  const italianMonths = [
    'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
    'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'
  ];

  const targetDateFormatted = lang === 'it'
    ? `${savingsPayday} ${italianMonths[targetDate.getMonth()]} ${targetDate.getFullYear()}`
    : `${savingsPayday} de ${spanishMonths[targetDate.getMonth()]} de ${targetDate.getFullYear()}`;

  return {
    currentSavings,
    targetAmount,
    shortfall,
    isReadyNow: false,
    monthsNeeded,
    targetDateIso,
    targetDateFormatted,
  };
}

/**
 * Calcula el precio máximo admisible según el ratio de esfuerzo (DTI) deseado
 * Invierte la fórmula de amortización francesa:
 * CuotaMax = Salario * DTI
 * CapitalMax = CuotaMax * [ (1+r)^n - 1 ] / [ r * (1+r)^n ]
 * PrecioMax = CapitalMax / (1 - entradaPercent)
 */
export function calculateMaxAffordablePropertyPrice(
  profile: Partial<BuyerProfile> = {},
  config: Partial<MortgageConfig> = {},
  targetDti: number = DEFAULT_BUYER_PROFILE.maxDtiRecommended
): {
  maxPropertyPrice: number;
  maxMonthlyPayment: number;
  loanAmount: number;
  downPaymentAmount: number;
  itpAndExpensesAmount: number;
  totalUpfrontRequired: number;
} {
  const p = { ...DEFAULT_BUYER_PROFILE, ...profile };
  const c = { ...DEFAULT_MORTGAGE_CONFIG, ...config };

  const maxMonthlyPayment = p.netMonthlySalary * targetDti;
  const rAnnual = normalizeRate(c.annualInterestRate);
  const monthlyRate = rAnnual / 12;
  const n = c.loanTermYears * 12;

  let maxLoan = 0;
  if (monthlyRate === 0) {
    maxLoan = maxMonthlyPayment * n;
  } else {
    const factor = Math.pow(1 + monthlyRate, n);
    maxLoan = maxMonthlyPayment * ((factor - 1) / (monthlyRate * factor));
  }

  const downPaymentRatio = c.downPaymentPercent / 100;
  const loanRatio = 1 - downPaymentRatio;
  const maxPropertyPrice = Math.round((maxLoan / loanRatio) * 100) / 100;
  const downPaymentAmount = Math.round(maxPropertyPrice * downPaymentRatio * 100) / 100;
  const itpAndExpensesAmount = Math.round(maxPropertyPrice * (c.itpAndExpensesPercent / 100) * 100) / 100;
  const totalUpfrontRequired = Math.round((downPaymentAmount + itpAndExpensesAmount) * 100) / 100;

  return {
    maxPropertyPrice,
    maxMonthlyPayment: Math.round(maxMonthlyPayment * 100) / 100,
    loanAmount: Math.round(maxLoan * 100) / 100,
    downPaymentAmount,
    itpAndExpensesAmount,
    totalUpfrontRequired,
  };
}

/**
 * Evalúa la viabilidad financiera completa de una propiedad para el perfil del comprador
 */
export function evaluatePropertyViability(
  property: PropertyData,
  buyerProfileOverrides?: Partial<BuyerProfile>,
  mortgageConfigOverrides?: Partial<MortgageConfig>,
  lang: 'es' | 'it' = 'es'
): FinancialViabilityReport {
  const buyerProfile: BuyerProfile = {
    ...DEFAULT_BUYER_PROFILE,
    ...buyerProfileOverrides,
  };

  const mortgageConfig: MortgageConfig = {
    ...DEFAULT_MORTGAGE_CONFIG,
    ...mortgageConfigOverrides,
  };

  const propertyPrice = Math.max(0, property.price);
  const downPaymentPercent = mortgageConfigOverrides?.financingPercent !== undefined
    ? Math.max(0, 100 - mortgageConfigOverrides.financingPercent)
    : mortgageConfig.downPaymentPercent;
  const itpAndExpensesPercent = mortgageConfig.itpAndExpensesPercent; // 11.5%

  // Cálculos de entrada y gastos en Cataluña
  const downPaymentAmount = Math.round(propertyPrice * (downPaymentPercent / 100) * 100) / 100;
  const itpAndExpensesAmount = Math.round(propertyPrice * (itpAndExpensesPercent / 100) * 100) / 100;
  const totalUpfrontRequired = Math.round((downPaymentAmount + itpAndExpensesAmount) * 100) / 100;

  // Importe a financiar (generalmente el 80%)
  const loanAmount = Math.max(0, propertyPrice - downPaymentAmount);

  // Amortización francesa
  const annualInterestRatePercent = normalizeRate(mortgageConfig.annualInterestRate) * 100;
  const monthlyRate = normalizeRate(mortgageConfig.annualInterestRate) / 12;
  const totalInstallments = mortgageConfig.loanTermYears * 12;

  const monthlyMortgagePayment = calculateFrenchMonthlyPayment(
    loanAmount,
    mortgageConfig.annualInterestRate,
    mortgageConfig.loanTermYears
  );

  const totalMortgageCost = Math.round(monthlyMortgagePayment * totalInstallments * 100) / 100;
  const totalInterestPaid = Math.max(0, Math.round((totalMortgageCost - loanAmount) * 100) / 100);
  const totalAcquisitionCost = Math.round((propertyPrice + itpAndExpensesAmount + totalInterestPaid) * 100) / 100;

  const firstMonthInterest = Math.round(loanAmount * monthlyRate * 100) / 100;
  const firstMonthPrincipal = Math.max(0, Math.round((monthlyMortgagePayment - firstMonthInterest) * 100) / 100);

  // Ratios de esfuerzo
  const dtiRatio = buyerProfile.netMonthlySalary > 0
    ? monthlyMortgagePayment / buyerProfile.netMonthlySalary
    : 1;
  const dtiPercent = Math.round(dtiRatio * 1000) / 10; // ej. 28.5%

  const residualNetIncome = Math.round((buyerProfile.netMonthlySalary - monthlyMortgagePayment) * 100) / 100;
  
  // Capacidad de ahorro residual estimada:
  // Sueldo (3.250) - Gastos fijos estimados actuales (3.250 - 2.500 = 750 €) - Cuota hipotecaria
  const estimatedLivingExpenses = buyerProfile.netMonthlySalary - buyerProfile.monthlySavingsCapacity;
  const residualSavingsCapacity = Math.round((residualNetIncome - estimatedLivingExpenses) * 100) / 100;

  // Plan de ahorro para alcanzar el capital inicial requerido (día 1)
  const savingsTimeline = calculateSavingsTimeline(
    totalUpfrontRequired,
    buyerProfile.currentSavings,
    buyerProfile.monthlySavingsCapacity,
    buyerProfile.savingsPayday,
    undefined,
    lang
  );

  // Determinación de estado de viabilidad
  let status: ViabilityStatus = 'VIABLE';
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  let isViable = true;
  const tags: string[] = [];

  if (dtiRatio <= buyerProfile.maxDtiRecommended) {
    // <= 33%
    status = 'VIABLE';
    riskLevel = 'LOW';
    isViable = true;
    tags.push('CUOTA_SALUDABLE', 'BAJO_RIESGO');
  } else if (dtiRatio <= buyerProfile.maxDtiHardLimit) {
    // 33% - 40%
    status = 'MODERATE_RISK';
    riskLevel = 'MEDIUM';
    isViable = true;
    tags.push('AL_LIMITE_ENDEUDAMIENTO', 'RIESGO_MODERADO');
  } else {
    // > 40%
    status = 'NOT_VIABLE';
    riskLevel = 'HIGH';
    isViable = false;
    tags.push('EXCEDE_ENDEUDAMIENTO_40', 'NO_VIABLE_BANCO');
  }

  if (savingsTimeline.isReadyNow) {
    tags.push('CAPITAL_DISPONIBLE');
  } else if (savingsTimeline.monthsNeeded <= 24) {
    tags.push('AHORRO_CORTO_PLAZO');
  } else {
    tags.push('AHORRO_LARGO_PLAZO');
  }

  // Score de 0 a 100
  let score = 100;
  if (dtiPercent > 20) {
    score -= (dtiPercent - 20) * 3.5;
  }
  if (!savingsTimeline.isReadyNow) {
    score -= Math.min(25, savingsTimeline.monthsNeeded * 0.4);
  }
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Resumen y recomendaciones en lenguaje natural (ES e IT)
  let summary = '';
  let recommendation = '';

  if (lang === 'it') {
    if (status === 'VIABLE') {
      summary = `Immobile totalmente fattibile. La rata mensile stimata (${monthlyMortgagePayment.toLocaleString('it-IT')} €/mese) rappresenta il ${dtiPercent}% dello stipendio netto (${buyerProfile.netMonthlySalary.toLocaleString('it-IT')} €), entro la soglia raccomandata (< 33%).`;
      recommendation = savingsTimeline.isReadyNow
        ? 'Ottima opportunità: profilo finanziario idoneo e capitale iniziale pronto per avviare visita o trattativa.'
        : `Finanziariamente sostenibile come rata. Mancano ${savingsTimeline.monthsNeeded} mesi di risparmio (${savingsTimeline.targetAmount.toLocaleString('it-IT')} € per acconto + 11.5% spese) con data obiettivo stimata al ${savingsTimeline.targetDateFormatted}.`;
    } else if (status === 'MODERATE_RISK') {
      summary = `Fattibilità al limite / rischio moderato. La rata (${monthlyMortgagePayment.toLocaleString('it-IT')} €/mese) assorbe il ${dtiPercent}% dello stipendio netto, superando il 33% raccomandato ma sotto la soglia bancaria massima del 40%.`;
      recommendation = 'Richiede prudenza o un maggior apporto iniziale per ridurre il capitale richiesto e portare lo sforzo sotto il 33%.';
    } else {
      summary = `Non fattibile secondo i criteri bancari standard. La rata mensile (${monthlyMortgagePayment.toLocaleString('it-IT')} €/mese) rappresenta il ${dtiPercent}% dello stipendio netto, superando il limite prudenziale del 40% (${(buyerProfile.netMonthlySalary * 0.4).toLocaleString('it-IT')} €/mese).`;
      recommendation = 'Si sconsiglia l\'acquisto salvo un apporto iniziale significativamente maggiore o una negoziazione sostanziale al ribasso sul prezzo.';
    }
  } else {
    if (status === 'VIABLE') {
      summary = `Propiedad totalmente viable. La cuota mensual estimada (${monthlyMortgagePayment.toLocaleString('es-ES')} €/mes) supone un ${dtiPercent}% del salario neto (${buyerProfile.netMonthlySalary.toLocaleString('es-ES')} €), dentro del rango recomendado (< 33%).`;
      recommendation = savingsTimeline.isReadyNow
        ? 'Excelente oportunidad: perfil financiero apto y capital inicial cubierto para iniciar negociación o visita.'
        : `Financieramente viable en cuota. Necesitas ${savingsTimeline.monthsNeeded} meses de ahorro (${savingsTimeline.targetAmount.toLocaleString('es-ES')} € para entrada + 11.5% gastos) fijando como fecha objetivo el ${savingsTimeline.targetDateFormatted}.`;
    } else if (status === 'MODERATE_RISK') {
      summary = `Viabilidad ajustada / riesgo moderado. La cuota (${monthlyMortgagePayment.toLocaleString('es-ES')} €/mes) absorbe un ${dtiPercent}% del sueldo neto, superando el 33% recomendado pero por debajo del límite bancario estricto del 40%.`;
      recommendation = 'Requiere análisis prudente o mayor aportación inicial para reducir capital solicitado y situar el esfuerzo por debajo del 33%.';
    } else {
      summary = `No viable según criterios bancarios estándar. La cuota mensual (${monthlyMortgagePayment.toLocaleString('es-ES')} €/mes) representa un ${dtiPercent}% del salario neto, superando el tope prudencial del 40% (${(buyerProfile.netMonthlySalary * 0.4).toLocaleString('es-ES')} €/mes).`;
      recommendation = 'Se desaconseja la compra salvo aportación inicial significativamente superior o negociación sustancial a la baja en el precio.';
    }
  }

  return {
    property,
    buyerProfile,
    mortgageConfig,
    propertyPrice,
    downPaymentPercent,
    downPaymentAmount,
    itpAndExpensesPercent,
    itpAndExpensesAmount,
    totalUpfrontRequired,
    loanAmount,
    annualInterestRatePercent,
    monthlyInterestRate: Math.round(monthlyRate * 100000) / 100000,
    loanTermYears: mortgageConfig.loanTermYears,
    totalInstallments,
    monthlyMortgagePayment,
    totalInterestPaid,
    totalMortgageCost,
    totalAcquisitionCost,
    firstMonthInterest,
    firstMonthPrincipal,
    dtiRatio: Math.round(dtiRatio * 10000) / 10000,
    dtiPercent,
    residualNetIncome,
    residualSavingsCapacity,
    status,
    isViable,
    riskLevel,
    score,
    summary,
    recommendation,
    tags,
    savingsTimeline,
  };
}

export interface FinancingScenarioResult {
  ltvPercent: number; // 80, 90, 95, 100
  label: string;
  sourceType: 'bank' | 'broker';
  downPaymentPercent: number; // 20, 10, 5, 0
  downPaymentAmount: number;
  itpAndExpensesAmount: number;
  totalUpfrontRequired: number;
  shortfall: number;
  monthsNeeded: number;
  targetDateFormatted: string;
  isReadyNow: boolean;
  loanAmount: number;
  monthlyMortgagePayment: number;
  dtiPercent: number;
  status: ViabilityStatus;
  isViable: boolean;
  score: number;
  summary: string;
}

/**
 * Compara los 4 escenarios de financiación:
 * - 80% (Banca tradicional estándar)
 * - 90% (Con Broker hipotecario)
 * - 95% (Con Broker hipotecario avanzado)
 * - 100% (Con Broker hipotecario al 100% financiando precio y aportando solo ITP/gastos)
 */
export function calculateFinancingScenarios(
  propertyPrice: number,
  buyerProfile: Partial<BuyerProfile> = {},
  mortgageConfig: Partial<MortgageConfig> = {},
  lang: 'es' | 'it' = 'es'
): FinancingScenarioResult[] {
  const ltvScenarios = [80, 90, 95, 100];
  const p = { ...DEFAULT_BUYER_PROFILE, ...buyerProfile };
  const c = { ...DEFAULT_MORTGAGE_CONFIG, ...mortgageConfig };

  return ltvScenarios.map((ltv) => {
    const downPaymentPercent = Math.max(0, 100 - ltv);
    const evalResult = evaluatePropertyViability(
      {
        title: `Simulación ${ltv}% LTV`,
        price: propertyPrice,
      },
      p,
      {
        ...c,
        financingPercent: ltv,
        downPaymentPercent,
      },
      lang
    );

    let label = '';
    if (lang === 'it') {
      label = ltv === 80
        ? 'Banca Standard (80%)'
        : ltv === 90
        ? 'Broker Mutui (90%)'
        : ltv === 95
        ? 'Broker Avanzato (95%)'
        : 'Broker 100% (Solo Spese)';
    } else {
      label = ltv === 80
        ? 'Banca Tradicional (80%)'
        : ltv === 90
        ? 'Broker Hipotecario (90%)'
        : ltv === 95
        ? 'Broker Avanzado (95%)'
        : 'Broker 100% (Solo Gastos)';
    }

    return {
      ltvPercent: ltv,
      label,
      sourceType: ltv === 80 ? 'bank' : 'broker',
      downPaymentPercent,
      downPaymentAmount: evalResult.downPaymentAmount,
      itpAndExpensesAmount: evalResult.itpAndExpensesAmount,
      totalUpfrontRequired: evalResult.totalUpfrontRequired,
      shortfall: evalResult.savingsTimeline.shortfall,
      monthsNeeded: evalResult.savingsTimeline.monthsNeeded,
      targetDateFormatted: evalResult.savingsTimeline.targetDateFormatted,
      isReadyNow: evalResult.savingsTimeline.isReadyNow,
      loanAmount: evalResult.loanAmount,
      monthlyMortgagePayment: evalResult.monthlyMortgagePayment,
      dtiPercent: evalResult.dtiPercent,
      status: evalResult.status,
      isViable: evalResult.isViable,
      score: evalResult.score,
      summary: evalResult.summary,
    };
  });
}
