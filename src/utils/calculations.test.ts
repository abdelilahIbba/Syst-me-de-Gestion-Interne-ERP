/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDH,
  round2,
  sanitizeForSheet,
  calculateMoroccanPayroll,
  calculateInvoiceTotals,
  validatePaymentAmount,
  checkContractExpiration,
  validateDailyReportHours,
  calculateMonthlyProjectProfitability,
  calculateProjectsComparisonData,
} from './calculations';

test('formatDH formats numbers cleanly with DH currency symbol', () => {
  assert.equal(formatDH(0), '0,00 DH');
  assert.equal(formatDH(1500), '1 500,00 DH');
});

test('R12: sanitizeForSheet neutralizes CSV/formula injection characters', () => {
  // Test starting with '=', '+', '-', '@'
  assert.equal(sanitizeForSheet('=SUM(A1:A10)'), "'=SUM(A1:A10)");
  assert.equal(sanitizeForSheet('+12345'), "'+12345");
  assert.equal(sanitizeForSheet('-cmd| /C calc'), "'-cmd| /C calc");
  assert.equal(sanitizeForSheet('@IMPORTXML'), "'@IMPORTXML");
  // Regular strings shouldn't be altered
  assert.equal(sanitizeForSheet('Client Casablanca SARL'), 'Client Casablanca SARL');
  assert.equal(sanitizeForSheet(''), '');
});

test('calculateInvoiceTotals calculates HT, discount, TVA 20% and TTC correctly', () => {
  const items = [
    { quantite: 2, prix_unitaire_ht: 5000, remise_ligne: 0 }, // 10000
    { quantite: 1, prix_unitaire_ht: 2500, remise_ligne: 500 }, // 2000
  ];
  // Total HT = 12000
  // Global discount = 1000 -> Base TVA = 11000
  // TVA 20% = 2200
  // Total TTC = 13200
  const result = calculateInvoiceTotals(items, 1000, 20);
  assert.equal(result.totalHt, 12000);
  assert.equal(result.remise, 1000);
  assert.equal(result.baseTva, 11000);
  assert.equal(result.montantTva, 2200);
  assert.equal(result.totalTtc, 13200);
});

test('R5: validatePaymentAmount rejects payments exceeding the remaining balance', () => {
  const validPayment = validatePaymentAmount(5000, 10000);
  assert.equal(validPayment.valid, true);

  const exactPayment = validatePaymentAmount(10000, 10000);
  assert.equal(exactPayment.valid, true);

  const excessivePayment = validatePaymentAmount(10500, 10000);
  assert.equal(excessivePayment.valid, false);
  assert.match(excessivePayment.error || '', /dépasse le reste dû/);

  const negativePayment = validatePaymentAmount(-100, 5000);
  assert.equal(negativePayment.valid, false);
});

test('calculateMoroccanPayroll applies CNSS ceiling (6000 DH), AMO and progressive IR', () => {
  const payroll = calculateMoroccanPayroll({
    baseSalary: 10000,
    primes: 2000,
    heuresSup: 0,
    indemnitesDeplacement: 500,
    avances: 0,
    autresRetenues: 0,
  });

  // Brut = 10000 + 2000 + 500 = 12500
  assert.equal(payroll.salaireBrut, 12500);
  // CNSS = min(12500, 6000) * 4.48% = 268.80
  assert.equal(payroll.cnssSalarie, 268.80);
  // AMO = 12500 * 2.26% = 282.50
  assert.equal(payroll.amo, 282.50);
  // Net à payer must be positive and less than brut
  assert.ok(payroll.netAPayer > 0);
  assert.ok(payroll.netAPayer < payroll.salaireBrut);
  assert.equal(
    round2(payroll.salaireBrut - payroll.cnssSalarie - payroll.amo - payroll.ir),
    payroll.netAPayer
  );
});

test('R9: checkContractExpiration computes correct countdown alert level', () => {
  const today = new Date();
  
  // 10 days in future -> warning (<= 30 days)
  const dateIn10Days = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const alert10 = checkContractExpiration(dateIn10Days);
  assert.equal(alert10.alertLevel, 'warning');

  // 5 days in future -> urgent (<= 7 days)
  const dateIn5Days = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const alert5 = checkContractExpiration(dateIn5Days);
  assert.equal(alert5.alertLevel, 'urgent');

  // Past date -> expired
  const datePast = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const alertPast = checkContractExpiration(datePast);
  assert.equal(alertPast.alertLevel, 'expired');
});

test('RJ-3: validateDailyReportHours warns when daily hours exceed 12h', () => {
  const normal = validateDailyReportHours(8);
  assert.equal(normal.valid, true);
  assert.equal(normal.isWarning, false);

  const overtime = validateDailyReportHours(14);
  assert.equal(overtime.valid, true);
  assert.equal(overtime.isWarning, true);
  assert.match(overtime.message || '', /dépasse la limite journalière recommandée de 12 heures/);
});

test('calculateMonthlyProjectProfitability calculates timeline, profit, and margin rates', () => {
  const mockProjects = [{ id: 'PRJ-001', nom_systeme: 'ERP Logistique' }];
  const mockInvoices = [{ id: 'INV-001', project_id: 'PRJ-001', total_ttc: 144000, statut: 'payée' }];
  const mockPayments = [{ id: 'PAY-001', invoice_id: 'INV-001', montant: 144000, date_paiement: '2026-02-10', statut: 'encaissé' }];
  const mockDailyReports = [
    {
      id: 'REP-001',
      date: '2026-02-15',
      employee_id: 'EMP-001',
      tasks: [{ project_id: 'PRJ-001', heures: 10 }],
    },
  ];
  const mockSiteVisits = [
    {
      id: 'VIS-001',
      project_id: 'PRJ-001',
      date: '2026-02-16',
      expenses: [{ montant: 500, statut: 'validé' }],
    },
  ];
  const mockEmployees = [{ id: 'EMP-001', hourly_cost: 200 }];

  const result = calculateMonthlyProjectProfitability({
    projectId: 'PRJ-001',
    projects: mockProjects,
    invoices: mockInvoices,
    payments: mockPayments,
    dailyReports: mockDailyReports,
    siteVisits: mockSiteVisits,
    employees: mockEmployees,
  });

  assert.equal(Array.isArray(result), true);
  assert.equal(result.length, 11); // Jan through Nov

  // Check Feb 2026
  const feb = result.find((r) => r.month === '2026-02');
  assert.ok(feb);
  assert.equal(feb.revenus, 144000);
  // Labor: 10h * 200 = 2000, Travel: 500 -> total costs = 2500
  assert.equal(feb.couts, 2500);
  assert.equal(feb.beneficeNet, 144000 - 2500);
  assert.ok(feb.tauxMarge > 90);
});

test('calculateProjectsComparisonData compares project revenues against direct charges', () => {
  const result = calculateProjectsComparisonData({
    projects: [
      { id: 'PRJ-1', client_id: 'CLI-1', nom_systeme: 'ERP Global', prix_vente_ht: 100000, statut: 'livré' },
      { id: 'PRJ-2', client_id: 'CLI-1', nom_systeme: 'POS Caisse', prix_vente_ht: 30000, statut: 'en cours' },
    ],
    clients: [{ id: 'CLI-1', raison_sociale: 'Client Test SARL' }],
    invoices: [
      { id: 'INV-1', project_id: 'PRJ-1', statut: 'payée' },
      { id: 'INV-2', project_id: 'PRJ-2', statut: 'annulée' },
    ],
    payments: [
      { id: 'PAY-1', invoice_id: 'INV-1', montant: 120000, statut: 'encaissé' },
      { id: 'PAY-2', invoice_id: 'INV-2', montant: 30000, statut: 'encaissé' },
    ],
    dailyReports: [
      {
        id: 'REP-1',
        employee_id: 'EMP-1',
        tasks: [
          { project_id: 'PRJ-1', heures: 10 },
          { project_id: 'PRJ-2', heures: 5 },
        ],
      },
    ],
    siteVisits: [
      {
        id: 'VIS-1',
        project_id: 'PRJ-1',
        expenses: [{ montant: 450 }],
      },
    ],
    employees: [{ id: 'EMP-1', hourly_cost: 200 }],
  });

  assert.equal(result.length, 2);

  // PRJ-1: encaissé 120000, labor 2000, travel 450 => direct charges 2450, net profit 117550
  assert.equal(result[0].revenusEncaisses, 120000);
  assert.equal(result[0].coutMainOeuvre, 2000);
  assert.equal(result[0].fraisDeplacement, 450);
  assert.equal(result[0].chargesDirectes, 2450);
  assert.equal(result[0].beneficeNet, 117550);

  // PRJ-2: invoice cancelled so encaissé 0, labor 1000, direct charges 1000
  assert.equal(result[1].revenusEncaisses, 0);
  assert.equal(result[1].chargesDirectes, 1000);
  assert.equal(result[1].beneficeNet, -1000);
});


