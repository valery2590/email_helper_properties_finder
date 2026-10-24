import { PropertyData } from '@/lib/financial-engine';

export type Language = 'es' | 'it';

export interface Translations {
  // Header
  appTitle: string;
  appSubtitle: string;
  portfolioSavingsLabel: string;

  // Perfil Comprador
  buyerProfileTitle: string;
  buyerProfileHeading: string;
  buyerProfileDescription: string;
  netSalaryLabel: string;
  netSalarySub: string;
  monthlySavingsLabel: string;
  monthlySavingsSub: string;
  accumulatedSavingsLabel: string;
  accumulatedSavingsSub: (count: number) => string;
  cataloniaCapitalLabel: string;
  cataloniaCapitalSub: string;
  cataloniaCapitalDownPaymentSub: (downPaymentPercent: number) => string;

  // Cartera
  portfolioTitle: string;
  portfolioDescription: string;
  selectedTotalLabel: string;
  hideAccounts: string;
  showAccounts: string;
  liquidTag: string;
  investmentTag: string;
  accountLabels: Record<string, string>;
  accountNotes: Record<string, string>;

  // Tabs
  tabSimulator: string;
  tabProperties: string;
  tabProfile: string;
  tabDocs: string;

  // Simulador Inputs
  simParamsTitle: string;
  propertyPriceLabel: string;
  recommendedPriceLabel: (max: string) => string;
  savingsSelectedLabel: string;
  presetAll: string;
  presetLiquid: string;
  presetTR: string;
  presetZero: string;
  fixedMonthlySavingsLabel: string;
  fixedMonthlySavingsSub: string;
  mortgageTermLabel: string;
  interestRateLabel: string;
  term20Years: string;
  term25Years: string;
  term30Years: string;
  limitHealthyLabel: string;
  limitBankLabel: string;
  btnBankLabel: string;
  btnBrokerLabel: string;

  // Comparador de Financiación (80% vs 90% vs 95% vs 100%)
  financingModeLabel: string;
  financing80: string;
  financing90: string;
  financing95: string;
  financing100: string;
  scenarioComparisonTitle: string;
  scenarioComparisonSubtitle: string;
  scenarioTableLtv: string;
  scenarioTableUpfront: string;
  scenarioTableShortfall: string;
  scenarioTableTime: string;
  scenarioTableMonthly: string;
  scenarioTableDti: string;
  scenarioTableViability: string;
  brokerAdvantageBadge: string;
  brokerExplanationText: string;
  badge100Financing: string;
  badge95Broker: string;
  cardDownPaymentDetail: (downPaymentPercent: number, amount: string) => string;
  cardTotalUpfrontLabel: string;
  cardShortfallLabel: string;
  cardShortfallCovered: string;
  cardTimeNeededLabel: string;
  cardBuyNow: string;
  cardFrenchMonthlyLabel: string;
  cardDtiLabel: string;

  // Resultados
  statusViable: string;
  statusModerateRisk: string;
  statusNotViable: string;
  viabilityScoreLabel: string;
  frenchPaymentLabel: string;
  perMonth: string;
  frenchPaymentSub: (years: number, rate: number) => string;
  dtiLabel: string;
  dtiSub: string;
  residualIncomeLabel: string;
  residualIncomeSub: string;
  recommendationTitle: string;

  // Desglose
  upfrontBreakdownTitle: string;
  downPaymentLabel: string;
  itpExpensesLabel: string;
  totalUpfrontLabel: string;
  loanAmountLabel: string;

  // Plan Ahorro
  savingsPlanTitle: string;
  currentInPortfolio: string;
  shortfallLabel: string;
  timeNeededLabel: string;
  timeReadyNow: string;
  monthsCount: (months: number) => string;
  targetDateLabel: string;

  // Tabla Amortización
  btnHideAmortization: string;
  btnShowAmortization: string;
  thMonth: string;
  thPayment: string;
  thPrincipal: string;
  thInterest: string;
  thBalance: string;
  rowMonth: (m: number) => string;

  // Webhook Tester
  webhookTitle: string;
  webhookSubtitle: string;
  tabJsonProperties: string;
  tabHtmlScraping: string;
  requestBodyLabelJson: string;
  requestBodyLabelHtml: string;
  btnRestoreExample: string;
  btnSendWebhook: string;
  btnSendingWebhook: string;
  responseTitle: (status: number) => string;
  statReceived: (n: number) => string;
  statViable: (n: number) => string;
  statNotViable: (n: number) => string;
  formattedAlertTitle: string;
  viewFullJson: string;

  // Pisos de Muestra & En Vivo
  samplePropsTitle: string;
  samplePropsSubtitle: (savings: string) => string;
  sampleProperties: PropertyData[];
  sampleHtmlPayload: string;
  priceLabel: string;
  cuotaLabel: string;
  dtiShortLabel: string;
  upfrontShortLabel: string;
  linkViewProperty: string;

  // Propiedades en Vivo (Gmail & Supabase)
  tabPropsLiveTitle: string;
  tabPropsSubtitleLive: (count: number) => string;
  btnRefreshProperties: string;
  btnRefreshing: string;
  filterAll: string;
  filterViableDirect: string;
  filterBrokerViable: string;
  badgeFromGmail: string;
  badgeDirectViableCard: string;
  badgeBrokerViableCard: (ltv: number) => string;
  brokerSavingsAdvantage: (ltv: number, months: number, upfront: string) => string;
  dbConnectedBadge: string;
  dbMemoryBadge: string;
  noPropertiesYetTitle: string;
  noPropertiesYetDesc: string;
  showingSamplePropsNote: string;
  sourceEmailSubjectPrefix: string;
  tabPropsSubtitleEmpty: string;
  waitingEmailsTitle: string;
  waitingEmailsDesc: string;
  waitingStatusActive: string;
  waitingCriteriaNote: string;
  noPropertiesFiltered: string;

  // Documentación
  docsFiscalTitle: string;
  docsFiscalLtv: string;
  docsFiscalItp: string;
  docsFiscalTotal: string;
  docsFiscalPortfolio: (amount: string) => string;
  docsFiscalCapacity: string;
  docsFormulasTitle: string;
  formulaFrench: string;
  formulaFrenchSub: string;
  formulaFrenchEquation: string;
  formulaDti: string;
  formulaDtiEquation: string;
  formulaSavings: string;
  formulaSavingsSub: string;
  formulaSavingsEquation1: (savings: string) => string;
  formulaSavingsEquation2: string;
  curlExampleTitle: string;

  // Footer
  footerText: string;
}

export const translations: Record<Language, Translations> = {
  es: {
    appTitle: 'PropFinder BCN',
    appSubtitle: 'Recomendador & Filtro Inmobiliario en Barcelona',
    portfolioSavingsLabel: 'Ahorro en cartera:',

    buyerProfileTitle: 'Perfil Financiero Real del Comprador',
    buyerProfileHeading: 'Comprador en Barcelona',
    buyerProfileDescription: 'Ahorro acumulado inicial de {savings}, capacidad fija de 2.500 €/mes y 31.5% de capital inicial en Cataluña.',
    netSalaryLabel: 'Sueldo Neto',
    netSalarySub: 'Base mensual fija',
    monthlySavingsLabel: 'Ahorro Mensual (Día 1)',
    monthlySavingsSub: 'Cobro el día 1 de cada mes',
    accumulatedSavingsLabel: 'Ahorro Ya Acumulado',
    accumulatedSavingsSub: (count) => `${count} cuentas activas`,
    cataloniaCapitalLabel: 'Capital Inicial Cataluña',
    cataloniaCapitalSub: '20% entrada + 11.5% gastos/ITP',
    cataloniaCapitalDownPaymentSub: (dp) => `${dp}% entrada + 11.5% gastos/ITP`,

    portfolioTitle: 'Mi Cartera de Ahorros e Inversiones Actual',
    portfolioDescription: 'Fondos propios acumulados para la entrada y gastos del piso en Barcelona',
    selectedTotalLabel: 'Total Disponible Seleccionado:',
    hideAccounts: 'Ocultar Cuentas',
    showAccounts: 'Ver Desglose',
    liquidTag: 'Líquido',
    investmentTag: 'Inversión',
    accountLabels: {
      'tr-remunerada': 'Cuenta remunerada',
      'revolut-remunerada': 'Cuenta remunerada',
      'sabadell-remunerada': 'Cuenta remunerada',
      'tr-etfs': 'ETFs',
      'bitpanda-criptos': 'Criptos',
    },
    accountNotes: {
      'tr-remunerada': 'Liquidez inmediata de alta remuneración',
      'revolut-remunerada': 'Disponible y remunerada',
      'sabadell-remunerada': 'Cuenta bancaria remunerada disponible',
      'tr-etfs': 'Fondos indexados cotizados',
      'bitpanda-criptos': 'Criptoactivos',
    },

    tabProperties: 'Propiedades disponibles',
    tabSimulator: 'Simulador de Viabilidad',
    tabProfile: 'Perfil & Cartera de Ahorro',
    tabDocs: 'Reglas Fiscales & Fórmulas',

    simParamsTitle: 'Parámetros de Simulación',
    propertyPriceLabel: 'Precio del Inmueble',
    recommendedPriceLabel: (max) => `Recomendado < ${max}`,
    savingsSelectedLabel: 'Ahorro Líquido Seleccionado',
    presetAll: '32.629 € (Todo)',
    presetLiquid: '29.504 € (Líquido)',
    presetTR: '20.450 € (TR)',
    presetZero: '0 €',
    fixedMonthlySavingsLabel: 'Ahorro Mensual Fijo:',
    fixedMonthlySavingsSub: 'Se cobra e ingresa el día 1 de cada mes sin excepción.',
    mortgageTermLabel: 'Plazo Hipoteca',
    interestRateLabel: 'Tipo de Interés (TIN)',
    term20Years: '20 años (240 meses)',
    term25Years: '25 años (300 meses)',
    term30Years: '30 años (360 meses)',
    limitHealthyLabel: 'Tope 33% endeudamiento (Saludable):',
    limitBankLabel: 'Tope 40% endeudamiento (Límite Banco):',
    btnBankLabel: 'Banca',
    btnBrokerLabel: 'Broker',

    financingModeLabel: '% Financiado por la Hipoteca',
    financing80: '80% (Banca Estándar)',
    financing90: '90% (Con Broker)',
    financing95: '95% (Con Broker)',
    financing100: '100% (Broker - Solo Gastos)',
    scenarioComparisonTitle: 'Comparativa de Financiación: 80% vs 90% vs 95% vs 100%',
    scenarioComparisonSubtitle: 'Comprueba cómo cambia tu capital inicial requerido, los meses de ahorro y la cuota mensual si contratas a un broker hipotecario.',
    scenarioTableLtv: '% Financiación Hipotecaria',
    scenarioTableUpfront: 'Capital Inicial (Entrada + ITP)',
    scenarioTableShortfall: 'Faltante (Tras tus 32.629 €)',
    scenarioTableTime: 'Plazo Ahorro (2.500 €/m)',
    scenarioTableMonthly: 'Cuota Francesa',
    scenarioTableDti: 'Esfuerzo DTI',
    scenarioTableViability: 'Veredicto',
    brokerAdvantageBadge: 'Ventaja Broker',
    brokerExplanationText: 'Un broker hipotecario puede conseguir financiación por encima del 80% tradicional (hasta el 90%, 95% o incluso 100% del precio de compra). Aunque la cuota mensual es ligeramente superior, reduce drásticamente la entrada inicial necesaria, permitiéndote comprar tu piso en Barcelona mucho antes con tu ahorro acumulado de 32.629 €.',
    badge100Financing: '100% Financiación',
    badge95Broker: '95% Broker',
    cardDownPaymentDetail: (dp, amount) => `Entrada: ${dp}% (${amount}) + ITP 11.5%`,
    cardTotalUpfrontLabel: 'Capital Inicial Total:',
    cardShortfallLabel: 'Faltante a ahorrar:',
    cardShortfallCovered: '0 € (¡Cubierto!)',
    cardTimeNeededLabel: 'Tiempo necesario:',
    cardBuyNow: '¡Comprar ya!',
    cardFrenchMonthlyLabel: 'Cuota Francesa:',
    cardDtiLabel: 'Esfuerzo DTI:',

    statusViable: 'COMPRA VIABLE',
    statusModerateRisk: 'RIESGO MODERADO / AL LÍMITE',
    statusNotViable: 'NO VIABLE / INASUMIBLE',
    viabilityScoreLabel: 'Score de Viabilidad:',
    frenchPaymentLabel: 'Cuota Amortización Francesa',
    perMonth: '/mes',
    frenchPaymentSub: (years, rate) => `${years} años al ${rate}% TIN`,
    dtiLabel: 'Ratio de Endeudamiento (DTI)',
    dtiSub: 'Máx. recomendado: 33% | Tope: 40%',
    residualIncomeLabel: 'Sueldo Neto Restante',
    residualIncomeSub: 'Tras descontar la cuota de 3.250 €',
    recommendationTitle: 'Recomendación:',

    upfrontBreakdownTitle: 'Desglose de Capital Requerido',
    downPaymentLabel: 'Entrada:',
    itpExpensesLabel: 'ITP y Gastos Cataluña (11.5%):',
    totalUpfrontLabel: 'Aportación Inicial Total:',
    loanAmountLabel: 'Capital Préstamo Hipotecario:',

    savingsPlanTitle: 'Plan de Ahorro (Día 1)',
    currentInPortfolio: 'Ahorro actual en cartera:',
    shortfallLabel: 'Faltante por ahorrar:',
    timeNeededLabel: 'Tiempo de ahorro necesario:',
    timeReadyNow: '¡0 meses (Ahorro completo disponible!)',
    monthsCount: (m) => `${m} meses`,
    targetDateLabel: 'Fecha objetivo estimada:',

    btnHideAmortization: 'Ocultar Cuadro de Amortización',
    btnShowAmortization: 'Ver Cuadro de Amortización Francés (Mes a mes)',
    thMonth: 'Mes',
    thPayment: 'Cuota Constante',
    thPrincipal: 'Capital Amortizado',
    thInterest: 'Intereses',
    thBalance: 'Capital Pendiente',
    rowMonth: (m) => `Mes ${m}`,

    webhookTitle: 'Test del Endpoint HTTP POST /api/webhook',
    webhookSubtitle: 'Envía notificaciones de inmuebles (JSON estructurado o HTML de correos con Cheerio) para evaluar su viabilidad al instante.',
    tabJsonProperties: 'JSON Inmuebles',
    tabHtmlScraping: 'HTML Scraping (Cheerio)',
    requestBodyLabelJson: 'Cuerpo de la petición (JSON)',
    requestBodyLabelHtml: 'Contenido HTML del correo (Cheerio)',
    btnRestoreExample: 'Restaurar ejemplo de Barcelona',
    btnSendWebhook: 'Enviar POST a /api/webhook',
    btnSendingWebhook: 'Procesando en servidor...',
    responseTitle: (status) => `Respuesta del Servidor HTTP ${status}`,
    statReceived: (n) => `Recibidos: ${n}`,
    statViable: (n) => `Viables: ${n}`,
    statNotViable: (n) => `No viables: ${n}`,
    formattedAlertTitle: 'Mensaje formateado generado para alerta:',
    viewFullJson: 'Ver JSON Completo de la Respuesta',

    samplePropsTitle: 'Inmuebles Evaluados en Barcelona',
    samplePropsSubtitle: (savings) => `Análisis instantáneo de cada piso aplicando la fiscalidad de Cataluña (ITP 11.5%), amortización francesa, tu ahorro actual de ${savings} y un ahorro mensual de 2.500 €/mes.`,
    sampleProperties: [
      {
        id: 'bcn-1',
        title: 'Piso luminoso en Vila de Gràcia con balcón',
        price: 245000,
        district: 'Gràcia',
        location: 'Barcelona',
        m2: 68,
        rooms: 2,
        bathrooms: 1,
        url: 'https://idealista.com/inmueble/gracia-balcon',
        description: 'Segunda planta real, techos altos con vigas de madera vista, salón con salida a balcón.',
      },
      {
        id: 'bcn-2',
        title: 'Piso modernista reformado en Eixample Esquerra',
        price: 320000,
        district: 'Eixample',
        location: 'Barcelona',
        m2: 78,
        rooms: 3,
        bathrooms: 1,
        url: 'https://fotocasa.es/es/comprar/eixample-reformado',
        description: 'Finca regia con ascensor, suelos hidráulicos originales restaurados, cocina equipada.',
      },
      {
        id: 'bcn-3',
        title: 'Piso cerca del mar en Poblenou',
        price: 360000,
        district: 'Sant Martí',
        location: 'Barcelona',
        m2: 82,
        rooms: 2,
        bathrooms: 2,
        url: 'https://habitaclia.com/comprar-poblenou',
        description: 'A 5 minutos de la playa del Bogatell, finca seminueva con plaza de parking opcional.',
      },
      {
        id: 'bcn-4',
        title: 'Ático dúplex con gran terraza en Sarrià',
        price: 520000,
        district: 'Sarrià-Sant Gervasi',
        location: 'Barcelona',
        m2: 115,
        rooms: 4,
        bathrooms: 2,
        url: 'https://idealista.com/inmueble/sarria-atico',
        description: 'Vistas panorámicas a Collserola y la ciudad, terraza de 35 m², suite con vestidor.',
      },
    ],
    sampleHtmlPayload: `<div class="email-alert-container">
  <h2>Nuevas oportunidades en Barcelona - Alerta Inmobiliaria</h2>
  <article class="property-card">
    <h3 class="title">Bajos con patio en Sants</h3>
    <p class="details">Precio: 215.000 € - 62 m² - 2 habitaciones - 1 baño</p>
    <a href="https://ejemplo.com/sants-patio">Ver inmueble</a>
  </article>
  <article class="property-card">
    <h3 class="title">Ático con vistas en Fort Pienc</h3>
    <p class="details">Precio: 298.000 € - 70 m² - 2 habitaciones</p>
    <a href="https://ejemplo.com/fort-pienc-atico">Ver inmueble</a>
  </article>
  <article class="property-card">
    <h3 class="title">Piso exclusivo en Passeig de Gràcia</h3>
    <p class="details">Precio: 650.000 € - 110 m² - 3 habitaciones</p>
    <a href="https://ejemplo.com/passeig-gracia">Ver inmueble</a>
  </article>
</div>`,
    priceLabel: 'Precio Venta',
    cuotaLabel: 'Cuota Francesa',
    dtiShortLabel: 'Esfuerzo DTI',
    upfrontShortLabel: 'Aportación necesaria:',
    linkViewProperty: 'Ver inmueble',

    tabPropsLiveTitle: 'Propiedades disponibles (Gmail & Filtro Inmobiliario)',
    tabPropsSubtitleLive: (count) => `Se han registrado ${count} oportunidades viables desde tus alertas automáticas de Gmail en Supabase.`,
    btnRefreshProperties: 'Refrescar',
    btnRefreshing: 'Consultando...',
    filterAll: 'Todos',
    filterViableDirect: 'Viable Directo (80%)',
    filterBrokerViable: 'Viable con Broker (90%-100%)',
    badgeFromGmail: 'Alerta Gmail',
    badgeDirectViableCard: 'COMPRA VIABLE (80%)',
    badgeBrokerViableCard: (ltv) => `VIABLE CON BROKER (${ltv}%)`,
    brokerSavingsAdvantage: (ltv, months, upfront) => `🚀 Broker ${ltv}%: Compra en solo ${months} meses (Aportación reducida a ${upfront})`,
    dbConnectedBadge: 'Base de Datos Permanente (Supabase)',
    dbMemoryBadge: 'Sin BD Permanente (Faltan claves Supabase)',
    noPropertiesYetTitle: 'Aún no se han recibido alertas automáticas de Gmail',
    noPropertiesYetDesc: 'Tan pronto como Idealista o Fotocasa envíen un correo a tu cuenta, el conector evaluará la viabilidad y lo registrará aquí automáticamente.',
    showingSamplePropsNote: 'Mostrando pisos de muestra de Barcelona para referencia:',
    sourceEmailSubjectPrefix: 'Email:',
    tabPropsSubtitleEmpty: 'Espacio preparado para recibir y listar en tiempo real los inmuebles viables de tus alertas de Gmail.',
    waitingEmailsTitle: 'Bandeja lista a la espera de alertas de Gmail',
    waitingEmailsDesc: 'Tu conector está configurado. En cuanto Idealista, Fotocasa o Habitaclia envíen un email y sea clasificado como Viable Directo (80%) o Viable con Broker (90%-100%), se registrará aquí de inmediato.',
    waitingStatusActive: 'Webhook activo y listo para procesar correos',
    waitingCriteriaNote: 'Filtro financiero activo: Solo se guardan inmuebles con DTI asumible (≤33%) que se ajusten a tus 32.629 € de ahorro y 2.500 €/mes.',
    noPropertiesFiltered: 'No hay inmuebles guardados que coincidan con este filtro.',

    docsFiscalTitle: 'Normativa Fiscal y Bancaria (Cataluña)',
    docsFiscalLtv: '20% de Entrada: Límite estándar Loan-To-Value (LTV 80%) aplicado por las entidades bancarias en España para primera residencia.',
    docsFiscalItp: '11.5% ITP y Gastos: En Cataluña, el Impuesto sobre Transmisiones Patrimoniales (ITP) general es del 10%. A esto se suma aproximadamente un 1.5% en concepto de notaría, registro, gestoría y tasación.',
    docsFiscalTotal: 'Aportación Inicial Total: 20% + 11.5% = 31.5% del precio de compraventa del inmueble que el comprador debe disponer como fondos propios.',
    docsFiscalPortfolio: (amount) => `Ahorro acumulado inicial: Se parte de ${amount} en cuentas remuneradas e inversiones (Trade Republic, Revolut, Sabadell, Bitpanda).`,
    docsFiscalCapacity: 'Capacidad de Ahorro: Se acumulan 2.500 € cada mes (cobro el día 1).',
    docsFormulasTitle: 'Fórmulas Matemáticas Implementadas',
    formulaFrench: '1. Amortización Francesa (Cuota Constante):',
    formulaFrenchSub: 'P = Capital prestado, r = TIN anual / 12, n = Años * 12',
    formulaFrenchEquation: 'Cuota = P * [ r * (1 + r)^n ] / [ (1 + r)^n - 1 ]',
    formulaDti: '2. Esfuerzo Financiero (DTI):',
    formulaDtiEquation: 'DTI = Cuota Mensual / 3.250 €',
    formulaSavings: '3. Proyección de Ahorro (Día 1):',
    formulaSavingsSub: 'Cobro programado y capitalizado el día 1 de cada mes',
    formulaSavingsEquation1: (s) => `Faltante = Math.max(0, CapitalRequerido - ${s})`,
    formulaSavingsEquation2: 'Meses = Math.ceil(Faltante / 2.500 €)',
    curlExampleTitle: 'Ejemplo de llamada cURL:',

    footerText: 'PropFinder BCN · Motor Financiero Serverless · Next.js 16 App Router & TypeScript · Barcelona, Cataluña',
  },
  it: {
    appTitle: 'PropFinder BCN',
    appSubtitle: 'Consulente & Filtro Immobiliare a Barcellona',
    portfolioSavingsLabel: 'Risparmio in portafoglio:',

    buyerProfileTitle: 'Profilo Finanziario Reale dell\'Acquirente',
    buyerProfileHeading: 'Acquirente a Barcellona',
    buyerProfileDescription: 'Risparmio accumulato iniziale di {savings}, capacità fissa di 2.500 €/mese e 31,5% di capitale iniziale in Catalogna.',
    netSalaryLabel: 'Stipendio Netto',
    netSalarySub: 'Base mensile fissa',
    monthlySavingsLabel: 'Risparmio Mensile (Giorno 1)',
    monthlySavingsSub: 'Incasso il giorno 1 di ogni mese',
    accumulatedSavingsLabel: 'Risparmio Già Accumulato',
    accumulatedSavingsSub: (count) => `${count} conti attivi`,
    cataloniaCapitalLabel: 'Capitale Iniziale Catalogna',
    cataloniaCapitalSub: '20% acconto + 11,5% spese/ITP',
    cataloniaCapitalDownPaymentSub: (dp) => `${dp}% acconto + 11,5% spese/ITP`,

    portfolioTitle: 'Il Mio Portafoglio di Risparmi e Investimenti Attuale',
    portfolioDescription: 'Fondi propri accumulati per l\'acconto e le spese dell\'immobile a Barcellona',
    selectedTotalLabel: 'Totale Disponibile Selezionato:',
    hideAccounts: 'Nascondi Conti',
    showAccounts: 'Mostra Dettagli',
    liquidTag: 'Liquido',
    investmentTag: 'Investimento',
    accountLabels: {
      'tr-remunerada': 'Conto remunerato',
      'revolut-remunerada': 'Conto remunerato',
      'sabadell-remunerada': 'Conto remunerato',
      'tr-etfs': 'ETF',
      'bitpanda-criptos': 'Criptovalute',
    },
    accountNotes: {
      'tr-remunerada': 'Liquidità immediata ad alto rendimento',
      'revolut-remunerada': 'Disponibile e remunerato',
      'sabadell-remunerada': 'Conto bancario remunerato disponibile',
      'tr-etfs': 'Fondi indicizzati quotati',
      'bitpanda-criptos': 'Criptoattività',
    },

    tabProperties: 'Proprietà disponibili',
    tabSimulator: 'Simulatore di Fattibilità',
    tabProfile: 'Profilo & Portafoglio Risparmi',
    tabDocs: 'Regole Fiscali & Formule',

    simParamsTitle: 'Parametri di Simulazione',
    propertyPriceLabel: 'Prezzo dell\'Immobile',
    recommendedPriceLabel: (max) => `Consigliato < ${max}`,
    savingsSelectedLabel: 'Risparmio Liquido Selezionato',
    presetAll: '32.629 € (Tutto)',
    presetLiquid: '29.504 € (Liquido)',
    presetTR: '20.450 € (TR)',
    presetZero: '0 €',
    fixedMonthlySavingsLabel: 'Risparmio Mensile Fisso:',
    fixedMonthlySavingsSub: 'Accreditato e capitalizzato il giorno 1 di ogni mese senza eccezioni.',
    mortgageTermLabel: 'Durata Mutuo',
    interestRateLabel: 'Tasso di Interesse (TAN)',
    term20Years: '20 anni (240 mesi)',
    term25Years: '25 anni (300 mesi)',
    term30Years: '30 anni (360 mesi)',
    limitHealthyLabel: 'Limite 33% indebitamento (Sano):',
    limitBankLabel: 'Limite 40% indebitamento (Massimo Banca):',
    btnBankLabel: 'Banca',
    btnBrokerLabel: 'Broker',

    financingModeLabel: '% Finanziata dal Mutuo',
    financing80: '80% (Banca Standard)',
    financing90: '90% (Con Broker)',
    financing95: '95% (Con Broker)',
    financing100: '100% (Broker - Solo Spese)',
    scenarioComparisonTitle: 'Confronto Finanziamenti: 80% vs 90% vs 95% vs 100%',
    scenarioComparisonSubtitle: 'Scopri come cambiano il capitale iniziale necessario, i mesi di risparmio e la rata mensile se ti affidi a un broker per ottenere fino al 100%.',
    scenarioTableLtv: '% Finanziamento Mutuo',
    scenarioTableUpfront: 'Capitale Iniziale (Acconto + ITP)',
    scenarioTableShortfall: 'Mancante (Dopo i tuoi 32.629 €)',
    scenarioTableTime: 'Tempo Risparmio (2.500 €/m)',
    scenarioTableMonthly: 'Rata Francese',
    scenarioTableDti: 'Sforzo DTI',
    scenarioTableViability: 'Verdetto',
    brokerAdvantageBadge: 'Vantaggio Broker',
    brokerExplanationText: 'Un broker creditizio può ottenere finanziamenti superiori al tradizionale 80% (fino al 90%, 95% o persino 100% del prezzo di compravendita). Anche se la rata mensile aumenta leggermente, riduce drasticamente l\'acconto iniziale necessario, consentendoti di acquistare il tuo appartamento a Barcellona molto prima con il tuo risparmio già accumulato di 32.629 €.',
    badge100Financing: '100% Finanziamento',
    badge95Broker: '95% Broker',
    cardDownPaymentDetail: (dp, amount) => `Acconto: ${dp}% (${amount}) + ITP 11,5%`,
    cardTotalUpfrontLabel: 'Capitale Iniziale Totale:',
    cardShortfallLabel: 'Mancante da risparmiare:',
    cardShortfallCovered: '0 € (Coperto!)',
    cardTimeNeededLabel: 'Tempo necessario:',
    cardBuyNow: '¡Acquisto immediato!',
    cardFrenchMonthlyLabel: 'Rata Francese:',
    cardDtiLabel: 'Sforzo DTI:',

    statusViable: 'ACQUISTO FATTIBILE',
    statusModerateRisk: 'RISCHIO MODERATO / AL LIMITE',
    statusNotViable: 'NON FATTIBILE / INSOSTENIBILE',
    viabilityScoreLabel: 'Punteggio di Fattibilità:',
    frenchPaymentLabel: 'Rata Ammortamento Francese',
    perMonth: '/mese',
    frenchPaymentSub: (years, rate) => `${years} anni al ${rate}% TAN`,
    dtiLabel: 'Tasso di Indebitamento (DTI)',
    dtiSub: 'Max raccomandato: 33% | Tetto banca: 40%',
    residualIncomeLabel: 'Stipendio Netto Residuo',
    residualIncomeSub: 'Dopo aver detratto la rata da 3.250 €',
    recommendationTitle: 'Raccomandazione:',

    upfrontBreakdownTitle: 'Dettaglio Capitale Richiesto',
    downPaymentLabel: 'Acconto iniziale:',
    itpExpensesLabel: 'ITP e Spese Catalogna (11,5%):',
    totalUpfrontLabel: 'Aporto Iniziale Totale:',
    loanAmountLabel: 'Capitale Mutuo Ipotecario:',

    savingsPlanTitle: 'Piano di Risparmio (Giorno 1)',
    currentInPortfolio: 'Risparmio attuale in portafoglio:',
    shortfallLabel: 'Mancante da risparmiare:',
    timeNeededLabel: 'Tempo di risparmio necessario:',
    timeReadyNow: '¡0 mesi (Risparmio completo disponibile!)',
    monthsCount: (m) => `${m} mesi`,
    targetDateLabel: 'Data obiettivo stimata:',

    btnHideAmortization: 'Nascondi Tabella di Ammortamento',
    btnShowAmortization: 'Mostra Tabella di Ammortamento Francese (Mese per mese)',
    thMonth: 'Mese',
    thPayment: 'Rata Costante',
    thPrincipal: 'Quota Capitale',
    thInterest: 'Quota Interessi',
    thBalance: 'Debito Residuo',
    rowMonth: (m) => `Mese ${m}`,

    webhookTitle: 'Test dell\'Endpoint HTTP POST /api/webhook',
    webhookSubtitle: 'Invia notifiche di annunci immobiliari (JSON strutturato o HTML da email con Cheerio) per valutarne all\'istante la fattibilità.',
    tabJsonProperties: 'JSON Immobili',
    tabHtmlScraping: 'HTML Scraping (Cheerio)',
    requestBodyLabelJson: 'Corpo della richiesta (JSON)',
    requestBodyLabelHtml: 'Contenuto HTML dell\'email (Cheerio)',
    btnRestoreExample: 'Ripristina esempio di Barcellona',
    btnSendWebhook: 'Invia POST a /api/webhook',
    btnSendingWebhook: 'Elaborazione sul server...',
    responseTitle: (status) => `Risposta del Server HTTP ${status}`,
    statReceived: (n) => `Ricevuti: ${n}`,
    statViable: (n) => `Fattibili: ${n}`,
    statNotViable: (n) => `Non fattibili: ${n}`,
    formattedAlertTitle: 'Messaggio formattato generato per l\'avviso:',
    viewFullJson: 'Visualizza JSON Completo della Risposta',

    samplePropsTitle: 'Immobili Valutati a Barcellona',
    samplePropsSubtitle: (savings) => `Analisi istantanea di ciascun appartamento applicando la fiscalità della Catalogna (ITP 11,5%), ammortamento francese, il tuo risparmio attuale di ${savings} e un risparmio mensile di 2.500 €/mese.`,
    sampleProperties: [
      {
        id: 'bcn-1',
        title: 'Appartamento luminoso a Vila de Gràcia con balcone',
        price: 245000,
        district: 'Gràcia',
        location: 'Barcelona',
        m2: 68,
        rooms: 2,
        bathrooms: 1,
        url: 'https://idealista.com/inmueble/gracia-balcon',
        description: 'Secondo piano reale, soffitti alti con travi in legno a vista, soggiorno con accesso al balcone.',
      },
      {
        id: 'bcn-2',
        title: 'Appartamento modernista ristrutturato a Eixample Esquerra',
        price: 320000,
        district: 'Eixample',
        location: 'Barcelona',
        m2: 78,
        rooms: 3,
        bathrooms: 1,
        url: 'https://fotocasa.es/es/comprar/eixample-reformado',
        description: 'Palazzo d\'epoca con ascensore, pavimenti idraulici d\'epoca restaurati, cucina attrezzata.',
      },
      {
        id: 'bcn-3',
        title: 'Appartamento vicino al mare a Poblenou',
        price: 360000,
        district: 'Sant Martí',
        location: 'Barcelona',
        m2: 82,
        rooms: 2,
        bathrooms: 2,
        url: 'https://habitaclia.com/comprar-poblenou',
        description: 'A 5 minuti dalla spiaggia del Bogatell, condominio recente con posto auto opzionale.',
      },
      {
        id: 'bcn-4',
        title: 'Attico duplex con grande terrazza a Sarrià',
        price: 520000,
        district: 'Sarrià-Sant Gervasi',
        location: 'Barcelona',
        m2: 115,
        rooms: 4,
        bathrooms: 2,
        url: 'https://idealista.com/inmueble/sarria-atico',
        description: 'Vista panoramica su Collserola e sulla città, terrazza di 35 m², suite con cabina armadio.',
      },
    ],
    sampleHtmlPayload: `<div class="email-alert-container">
  <h2>Nuove opportunità a Barcellona - Avviso Immobiliare</h2>
  <article class="property-card">
    <h3 class="title">Piano terra con patio a Sants</h3>
    <p class="details">Prezzo: 215.000 € - 62 m² - 2 camere - 1 bagno</p>
    <a href="https://esempio.com/sants-patio">Vedi immobile</a>
  </article>
  <article class="property-card">
    <h3 class="title">Attico con vista a Fort Pienc</h3>
    <p class="details">Prezzo: 298.000 € - 70 m² - 2 camere</p>
    <a href="https://esempio.com/fort-pienc-attico">Vedi immobile</a>
  </article>
  <article class="property-card">
    <h3 class="title">Appartamento esclusivo in Passeig de Gràcia</h3>
    <p class="details">Prezzo: 650.000 € - 110 m² - 3 camere</p>
    <a href="https://esempio.com/passeig-gracia">Vedi immobile</a>
  </article>
</div>`,
    priceLabel: 'Prezzo di Vendita',
    cuotaLabel: 'Rata Francese',
    dtiShortLabel: 'Sforzo DTI',
    upfrontShortLabel: 'Aporto necessario:',
    linkViewProperty: 'Vedi immobile',

    tabPropsLiveTitle: 'Proprietà disponibili (Gmail & Filtro Immobiliare)',
    tabPropsSubtitleLive: (count) => `Registrate ${count} opportunità fattibili dai tuoi avvisi automatici Gmail su Supabase.`,
    btnRefreshProperties: 'Aggiorna',
    btnRefreshing: 'Verifica in corso...',
    filterAll: 'Tutti',
    filterViableDirect: 'Fattibile Diretto (80%)',
    filterBrokerViable: 'Fattibile con Broker (90%-100%)',
    badgeFromGmail: 'Avviso Gmail',
    badgeDirectViableCard: 'ACQUISTO FATTIBILE (80%)',
    badgeBrokerViableCard: (ltv) => `FATTIBILE CON BROKER (${ltv}%)`,
    brokerSavingsAdvantage: (ltv, months, upfront) => `🚀 Broker ${ltv}%: Acquisto in soli ${months} mesi (Anticipo ridotto a ${upfront})`,
    dbConnectedBadge: 'Database Permanente (Supabase)',
    dbMemoryBadge: 'Senza DB Permanente (Chiavi Supabase mancanti)',
    noPropertiesYetTitle: 'Nessun avviso ancora registrato automaticamente da Gmail',
    noPropertiesYetDesc: 'Non appena Idealista o Fotocasa invieranno una notifica alla tua email, il connettore ne valuterà la fattibilità e la registrerà qui automaticamente.',
    showingSamplePropsNote: 'Mostrando immobili di esempio a Barcellona come riferimento:',
    sourceEmailSubjectPrefix: 'Email:',
    tabPropsSubtitleEmpty: 'Spazio predisposto per ricevere ed elencare in tempo reale gli immobili fattibili dai tuoi avvisi Gmail.',
    waitingEmailsTitle: 'Casella pronta in attesa di avvisi da Gmail',
    waitingEmailsDesc: 'Il tuo connettore è configurato. Non appena Idealista, Fotocasa o Habitaclia inviano un\'email classificata come Fattibile Diretto (80%) o con Broker (90%-100%), verrà registrata qui immediatamente.',
    waitingStatusActive: 'Webhook attivo e pronto a processare le email',
    waitingCriteriaNote: 'Filtro finanziario attivo: Vengono salvati solo gli immobili con DTI sostenibile (≤33%) compatibili con i tuoi 32.629 € di risparmio e 2.500 €/mese.',
    noPropertiesFiltered: 'Nessun immobile salvato corrisponde a questo filtro.',

    docsFiscalTitle: 'Normativa Fiscale e Bancaria (Catalogna)',
    docsFiscalLtv: '20% di Acconto: Limite standard Loan-To-Value (LTV 80%) applicato dagli istituti bancari in Spagna per la prima casa.',
    docsFiscalItp: '11,5% ITP e Spese: In Catalogna, l\'Imposta sui Passaggi Patrimoniali (ITP) generale è del 10%. A questo si aggiunge circa l\'1,5% tra notaio, registro, agenzia e perizia ufficiale.',
    docsFiscalTotal: 'Aporto Iniziale Totale: 20% + 11,5% = 31,5% del prezzo di compravendita che l\'acquirente deve disporre come fondi propri.',
    docsFiscalPortfolio: (amount) => `Risparmio iniziale accumulato: Si parte da ${amount} in conti remunerati e investimenti (Trade Republic, Revolut, Sabadell, Bitpanda).`,
    docsFiscalCapacity: 'Capacità di Risparmio: Si accumulano 2.500 € ogni mese (con incasso il giorno 1).',
    docsFormulasTitle: 'Formule Matematiche Implementate',
    formulaFrench: '1. Ammortamento Francese (Rata Costante):',
    formulaFrenchSub: 'P = Capitale finanziato, r = TAN annuale / 12, n = Anni * 12',
    formulaFrenchEquation: 'Rata = P * [ r * (1 + r)^n ] / [ (1 + r)^n - 1 ]',
    formulaDti: '2. Tasso di Indebitamento (DTI):',
    formulaDtiEquation: 'DTI = Rata Mensile / 3.250 €',
    formulaSavings: '3. Proiezione di Risparmio (Giorno 1):',
    formulaSavingsSub: 'Incasso pianificato e capitalizzato il primo giorno di ogni mese',
    formulaSavingsEquation1: (s) => `Mancante = Math.max(0, CapitaleRichiesto - ${s})`,
    formulaSavingsEquation2: 'Mesi = Math.ceil(Mancante / 2.500 €)',
    curlExampleTitle: 'Esempio di chiamata cURL:',

    footerText: 'PropFinder BCN · Motore Finanziario Serverless · Next.js 16 App Router & TypeScript · Barcellona, Catalogna',
  },
};
