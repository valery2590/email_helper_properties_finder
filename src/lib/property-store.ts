import { FinancialViabilityReport, FinancingScenarioResult } from './financial-engine';

export interface EvaluatedPropertyRecord {
  id: string;
  receivedAt: string;
  sourceSubject?: string;
  sourceFrom?: string;
  report: FinancialViabilityReport;
  brokerScenarios: FinancingScenarioResult[];
}

// Usamos globalThis para preservar el historial en caliente en Next.js
declare global {
  // eslint-disable-next-line no-var
  var __propfinderEvaluatedStore: EvaluatedPropertyRecord[] | undefined;
}

if (!globalThis.__propfinderEvaluatedStore) {
  globalThis.__propfinderEvaluatedStore = [];
}

const MAX_STORED_RECORDS = 50;

export const propertyStore = {
  add(record: Omit<EvaluatedPropertyRecord, 'id' | 'receivedAt'>): EvaluatedPropertyRecord {
    const fullRecord: EvaluatedPropertyRecord = {
      ...record,
      id: `eval-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      receivedAt: new Date().toISOString(),
    };

    const store = globalThis.__propfinderEvaluatedStore!;
    store.unshift(fullRecord);
    if (store.length > MAX_STORED_RECORDS) {
      store.pop();
    }
    return fullRecord;
  },

  getAll(): EvaluatedPropertyRecord[] {
    return globalThis.__propfinderEvaluatedStore || [];
  },

  remove(id: string): void {
    if (globalThis.__propfinderEvaluatedStore) {
      globalThis.__propfinderEvaluatedStore = globalThis.__propfinderEvaluatedStore.filter(
        (item) => item.id !== id
      );
    }
  },

  clear(): void {
    globalThis.__propfinderEvaluatedStore = [];
  },
};
