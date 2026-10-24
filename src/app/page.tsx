"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
  DEFAULT_BUYER_PROFILE,
  DEFAULT_SAVINGS_PORTFOLIO,
  TOTAL_INITIAL_SAVINGS,
  evaluatePropertyViability,
  calculateMaxAffordablePropertyPrice,
  calculateFinancingScenarios,
  generateAmortizationSchedule,
  FinancialViabilityReport,
  SavingsAccountItem,
} from '@/lib/financial-engine';
import { translations, Language } from '@/lib/i18n';
import { SavedPropertyRecord } from '@/lib/supabase';

export default function Home() {
  // Idioma activo: Español (es) o Italiano (it)
  const [lang, setLang] = useState<Language>('es');
  const t = translations[lang];

  // Estado del simulador interactivo
  const [propertyPrice, setPropertyPrice] = useState<number>(275000);
  const [financingLtv, setFinancingLtv] = useState<number>(80); // 80%, 90%, 95%, 100%
  
  // Estado de la cartera real de ahorro
  const [savingsPortfolio] = useState<SavingsAccountItem[]>(DEFAULT_SAVINGS_PORTFOLIO);
  const [activeAccountIds, setActiveAccountIds] = useState<string[]>(
    DEFAULT_SAVINGS_PORTFOLIO.map((acc) => acc.id)
  );

  // Ahorro actual calculado a partir de las cuentas seleccionadas (por defecto 32.629 €)
  const currentSavings = useMemo(() => {
    return savingsPortfolio
      .filter((acc) => activeAccountIds.includes(acc.id))
      .reduce((sum, acc) => sum + acc.amount, 0);
  }, [savingsPortfolio, activeAccountIds]);

  const monthlySavings = 2500; // Capacidad de ahorro mensual fijada en 2.500 €
  const [loanTermYears, setLoanTermYears] = useState<number>(30);
  const [interestRate, setInterestRate] = useState<number>(2.8);
  const [showAmortizationTable, setShowAmortizationTable] = useState<boolean>(false);
  const [showPortfolioDetails, setShowPortfolioDetails] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState<'simulator' | 'properties' | 'docs'>('simulator');

  // Estado de pisos guardados en Supabase / Almacén (alertas de Gmail)
  const [liveProperties, setLiveProperties] = useState<SavedPropertyRecord[]>([]);
  const [loadingLiveProps, setLoadingLiveProps] = useState<boolean>(false);
  const [livePropsFilter, setLivePropsFilter] = useState<'all' | 'viable' | 'broker_viable'>('all');
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);

  const fetchLiveProperties = async () => {
    setLoadingLiveProps(true);
    try {
      const res = await fetch('/api/properties');
      const data = await res.json();
      if (data.success && Array.isArray(data.properties)) {
        setLiveProperties(data.properties);
        setSupabaseConnected(Boolean(data.isSupabaseConnected));
      }
    } catch (err) {
      console.warn('Error fetching live properties:', err);
    } finally {
      setLoadingLiveProps(false);
    }
  };

  useEffect(() => {
    fetchLiveProperties();
  }, []);

  // Función para alternar el idioma
  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
  };

  // Toggle de cuentas para incluir/excluir de la entrada
  const toggleAccount = (id: string) => {
    setActiveAccountIds((prev) =>
      prev.includes(id) ? prev.filter((accId) => accId !== id) : [...prev, id]
    );
  };

  // Cálculos dinámicos del motor financiero en tiempo real según el LTV seleccionado
  const currentEvaluation: FinancialViabilityReport = useMemo(() => {
    return evaluatePropertyViability(
      {
        title: `Simulación (${propertyPrice.toLocaleString(lang === 'it' ? 'it-IT' : 'es-ES')} €)`,
        price: propertyPrice,
        location: 'Barcelona',
        district: 'Barcelona Capital',
      },
      {
        currentSavings,
        monthlySavingsCapacity: monthlySavings,
      },
      {
        loanTermYears,
        annualInterestRate: interestRate / 100,
        financingPercent: financingLtv,
      },
      lang
    );
  }, [propertyPrice, currentSavings, monthlySavings, loanTermYears, interestRate, financingLtv, lang]);

  // Comparador de los 4 escenarios de financiación (80%, 90%, 95%, 100%)
  const financingScenarios = useMemo(() => {
    return calculateFinancingScenarios(
      propertyPrice,
      { currentSavings, monthlySavingsCapacity: monthlySavings },
      { loanTermYears, annualInterestRate: interestRate / 100 },
      lang
    );
  }, [propertyPrice, currentSavings, monthlySavings, loanTermYears, interestRate, lang]);

  // Cuadro de amortización francés
  const amortizationSchedule = useMemo(() => {
    if (!showAmortizationTable) return [];
    return generateAmortizationSchedule(
      currentEvaluation.loanAmount,
      interestRate / 100,
      loanTermYears,
      12 // Primer año mes a mes
    );
  }, [currentEvaluation.loanAmount, interestRate, loanTermYears, showAmortizationTable]);

  // Precios máximos según límites de esfuerzo
  const limits = useMemo(() => {
    const downPaymentPercent = Math.max(0, 100 - financingLtv);
    const rec = calculateMaxAffordablePropertyPrice(
      { ...DEFAULT_BUYER_PROFILE, monthlySavingsCapacity: monthlySavings, currentSavings },
      { loanTermYears, annualInterestRate: interestRate / 100, downPaymentPercent },
      0.33
    );
    const hard = calculateMaxAffordablePropertyPrice(
      { ...DEFAULT_BUYER_PROFILE, monthlySavingsCapacity: monthlySavings, currentSavings },
      { loanTermYears, annualInterestRate: interestRate / 100, downPaymentPercent },
      0.40
    );
    return { rec, hard };
  }, [monthlySavings, currentSavings, loanTermYears, interestRate, financingLtv]);

  const numberLocale = lang === 'it' ? 'it-IT' : 'es-ES';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header / Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-slate-950 shadow-lg shadow-emerald-500/20">
              <svg className="w-6 h-6 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  {t.appTitle}
                </span>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                  {t.badgeServerless}
                </span>
              </div>
              <p className="text-xs text-slate-400">{t.appSubtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Selector de Idioma ES / IT */}
            <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-xl shadow-inner">
              <button
                onClick={() => handleLanguageChange('es')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                  lang === 'es'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🇪🇸</span>
                <span>ES</span>
              </button>
              <button
                onClick={() => handleLanguageChange('it')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                  lang === 'it'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🇮🇹</span>
                <span>IT</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-slate-400">{t.portfolioSavingsLabel}</span>
              <span className="font-bold text-emerald-400">{currentSavings.toLocaleString(numberLocale)} €</span>
            </div>
            <a
              href={`/api/webhook?lang=${lang}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              GET /api/webhook
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner Perfil de Comprador */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-850 border border-slate-800 p-6 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-center">
            <div className="lg:col-span-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">
                {t.buyerProfileTitle}
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
                {t.buyerProfileHeading}
              </h1>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {t.buyerProfileDescription.replace('{savings}', `${currentSavings.toLocaleString(numberLocale)} €`)}
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
              <div className="text-xs text-slate-400">{t.netSalaryLabel}</div>
              <div className="text-xl font-bold text-white mt-0.5">3.250 €</div>
              <div className="text-[11px] text-slate-500">{t.netSalarySub}</div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
              <div className="text-xs text-slate-400">{t.monthlySavingsLabel}</div>
              <div className="text-xl font-bold text-emerald-400 mt-0.5">{monthlySavings.toLocaleString(numberLocale)} €</div>
              <div className="text-[11px] text-emerald-500/80">{t.monthlySavingsSub}</div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 ring-1 ring-emerald-500/30">
              <div className="text-xs text-slate-400">{t.accumulatedSavingsLabel}</div>
              <div className="text-xl font-bold text-emerald-300 mt-0.5">
                {currentSavings.toLocaleString(numberLocale)} €
              </div>
              <div className="text-[11px] text-emerald-400/80">
                {t.accumulatedSavingsSub(activeAccountIds.length)}
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
              <div className="text-xs text-slate-400">{t.cataloniaCapitalLabel}</div>
              <div className="text-xl font-bold text-amber-400 mt-0.5">
                {financingLtv === 80
                  ? '31.5%'
                  : financingLtv === 90
                  ? '21.5%'
                  : financingLtv === 95
                  ? '16.5%'
                  : '11.5%'}
              </div>
              <div className="text-[11px] text-slate-500">
                {t.cataloniaCapitalDownPaymentSub(100 - financingLtv)}
              </div>
            </div>
          </div>
        </section>

        {/* Tarjeta Visual de Desglose de la Cartera Actual (Foto del Usuario) */}
        <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <div>
                <h2 className="text-sm font-bold text-white">{t.portfolioTitle}</h2>
                <p className="text-xs text-slate-400">{t.portfolioDescription}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[11px] text-slate-400">{t.selectedTotalLabel}</div>
                <div className="text-lg font-black text-emerald-400">{currentSavings.toLocaleString(numberLocale)} €</div>
              </div>
              <button
                onClick={() => setShowPortfolioDetails(!showPortfolioDetails)}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
              >
                {showPortfolioDetails ? t.hideAccounts : t.showAccounts}
              </button>
            </div>
          </div>

          {showPortfolioDetails && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
              {savingsPortfolio.map((acc) => {
                const isChecked = activeAccountIds.includes(acc.id);
                const localizedLabel = t.accountLabels[acc.id] || acc.label;
                return (
                  <div
                    key={acc.id}
                    onClick={() => toggleAccount(acc.id)}
                    className={`cursor-pointer rounded-xl border p-3.5 transition-all flex flex-col justify-between select-none ${
                      isChecked
                        ? 'bg-slate-950/80 border-emerald-500/40 shadow-sm shadow-emerald-500/5'
                        : 'bg-slate-950/30 border-slate-800/60 opacity-60 hover:opacity-90'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                          {acc.institution}
                        </span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="accent-emerald-500 rounded cursor-pointer"
                        />
                      </div>
                      <div className="text-xs text-slate-400 mt-1 capitalize">{localizedLabel}</div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-baseline justify-between">
                      <span className="text-base font-extrabold text-white">
                        {acc.amount.toLocaleString(numberLocale)} €
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {acc.category === 'cuenta_remunerada'
                          ? t.liquidTag
                          : t.investmentTag}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 gap-2">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'simulator'
                ? 'border-emerald-500 text-emerald-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            {t.tabSimulator}
          </button>

          <button
            onClick={() => setActiveTab('properties')}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'properties'
                ? 'border-emerald-500 text-emerald-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            {t.tabProperties}
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'docs'
                ? 'border-emerald-500 text-emerald-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t.tabDocs}
          </button>
        </div>

        {/* TAB 1: SIMULADOR DE VIABILIDAD */}
        {activeTab === 'simulator' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Controles de Entrada */}
              <div className="lg:col-span-5 space-y-6 bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  {t.simParamsTitle}
                </h2>

                {/* Slider Precio */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-slate-300">{t.propertyPriceLabel}</label>
                    <span className="text-base font-bold text-white bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
                      {propertyPrice.toLocaleString(numberLocale)} €
                    </span>
                  </div>
                  <input
                    type="range"
                    min="120000"
                    max="600000"
                    step="5000"
                    value={propertyPrice}
                    onChange={(e) => setPropertyPrice(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>120.000 €</span>
                    <span className="text-emerald-400 font-medium">
                      {t.recommendedPriceLabel(`${limits.rec.maxPropertyPrice.toLocaleString(numberLocale)} €`)}
                    </span>
                    <span>600.000 €</span>
                  </div>
                </div>

                {/* Selector de Financiación LTV (80% vs 90% vs 95% vs 100% Broker) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 flex items-center justify-between">
                    <span>{t.financingModeLabel}</span>
                    {financingLtv > 80 && (
                      <span className="text-[10px] uppercase font-bold text-teal-300 bg-teal-500/20 px-2 py-0.5 rounded border border-teal-500/30">
                        {t.brokerAdvantageBadge}
                      </span>
                    )}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[80, 90, 95, 100].map((ltv) => (
                      <button
                        key={ltv}
                        onClick={() => setFinancingLtv(ltv)}
                        className={`text-xs py-2 rounded-xl border font-bold transition-all flex flex-col items-center justify-center cursor-pointer ${
                          financingLtv === ltv
                            ? 'bg-gradient-to-b from-emerald-500/30 to-emerald-600/20 text-emerald-300 border-emerald-500 shadow-md shadow-emerald-500/10'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-white'
                        }`}
                      >
                        <span className="text-sm">{ltv}%</span>
                        <span className="text-[10px] font-normal text-slate-400">
                          {ltv === 80 ? t.btnBankLabel : t.btnBrokerLabel}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ahorro Actual y Botones Preset */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-slate-300">{t.savingsSelectedLabel}</label>
                    <span className="text-sm font-semibold text-emerald-400">
                      {currentSavings.toLocaleString(numberLocale)} €
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => setActiveAccountIds(savingsPortfolio.map((acc) => acc.id))}
                      className={`text-xs py-1.5 rounded-lg border font-medium transition-colors cursor-pointer ${
                        activeAccountIds.length === savingsPortfolio.length
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      {t.presetAll}
                    </button>
                    <button
                      onClick={() =>
                        setActiveAccountIds(
                          savingsPortfolio
                            .filter((acc) => acc.category === 'cuenta_remunerada')
                            .map((acc) => acc.id)
                        )
                      }
                      className="text-xs py-1.5 rounded-lg border font-medium bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-800 cursor-pointer"
                    >
                      {t.presetLiquid}
                    </button>
                    <button
                      onClick={() => setActiveAccountIds(['tr-remunerada'])}
                      className="text-xs py-1.5 rounded-lg border font-medium bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-800 cursor-pointer"
                    >
                      {t.presetTR}
                    </button>
                    <button
                      onClick={() => setActiveAccountIds([])}
                      className="text-xs py-1.5 rounded-lg border font-medium bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-800 cursor-pointer"
                    >
                      {t.presetZero}
                    </button>
                  </div>
                </div>

                {/* Capacidad de Ahorro Mensual Fija */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">{t.fixedMonthlySavingsLabel}</span>
                    <span className="font-bold text-emerald-400 text-sm">{monthlySavings.toLocaleString(numberLocale)} € {t.perMonth}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    {t.fixedMonthlySavingsSub}
                  </p>
                </div>

                {/* Plazo e Interés Hipotecario */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">{t.mortgageTermLabel}</label>
                    <select
                      value={loanTermYears}
                      onChange={(e) => setLoanTermYears(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value={20}>{t.term20Years}</option>
                      <option value={25}>{t.term25Years}</option>
                      <option value={30}>{t.term30Years}</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">{t.interestRateLabel}</label>
                    <input
                      type="number"
                      step="0.05"
                      value={interestRate}
                      onChange={(e) => setInterestRate(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Quick Summary Pill */}
                <div className="border border-slate-800 bg-slate-950/40 rounded-xl p-4 text-xs space-y-2 text-slate-400">
                  <div className="flex justify-between">
                    <span>{t.limitHealthyLabel}</span>
                    <span className="font-semibold text-emerald-400">{limits.rec.maxPropertyPrice.toLocaleString(numberLocale)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.limitBankLabel}</span>
                    <span className="font-semibold text-amber-400">{limits.hard.maxPropertyPrice.toLocaleString(numberLocale)} €</span>
                  </div>
                </div>
              </div>

              {/* Resultados y Veredicto */}
              <div className="lg:col-span-7 space-y-6">
                {/* Tarjeta de Veredicto Principal */}
                <div
                  className={`rounded-2xl border p-6 shadow-xl transition-all ${
                    currentEvaluation.status === 'VIABLE'
                      ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500/40 shadow-emerald-500/5'
                      : currentEvaluation.status === 'MODERATE_RISK'
                      ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/40 shadow-amber-500/5'
                      : 'bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 border-rose-500/40 shadow-rose-500/5'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-3.5 h-3.5 rounded-full ${
                          currentEvaluation.status === 'VIABLE'
                            ? 'bg-emerald-400 animate-pulse'
                            : currentEvaluation.status === 'MODERATE_RISK'
                            ? 'bg-amber-400 animate-pulse'
                            : 'bg-rose-500'
                        }`}
                      ></span>
                      <span
                        className={`text-sm uppercase tracking-wider font-extrabold ${
                          currentEvaluation.status === 'VIABLE'
                            ? 'text-emerald-400'
                            : currentEvaluation.status === 'MODERATE_RISK'
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {currentEvaluation.status === 'VIABLE'
                          ? t.statusViable
                          : currentEvaluation.status === 'MODERATE_RISK'
                          ? t.statusModerateRisk
                          : t.statusNotViable}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{t.viabilityScoreLabel}</span>
                      <span className="text-sm font-extrabold text-white bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
                        {currentEvaluation.score} / 100
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                    {/* Cuota */}
                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
                      <div className="text-xs text-slate-400">{t.frenchPaymentLabel}</div>
                      <div className="text-2xl font-black text-white mt-1">
                        {currentEvaluation.monthlyMortgagePayment.toLocaleString(numberLocale)} €
                        <span className="text-xs font-normal text-slate-400">{t.perMonth}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {t.frenchPaymentSub(currentEvaluation.mortgageConfig.loanTermYears, currentEvaluation.annualInterestRatePercent)}
                      </div>
                    </div>

                    {/* Ratio DTI */}
                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
                      <div className="text-xs text-slate-400">{t.dtiLabel}</div>
                      <div
                        className={`text-2xl font-black mt-1 ${
                          currentEvaluation.dtiPercent <= 33
                            ? 'text-emerald-400'
                            : currentEvaluation.dtiPercent <= 40
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {currentEvaluation.dtiPercent}%
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {t.dtiSub}
                      </div>
                    </div>

                    {/* Saldo Restante */}
                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
                      <div className="text-xs text-slate-400">{t.residualIncomeLabel}</div>
                      <div className="text-2xl font-black text-slate-200 mt-1">
                        {currentEvaluation.residualNetIncome.toLocaleString(numberLocale)} €
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {t.residualIncomeSub}
                      </div>
                    </div>
                  </div>

                  {/* Explicación y Recomendación */}
                  <div className="mt-5 text-sm bg-slate-950/50 border border-slate-800/60 rounded-xl p-4 space-y-2">
                    <p className="text-slate-300 leading-relaxed font-medium">
                      {currentEvaluation.summary}
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      💡 <strong className="text-slate-200">{t.recommendationTitle}</strong> {currentEvaluation.recommendation}
                    </p>
                  </div>
                </div>

                {/* Desglose de Gastos en Cataluña y Aportación Inicial */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-3">
                    <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                      {t.upfrontBreakdownTitle} ({100 - financingLtv + 11.5}%)
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">{t.downPaymentLabel} ({100 - financingLtv}%):</span>
                        <span className="font-semibold text-white">
                          {currentEvaluation.downPaymentAmount.toLocaleString(numberLocale)} €
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">{t.itpExpensesLabel}:</span>
                        <span className="font-semibold text-amber-300">
                          {currentEvaluation.itpAndExpensesAmount.toLocaleString(numberLocale)} €
                        </span>
                      </div>
                      <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-sm">
                        <span className="text-slate-200">{t.totalUpfrontLabel}:</span>
                        <span className="text-emerald-400">
                          {currentEvaluation.totalUpfrontRequired.toLocaleString(numberLocale)} €
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400 pt-1">
                        <span>{t.loanAmountLabel} ({financingLtv}%):</span>
                        <span className="text-slate-200 font-medium">
                          {currentEvaluation.loanAmount.toLocaleString(numberLocale)} €
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Plan de Ahorro con Cobro el Día 1 */}
                  <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-3">
                    <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between">
                      <span>{t.savingsPlanTitle}</span>
                      <span className="text-emerald-400 font-semibold lowercase">
                        {monthlySavings.toLocaleString(numberLocale)} € {t.perMonth}
                      </span>
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">{t.currentInPortfolio}</span>
                        <span className="font-semibold text-emerald-300">
                          {currentEvaluation.savingsTimeline.currentSavings.toLocaleString(numberLocale)} €
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">{t.shortfallLabel}</span>
                        <span className="font-semibold text-amber-400">
                          {currentEvaluation.savingsTimeline.shortfall.toLocaleString(numberLocale)} €
                        </span>
                      </div>
                      <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-sm">
                        <span className="text-slate-200">{t.timeNeededLabel}</span>
                        <span className="text-emerald-400">
                          {currentEvaluation.savingsTimeline.isReadyNow
                            ? t.timeReadyNow
                            : t.monthsCount(currentEvaluation.savingsTimeline.monthsNeeded)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400 pt-1">
                        <span>{t.targetDateLabel}</span>
                        <span className="text-white font-medium">
                          {currentEvaluation.savingsTimeline.targetDateFormatted}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botón para alternar Cuadro de Amortización Francés */}
                <div className="pt-2">
                  <button
                    onClick={() => setShowAmortizationTable(!showAmortizationTable)}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-xs font-semibold text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {showAmortizationTable ? t.btnHideAmortization : t.btnShowAmortization}
                  </button>

                  {showAmortizationTable && (
                    <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-900 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                          <tr>
                            <th className="p-3">{t.thMonth}</th>
                            <th className="p-3">{t.thPayment}</th>
                            <th className="p-3">{t.thPrincipal}</th>
                            <th className="p-3">{t.thInterest}</th>
                            <th className="p-3">{t.thBalance}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                          {amortizationSchedule.map((row) => (
                            <tr key={row.month} className="hover:bg-slate-900/40">
                              <td className="p-3 font-sans font-bold text-slate-200">{t.rowMonth(row.month)}</td>
                              <td className="p-3 text-emerald-400 font-semibold">{row.payment.toLocaleString(numberLocale)} €</td>
                              <td className="p-3 text-slate-300">{row.principalPaid.toLocaleString(numberLocale)} €</td>
                              <td className="p-3 text-amber-400">{row.interestPaid.toLocaleString(numberLocale)} €</td>
                              <td className="p-3 text-slate-400">{row.remainingBalance.toLocaleString(numberLocale)} €</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SECCIÓN COMPARATIVA: 80% VS 90% VS 95% VS 100% FINANCIACIÓN CON BROKER */}
            <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span>
                    <h3 className="text-base font-extrabold text-white">
                      {t.scenarioComparisonTitle}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
                    {t.scenarioComparisonSubtitle}
                  </p>
                </div>
                <div className="text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                  {t.propertyPriceLabel}: <strong className="text-white">{propertyPrice.toLocaleString(numberLocale)} €</strong>
                </div>
              </div>

              {/* Grid de Escenarios */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                {financingScenarios.map((sc) => {
                  const isCurrentSelected = financingLtv === sc.ltvPercent;
                  return (
                    <div
                      key={sc.ltvPercent}
                      onClick={() => setFinancingLtv(sc.ltvPercent)}
                      className={`cursor-pointer rounded-2xl border p-4 transition-all flex flex-col justify-between space-y-3 relative ${
                        isCurrentSelected
                          ? 'bg-slate-900 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {sc.ltvPercent === 100 && (
                        <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 shadow">
                          {t.badge100Financing}
                        </span>
                      )}
                      {sc.ltvPercent === 95 && (
                        <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-teal-500/20 text-teal-300 border border-teal-500/40">
                          {t.badge95Broker}
                        </span>
                      )}

                      <div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm font-bold text-white">{sc.label}</span>
                          <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                            sc.status === 'VIABLE'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : sc.status === 'MODERATE_RISK'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}>
                            {sc.ltvPercent}% LTV
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          {t.cardDownPaymentDetail(sc.downPaymentPercent, `${sc.downPaymentAmount.toLocaleString(numberLocale)} €`)}
                        </div>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">{t.cardTotalUpfrontLabel}</span>
                          <span className="font-extrabold text-white">{sc.totalUpfrontRequired.toLocaleString(numberLocale)} €</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">{t.cardShortfallLabel}</span>
                          <span className={sc.shortfall === 0 ? 'font-bold text-emerald-400' : 'font-bold text-amber-400'}>
                            {sc.shortfall === 0 ? t.cardShortfallCovered : `${sc.shortfall.toLocaleString(numberLocale)} €`}
                          </span>
                        </div>
                        <div className="border-t border-slate-800 pt-1.5 flex justify-between font-semibold">
                          <span className="text-slate-300">{t.cardTimeNeededLabel}</span>
                          <span className={sc.isReadyNow ? 'text-emerald-400 font-bold' : 'text-slate-200'}>
                            {sc.isReadyNow ? t.cardBuyNow : t.monthsCount(sc.monthsNeeded)}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-slate-800/80 pt-2 flex items-center justify-between text-xs">
                        <div>
                          <div className="text-[10px] text-slate-400">{t.cardFrenchMonthlyLabel}</div>
                          <div className="font-bold text-white text-sm">{sc.monthlyMortgagePayment.toLocaleString(numberLocale)} €{t.perMonth}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400">{t.cardDtiLabel}</div>
                          <div className={`font-bold ${sc.dtiPercent <= 33 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {sc.dtiPercent}%
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Nota explicativa de brokers */}
              <div className="mt-3 p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-400 leading-relaxed">
                ℹ️ <strong className="text-slate-200">{t.brokerAdvantageBadge}:</strong> {t.brokerExplanationText}
              </div>
            </section>
          </div>
        )}



        {/* TAB 3: PISOS EVALUADOS (GMAIL & SUPABASE) */}
        {activeTab === 'properties' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  <h2 className="text-lg font-bold text-white">
                    {t.tabPropsLiveTitle}
                  </h2>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      supabaseConnected
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {supabaseConnected ? t.dbConnectedBadge : t.dbMemoryBadge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {liveProperties.length > 0
                    ? t.tabPropsSubtitleLive(liveProperties.length)
                    : t.tabPropsSubtitleEmpty}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Filtros */}
                <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
                  <button
                    onClick={() => setLivePropsFilter('all')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      livePropsFilter === 'all'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t.filterAll} ({liveProperties.length})
                  </button>
                  <button
                    onClick={() => setLivePropsFilter('viable')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      livePropsFilter === 'viable'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t.filterViableDirect}
                  </button>
                  <button
                    onClick={() => setLivePropsFilter('broker_viable')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      livePropsFilter === 'broker_viable'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t.filterBrokerViable}
                  </button>
                </div>

                {/* Botón Refrescar */}
                <button
                  disabled={loadingLiveProps}
                  onClick={fetchLiveProperties}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-xs text-slate-200 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <svg
                    className={`w-3.5 h-3.5 text-emerald-400 ${loadingLiveProps ? 'animate-spin' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  {loadingLiveProps ? t.btnRefreshing : t.btnRefreshProperties}
                </button>
              </div>
            </div>

            {/* Espacio reservado para emails: Si aún no hay alertas registradas */}
            {liveProperties.length === 0 ? (
              <div className="rounded-2xl border border-slate-800/90 bg-slate-900/40 backdrop-blur-sm p-10 text-center space-y-5">
                <div className="relative flex items-center justify-center mx-auto w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-2xl text-emerald-400 shadow-inner">
                  <span className="animate-pulse">📬</span>
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                </div>

                <div className="max-w-lg mx-auto space-y-2">
                  <h3 className="text-base font-bold text-white tracking-wide">{t.waitingEmailsTitle}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{t.waitingEmailsDesc}</p>
                </div>

                {/* Badges de estado */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px]">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/80 border border-slate-800 text-emerald-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    {t.waitingStatusActive}
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-slate-950/80 border border-slate-800 text-slate-400">
                    {t.waitingCriteriaNote}
                  </span>
                </div>
              </div>
            ) : (
              /* Grid exclusivamente con los inmuebles reales registrados desde Gmail / Supabase */
              <div className="space-y-4">
                {liveProperties.filter((p) => {
                  if (livePropsFilter === 'viable') return p.status === 'VIABLE';
                  if (livePropsFilter === 'broker_viable') return p.is_broker_viable;
                  return true;
                }).length === 0 ? (
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-8 text-center text-xs text-slate-400">
                    {t.noPropertiesFiltered}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {liveProperties
                      .filter((p) => {
                        if (livePropsFilter === 'viable') return p.status === 'VIABLE';
                        if (livePropsFilter === 'broker_viable') return p.is_broker_viable;
                        return true;
                      })
                      .map((prop) => (
                        <div
                          key={prop.id}
                          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all shadow-lg"
                        >
                          <div className="space-y-2">
                            {prop.email_subject && (
                              <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800/80">
                                <span className="text-emerald-400 font-bold">{t.badgeFromGmail}:</span>
                                <span className="truncate">{prop.email_subject}</span>
                              </div>
                            )}

                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                  {prop.district || 'Barcelona'}
                                </span>
                                <h3 className="text-base font-bold text-white mt-1.5">{prop.title}</h3>
                              </div>
                              <span
                                className={`text-xs px-2.5 py-1 rounded-full font-extrabold uppercase ${
                                  prop.status === 'VIABLE'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : prop.is_broker_viable
                                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }`}
                              >
                                {prop.status === 'VIABLE'
                                  ? t.badgeDirectViableCard
                                  : prop.is_broker_viable
                                  ? t.badgeBrokerViableCard(prop.best_broker_ltv || 95)
                                  : t.statusModerateRisk}
                              </span>
                            </div>
                            {prop.description && (
                              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{prop.description}</p>
                            )}
                          </div>

                          {/* Métricas Principales */}
                          <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs">
                            <div>
                              <div className="text-slate-500 text-[10px]">{t.priceLabel}</div>
                              <div className="font-bold text-white mt-0.5">{prop.price.toLocaleString(numberLocale)} €</div>
                            </div>
                            <div>
                              <div className="text-slate-500 text-[10px]">{t.cuotaLabel} (80%)</div>
                              <div className="font-bold text-emerald-400 mt-0.5">{prop.monthly_payment_80.toLocaleString(numberLocale)} €</div>
                            </div>
                            <div>
                              <div className="text-slate-500 text-[10px]">{t.dtiShortLabel}</div>
                              <div className={`font-bold mt-0.5 ${prop.dti_percent_80 <= 33 ? 'text-emerald-400' : 'text-amber-300'}`}>
                                {prop.dti_percent_80}%
                              </div>
                            </div>
                          </div>

                          {/* Destacado de Ventaja con Broker si aplica */}
                          {prop.is_broker_viable && prop.best_broker_ltv && prop.months_needed_broker !== undefined && (
                            <div className="bg-gradient-to-r from-teal-950/40 to-emerald-950/30 border border-teal-500/30 rounded-xl p-2.5 text-xs text-teal-300 flex items-center justify-between">
                              <span>
                                {t.brokerSavingsAdvantage(
                                  prop.best_broker_ltv,
                                  prop.months_needed_broker,
                                  `${prop.total_upfront_broker?.toLocaleString(numberLocale)} €`
                                )}
                              </span>
                              <span className="font-bold text-white bg-teal-500/20 px-2 py-0.5 rounded text-[11px]">
                                {prop.monthly_payment_broker?.toLocaleString(numberLocale)} €{t.perMonth}
                              </span>
                            </div>
                          )}

                          <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-xs text-slate-400">
                            <div>
                              {t.upfrontShortLabel} <strong className="text-white">{prop.total_upfront_80.toLocaleString(numberLocale)} €</strong>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-emerald-400 font-medium">
                                {prop.months_needed_80 === 0 ? t.timeReadyNow : t.monthsCount(prop.months_needed_80)}
                              </span>
                              {prop.url && (
                                <a
                                  href={prop.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-teal-400 hover:text-teal-300 hover:underline flex items-center gap-1"
                                >
                                  <span>{t.linkViewProperty}</span>
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: DOCUMENTACIÓN DE REGLAS Y FÓRMULAS */}
        {activeTab === 'docs' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                {t.docsFiscalTitle}
              </h3>
              <ul className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{t.docsFiscalLtv}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{t.docsFiscalItp}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{t.docsFiscalTotal}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{t.docsFiscalPortfolio(TOTAL_INITIAL_SAVINGS.toLocaleString(numberLocale) + ' €')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{t.docsFiscalCapacity}</span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span>
                {t.docsFormulasTitle}
              </h3>
              <div className="space-y-3 text-xs text-slate-300 font-mono bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-emerald-400 font-bold font-sans">{t.formulaFrench}</div>
                <div>{t.formulaFrenchEquation}</div>
                <div className="text-slate-500 text-[11px] font-sans">
                  {t.formulaFrenchSub}
                </div>

                <div className="text-emerald-400 font-bold font-sans pt-2">{t.formulaDti}</div>
                <div>{t.formulaDtiEquation}</div>

                <div className="text-emerald-400 font-bold font-sans pt-2">{t.formulaSavings}</div>
                <div>{t.formulaSavingsEquation1(currentSavings.toLocaleString(numberLocale) + ' €')}</div>
                <div>{t.formulaSavingsEquation2}</div>
                <div className="text-slate-500 text-[11px] font-sans">
                  {t.formulaSavingsSub}
                </div>
              </div>

              {/* Ejemplo cURL */}
              <div className="pt-2">
                <div className="text-xs font-semibold text-slate-300 mb-1">{t.curlExampleTitle}</div>
                <pre className="text-[11px] font-mono bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300 overflow-x-auto">
{`curl -X POST "http://localhost:3000/api/webhook?lang=${lang}" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"Piso Gràcia","price":250000,"district":"Gràcia","mortgageConfig":{"financingPercent":95}}'`}
                </pre>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          {t.footerText}
        </div>
      </footer>
    </div>
  );
}
