import { z } from "zod";

// Re-export CURRENCIES from the invoice schema so both tools share one source of truth
export { CURRENCIES } from "./invoice-schema";

// ── Months & Years for dropdowns ──────────────────────────────────────────────
export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

export const YEARS = Array.from({ length: 10 }, (_, i) => String(2024 + i));

// ── Zod Schemas ───────────────────────────────────────────────────────────────

export const salaryComponentSchema = z.object({
  label: z.string().min(1, "Label is required"),
  amount: z.coerce.number().min(0).default(0),
});

export const customFieldSchema = z.object({
  label: z.string().min(1, "Label is required"),
  value: z.string().default(""),
});

export const payslipSchema = z.object({
  // Company
  companyName: z.string().default(""),
  companyAddress: z.string().default(""),
  companyLogo: z.string().default(""),

  // Pay Period
  month: z.string().default("June"),
  year: z.string().default("2026"),
  payDate: z.string().default(""),
  paidDays: z.coerce.number().min(0).max(31).default(30),
  lopDays: z.coerce.number().min(0).max(31).default(0),

  // Employee
  employeeName: z.string().min(1, "Employee name is required"),
  employeeId: z.string().default(""),
  designation: z.string().default(""),
  department: z.string().default(""),
  panNumber: z.string().default(""),

  // Currency
  currency: z.string().default("LKR"),

  // Dynamic Salary Components
  earnings: z.array(salaryComponentSchema).min(1, "At least one earning is required"),
  deductions: z.array(salaryComponentSchema).default([]),

  // Custom Fields
  customEmployeeFields: z.array(customFieldSchema).default([]),
  customPaySummaryFields: z.array(customFieldSchema).default([]),
});

export type PayslipData = z.infer<typeof payslipSchema>;
export type SalaryComponent = z.infer<typeof salaryComponentSchema>;
export type CustomField = z.infer<typeof customFieldSchema>;

// ── Number to Words Utility ───────────────────────────────────────────────────

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const TENS = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
];

function convertBelowThousand(n: number): string {
  if (n === 0) return "";
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : "");
  return (
    ONES[Math.floor(n / 100)] +
    " Hundred" +
    (n % 100 ? " and " + convertBelowThousand(n % 100) : "")
  );
}

export function numberToWords(num: number): string {
  if (num === 0) return "Zero Only";
  if (num < 0) return "Minus " + numberToWords(Math.abs(num));

  const intPart = Math.floor(num);
  const decimalPart = Math.round((num - intPart) * 100);

  // Indian numbering system: Lakh, Crore
  const crore = Math.floor(intPart / 10000000);
  const lakh = Math.floor((intPart % 10000000) / 100000);
  const thousand = Math.floor((intPart % 100000) / 1000);
  const remainder = intPart % 1000;

  let words = "";

  if (crore > 0) words += convertBelowThousand(crore) + " Crore ";
  if (lakh > 0) words += convertBelowThousand(lakh) + " Lakh ";
  if (thousand > 0) words += convertBelowThousand(thousand) + " Thousand ";
  if (remainder > 0) words += convertBelowThousand(remainder);

  words = words.trim();

  if (decimalPart > 0) {
    words += " and " + convertBelowThousand(decimalPart) + " Cents";
  }

  return words + " Only";
}
