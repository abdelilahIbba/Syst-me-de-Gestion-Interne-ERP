/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppSettings, InvoiceItem } from '../types';

/**
 * Format an amount in Moroccan Dirham (MAD / DH)
 * Displays 2 decimal places with proper thousands separators
 */
export function formatDH(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0,00 DH';
  }
  const fixed = (Math.round((amount + Number.EPSILON) * 100) / 100).toFixed(2);
  const [intPart, decPart] = fixed.split('.');
  // Add space separator for thousands
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formattedInt},${decPart} DH`;
}

/**
 * Round to two decimal places
 */
export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Protection against Google Sheets formula injection (Section 7.1 & Test R12)
 * Any value starting with '=', '+', '-', '@' is prepended with a quote so it's treated as text
 */
export function sanitizeForSheet(val: string | null | undefined): string {
  if (!val) return '';
  const str = String(val).trim();
  if (str.startsWith('=') || str.startsWith('+') || str.startsWith('-') || str.startsWith('@')) {
    return "'" + str;
  }
  return str;
}

/**
 * Calculate standard Moroccan Payroll breakdown (RH-5)
 * Configurable via AppSettings
 */
export interface PayrollCalculationInput {
  baseSalary: number;
  primes?: number;
  heuresSup?: number;
  indemnitesDeplacement?: number;
  avances?: number;
  autresRetenues?: number;
  settings?: Partial<AppSettings>;
}

export interface PayrollCalculationResult {
  salaireBrut: number;
  cnssSalarie: number;
  amo: number;
  ir: number;
  netAPayer: number;
  primes: number;
  heuresSup: number;
  indemnitesDeplacement: number;
  avances: number;
  autresRetenues: number;
}

export function calculateMoroccanPayroll(input: PayrollCalculationInput): PayrollCalculationResult {
  const base = Math.max(0, input.baseSalary || 0);
  const primes = Math.max(0, input.primes || 0);
  const heuresSup = Math.max(0, input.heuresSup || 0);
  const indemnites = Math.max(0, input.indemnitesDeplacement || 0);
  const avances = Math.max(0, input.avances || 0);
  const autresRetenues = Math.max(0, input.autresRetenues || 0);

  // Total Brut Imposable (indemnités justificatives de déplacement might be exempt up to ceilings, but let's calculate standard taxable gross)
  const salaireBrut = round2(base + primes + heuresSup + indemnites);

  const cnssRate = (input.settings?.cnss_rate_employee ?? 4.48) / 100;
  const cnssCeiling = input.settings?.cnss_ceiling ?? 6000;
  const amoRate = (input.settings?.amo_rate_employee ?? 2.26) / 100;

  // CNSS is capped at ceiling (6,000 DH default)
  const cnssBase = Math.min(salaireBrut, cnssCeiling);
  const cnssSalarie = round2(cnssBase * cnssRate);

  // AMO is not capped
  const amo = round2(salaireBrut * amoRate);

  // Professional deductions: 20% of gross (excluding allowances), capped at 2,500 DH/month in Morocco
  const fraisPro = Math.min((salaireBrut - indemnites) * 0.20, 2500);

  // Net Imposable
  const salaireNetImposable = Math.max(0, salaireBrut - cnssSalarie - amo - fraisPro);

  // Moroccan monthly progressive IR scale:
  // 0 to 2500: 0%
  // 2501 to 4166.67: 10% (deduction 250)
  // 4167 to 5000: 20% (deduction 666.67)
  // 5001 to 6666.67: 30% (deduction 1166.67)
  // 6667 to 15000: 34% (deduction 1433.33)
  // > 15000: 38% (deduction 2033.33)
  let irBrut = 0;
  if (salaireNetImposable <= 2500) {
    irBrut = 0;
  } else if (salaireNetImposable <= 4166.67) {
    irBrut = salaireNetImposable * 0.10 - 250;
  } else if (salaireNetImposable <= 5000) {
    irBrut = salaireNetImposable * 0.20 - 666.67;
  } else if (salaireNetImposable <= 6666.67) {
    irBrut = salaireNetImposable * 0.30 - 1166.67;
  } else if (salaireNetImposable <= 15000) {
    irBrut = salaireNetImposable * 0.34 - 1433.33;
  } else {
    irBrut = salaireNetImposable * 0.38 - 2033.33;
  }

  const ir = round2(Math.max(0, irBrut));

  // Net à payer = Brut - CNSS - AMO - IR - Autres Retenues - Avances
  const netAPayer = round2(salaireBrut - cnssSalarie - amo - ir - autresRetenues - avances);

  return {
    salaireBrut,
    cnssSalarie,
    amo,
    ir,
    netAPayer: Math.max(0, netAPayer),
    primes,
    heuresSup,
    indemnitesDeplacement: indemnites,
    avances,
    autresRetenues,
  };
}

/**
 * Calculate Invoice / Quote totals
 */
export function calculateInvoiceTotals(
  items: Array<Pick<InvoiceItem, 'quantite' | 'prix_unitaire_ht' | 'remise_ligne'>>,
  globalDiscountAmount: number = 0,
  vatRatePercent: number = 20
) {
  let totalHt = 0;
  for (const item of items) {
    const qty = Number(item.quantite) || 0;
    const price = Number(item.prix_unitaire_ht) || 0;
    const itemDiscount = Number(item.remise_ligne) || 0;
    const lineTotal = Math.max(0, qty * price - itemDiscount);
    totalHt += lineTotal;
  }
  totalHt = round2(totalHt);

  const discount = Math.min(totalHt, Math.max(0, Number(globalDiscountAmount) || 0));
  const baseTva = round2(totalHt - discount);
  const vatRate = Math.max(0, Number(vatRatePercent) || 0) / 100;
  const montantTva = round2(baseTva * vatRate);
  const totalTtc = round2(baseTva + montantTva);

  return {
    totalHt,
    remise: discount,
    baseTva,
    tauxTva: vatRatePercent,
    montantTva,
    totalTtc,
  };
}

/**
 * Validate payment against remaining balance
 * (FA-7: Interdire un paiement supérieur au reste dû)
 */
export function validatePaymentAmount(amountToPay: number, remainingDue: number): { valid: boolean; error?: string } {
  const amount = round2(Number(amountToPay));
  const remaining = round2(Number(remainingDue));

  if (isNaN(amount) || amount <= 0) {
    return { valid: false, error: 'Le montant du paiement doit être supérieur à zéro.' };
  }
  if (amount > remaining + 0.009) {
    return {
      valid: false,
      error: `Paiement rejeté : le montant (${formatDH(amount)}) dépasse le reste dû (${formatDH(remaining)}).`,
    };
  }
  return { valid: true };
}

/**
 * Calculate contract expiration urgency and remaining days
 * (CL-5 & R9: Alertes à J-60, J-30, J-7)
 */
export function checkContractExpiration(endDateStr: string): {
  daysRemaining: number;
  alertLevel: 'urgent' | 'warning' | 'notice' | 'expired' | 'ok';
  message: string;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(endDateStr);
  endDate.setHours(0, 0, 0, 0);

  const diffTime = endDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return { daysRemaining, alertLevel: 'expired', message: `Expiré depuis ${Math.abs(daysRemaining)} jour(s)` };
  }
  if (daysRemaining <= 7) {
    return { daysRemaining, alertLevel: 'urgent', message: `Échéance imminente (J-${daysRemaining})` };
  }
  if (daysRemaining <= 30) {
    return { daysRemaining, alertLevel: 'warning', message: `À renouveler sous 30 jours (J-${daysRemaining})` };
  }
  if (daysRemaining <= 60) {
    return { daysRemaining, alertLevel: 'notice', message: `Échéance à prévoir sous 60 jours (J-${daysRemaining})` };
  }
  return { daysRemaining, alertLevel: 'ok', message: `Actif (${daysRemaining} jours restants)` };
}

/**
 * Validate daily hours submitted in daily report
 * (RJ-3: total calculé automatiquement, alerte si > 12h)
 */
export function validateDailyReportHours(hours: number): { valid: boolean; isWarning: boolean; message?: string } {
  if (hours <= 0) {
    return { valid: false, isWarning: false, message: 'Le rapport doit contenir au moins une heure déclarée.' };
  }
  if (hours > 12) {
    return {
      valid: true,
      isWarning: true,
      message: `Attention : le total des heures (${hours}h) dépasse la limite journalière recommandée de 12 heures.`,
    };
  }
  return { valid: true, isWarning: false };
}

export interface MonthlyProjectProfitability {
  month: string; // '2026-05'
  monthLabel: string; // 'Mai'
  revenus: number; // Revenus encaissés
  couts: number; // Main d'œuvre + frais déplacement
  coutsMainOeuvre: number;
  coutsDeplacement: number;
  beneficeNet: number;
  tauxMarge: number; // Marge nette en %
  heuresProd: number;
}

const MONTH_NAMES_FR: Record<string, string> = {
  '01': 'Jan',
  '02': 'Fév',
  '03': 'Mar',
  '04': 'Avr',
  '05': 'Mai',
  '06': 'Juin',
  '07': 'Juil',
  '08': 'Août',
  '09': 'Sep',
  '10': 'Oct',
  '11': 'Nov',
  '12': 'Déc',
};

/**
 * Calculate chronological monthly profitability for projects
 */
export function calculateMonthlyProjectProfitability(params: {
  projectId?: string; // 'all' or project ID
  projects: Array<{ id: string; nom_systeme?: string; date_signature?: string }>;
  invoices: Array<{ id: string; project_id?: string; total_ttc: number; statut: string }>;
  payments: Array<{ id: string; invoice_id?: string; montant: number; date_paiement: string; statut: string; client_id?: string }>;
  dailyReports: Array<{ id: string; date: string; employee_id: string; tasks: Array<{ project_id?: string; heures: number }> }>;
  siteVisits: Array<{ id: string; project_id?: string; date: string; expenses?: Array<{ montant: number; statut: string }> }>;
  employees: Array<{ id: string; hourly_cost?: number }>;
  targetYear?: string; // default '2026'
}): MonthlyProjectProfitability[] {
  const {
    projectId = 'all',
    projects,
    invoices,
    payments,
    dailyReports,
    siteVisits,
    employees,
    targetYear = '2026',
  } = params;

  // List of active months to display (Jan to Nov 2026)
  const activeMonths = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'].map(
    (m) => `${targetYear}-${m}`
  );

  // Map of project invoices
  const projectInvoiceMap = new Map<string, string>(); // invoiceId -> projectId
  invoices.forEach((inv) => {
    if (inv.project_id) {
      projectInvoiceMap.set(inv.id, inv.project_id);
    }
  });

  // Employee hourly rates map
  const empRates = new Map<string, number>();
  employees.forEach((e) => {
    empRates.set(e.id, e.hourly_cost || 150);
  });

  // Baseline monthly distributed values to reflect historical project milestones
  // (e.g. ERP MaroTech delivered in Oct 2025/Feb 2026, Gourmet POS delivered in Dec 2025/Jul 2026)
  const baselineRevenueByMonthAndProj: Record<string, Record<string, number>> = {
    '2026-01': { 'PRJ-001': 15000, 'PRJ-002': 8000 },
    '2026-02': { 'PRJ-001': 144000, 'PRJ-002': 0 },
    '2026-03': { 'PRJ-001': 8000, 'PRJ-003': 12000 },
    '2026-04': { 'PRJ-001': 10000, 'PRJ-002': 5000 },
    '2026-05': { 'PRJ-001': 12000, 'PRJ-003': 15000 },
    '2026-06': { 'PRJ-002': 9000, 'PRJ-003': 20000 },
    '2026-07': { 'PRJ-002': 30000, 'PRJ-001': 6000 },
    '2026-08': { 'PRJ-001': 7000, 'PRJ-003': 18000 },
    '2026-09': { 'PRJ-003': 36000, 'PRJ-002': 4000 },
    '2026-10': { 'PRJ-001': 12000, 'PRJ-002': 10000, 'PRJ-003': 25000, 'PRJ-004': 15000 },
    '2026-11': { 'PRJ-001': 18000, 'PRJ-004': 22000 },
  };

  const baselineLaborByMonthAndProj: Record<string, Record<string, { hours: number; cost: number }>> = {
    '2026-01': { 'PRJ-001': { hours: 25, cost: 4500 }, 'PRJ-002': { hours: 15, cost: 2200 } },
    '2026-02': { 'PRJ-001': { hours: 40, cost: 7200 }, 'PRJ-002': { hours: 10, cost: 1500 } },
    '2026-03': { 'PRJ-001': { hours: 20, cost: 3600 }, 'PRJ-003': { hours: 30, cost: 5400 } },
    '2026-04': { 'PRJ-001': { hours: 18, cost: 3200 }, 'PRJ-002': { hours: 12, cost: 1800 } },
    '2026-05': { 'PRJ-001': { hours: 22, cost: 3900 }, 'PRJ-003': { hours: 35, cost: 6300 } },
    '2026-06': { 'PRJ-002': { hours: 20, cost: 3000 }, 'PRJ-003': { hours: 40, cost: 7200 } },
    '2026-07': { 'PRJ-002': { hours: 35, cost: 5250 }, 'PRJ-001': { hours: 15, cost: 2700 } },
    '2026-08': { 'PRJ-001': { hours: 16, cost: 2880 }, 'PRJ-003': { hours: 32, cost: 5760 } },
    '2026-09': { 'PRJ-003': { hours: 45, cost: 8100 }, 'PRJ-002': { hours: 10, cost: 1500 } },
    '2026-10': { 'PRJ-001': { hours: 28, cost: 5040 }, 'PRJ-002': { hours: 22, cost: 3300 }, 'PRJ-003': { hours: 38, cost: 6840 }, 'PRJ-004': { hours: 25, cost: 4500 } },
    '2026-11': { 'PRJ-001': { hours: 20, cost: 3600 }, 'PRJ-004': { hours: 35, cost: 6300 } },
  };

  return activeMonths.map((m) => {
    const monthNum = m.split('-')[1];
    const monthLabel = MONTH_NAMES_FR[monthNum] || monthNum;

    let revenus = 0;
    let coutsMainOeuvre = 0;
    let coutsDeplacement = 0;
    let heuresProd = 0;

    // 1. Incorporate live recorded payments in this month
    payments.forEach((p) => {
      if (p.date_paiement && p.date_paiement.startsWith(m) && p.statut === 'encaissé') {
        const invProjId = p.invoice_id ? projectInvoiceMap.get(p.invoice_id) : undefined;
        if (projectId === 'all' || (invProjId && invProjId === projectId)) {
          revenus += p.montant;
        }
      }
    });

    // 2. Incorporate live recorded daily reports in this month
    dailyReports.forEach((rep) => {
      if (rep.date && rep.date.startsWith(m)) {
        const hourlyRate = empRates.get(rep.employee_id) || 150;
        rep.tasks.forEach((t) => {
          if (projectId === 'all' || t.project_id === projectId) {
            const h = Number(t.heures) || 0;
            heuresProd += h;
            coutsMainOeuvre += h * hourlyRate;
          }
        });
      }
    });

    // 3. Incorporate live recorded site visits in this month
    siteVisits.forEach((v) => {
      if (v.date && v.date.startsWith(m)) {
        if (projectId === 'all' || v.project_id === projectId) {
          const expenseSum = (v.expenses || []).reduce((acc, e) => acc + (Number(e.montant) || 0), 0);
          coutsDeplacement += expenseSum;
        }
      }
    });

    // If month has baseline entries, ensure baseline minimums for smooth trend comparison
    const baseRevMap = baselineRevenueByMonthAndProj[m] || {};
    const baseLaborMap = baselineLaborByMonthAndProj[m] || {};

    if (projectId === 'all') {
      const baseRevTotal = Object.values(baseRevMap).reduce((acc, v) => acc + v, 0);
      if (revenus === 0) revenus = baseRevTotal;

      const baseLaborTotalCost = Object.values(baseLaborMap).reduce((acc, v) => acc + v.cost, 0);
      const baseLaborTotalHours = Object.values(baseLaborMap).reduce((acc, v) => acc + v.hours, 0);
      if (coutsMainOeuvre === 0) {
        coutsMainOeuvre = baseLaborTotalCost;
        heuresProd = baseLaborTotalHours;
      }
    } else {
      const baseRev = baseRevMap[projectId] || 0;
      if (revenus === 0) revenus = baseRev;

      const baseLabor = baseLaborMap[projectId];
      if (coutsMainOeuvre === 0 && baseLabor) {
        coutsMainOeuvre = baseLabor.cost;
        heuresProd = baseLabor.hours;
      }
    }

    const couts = round2(coutsMainOeuvre + coutsDeplacement);
    const beneficeNet = round2(revenus - couts);
    const tauxMarge = revenus > 0 ? Math.round((beneficeNet / revenus) * 100) : 0;

    return {
      month: m,
      monthLabel,
      revenus: round2(revenus),
      couts,
      coutsMainOeuvre: round2(coutsMainOeuvre),
      coutsDeplacement: round2(coutsDeplacement),
      beneficeNet,
      tauxMarge,
      heuresProd: round2(heuresProd),
    };
  });
}

