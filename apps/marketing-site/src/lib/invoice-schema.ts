import { z } from "zod";

export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "USD - US Dollar ($)" },
  { code: "EUR", symbol: "€", name: "EUR - Euro (€)" },
  { code: "GBP", symbol: "£", name: "GBP - British Pound (£)" },
  { code: "CAD", symbol: "$", name: "CAD - Canadian Dollar ($)" },
  { code: "AUD", symbol: "$", name: "AUD - Australian Dollar ($)" },
  { code: "INR", symbol: "₹", name: "INR - Indian Rupee (₹)" },
  { code: "LKR", symbol: "Rs.", name: "LKR - Sri Lankan Rupee (Rs.)" },
  { code: "SGD", symbol: "$", name: "SGD - Singapore Dollar ($)" },
  { code: "AED", symbol: "AED", name: "AED - UAE Dirham" },
  { code: "SAR", symbol: "SAR", name: "SAR - Saudi Riyal" },
  { code: "QAR", symbol: "QAR", name: "QAR - Qatari Riyal" },
  { code: "MYR", symbol: "RM", name: "MYR - Malaysian Ringgit (RM)" },
  { code: "JPY", symbol: "¥", name: "JPY - Japanese Yen (¥)" },
  { code: "CNY", symbol: "¥", name: "CNY - Chinese Yuan (¥)" },
  { code: "CHF", symbol: "CHF", name: "CHF - Swiss Franc" },
  { code: "NZD", symbol: "$", name: "NZD - New Zealand Dollar ($)" },
  { code: "THB", symbol: "฿", name: "THB - Thai Baht (฿)" },
  { code: "IDR", symbol: "Rp", name: "IDR - Indonesian Rupiah (Rp)" },
  { code: "PHP", symbol: "₱", name: "PHP - Philippine Peso (₱)" },
  { code: "VND", symbol: "₫", name: "VND - Vietnamese Dong (₫)" },
  { code: "KRW", symbol: "₩", name: "KRW - South Korean Won (₩)" },
  { code: "TRY", symbol: "₺", name: "TRY - Turkish Lira (₺)" },
  { code: "ZAR", symbol: "R", name: "ZAR - South African Rand (R)" },
  { code: "BRL", symbol: "R$", name: "BRL - Brazilian Real (R$)" },
  { code: "MXN", symbol: "$", name: "MXN - Mexican Peso ($)" },
  { code: "SEK", symbol: "kr", name: "SEK - Swedish Krona (kr)" },
  { code: "NOK", symbol: "kr", name: "NOK - Norwegian Krone (kr)" },
  { code: "DKK", symbol: "kr", name: "DKK - Danish Krone (kr)" },
  { code: "PLN", symbol: "zł", name: "PLN - Polish Zloty (zł)" },
] as const;

export const ACCENT_COLORS = [
  { name: "Violet", hex: "#6d28d9", bg: "bg-violet-600" },
  { name: "Indigo", hex: "#4f46e5", bg: "bg-indigo-600" },
  { name: "Blue", hex: "#2563eb", bg: "bg-blue-600" },
  { name: "Emerald", hex: "#059669", bg: "bg-emerald-600" },
  { name: "Rose", hex: "#e11d48", bg: "bg-rose-600" },
  { name: "Amber", hex: "#d97706", bg: "bg-amber-600" },
  { name: "Slate", hex: "#334155", bg: "bg-slate-700" },
] as const;

export const invoiceItemSchema = z.object({
  productName: z.string().optional(),
  description: z.string().min(1, "Item description required"),
  quantity: z.coerce.number().min(1, "Min 1"),
  rate: z.coerce.number().min(0, "Min 0"),
  discount: z.coerce.number().min(0).default(0),
});

export const invoiceSchema = z.object({
  accentColor: z.string().default("#6d28d9"),
  logo: z.string().optional(),
  companyName: z.string().min(1, "Business name is required"),
  companyPhone: z.string().optional(),
  companyEmail: z.string().optional(),
  companyAddress: z.string().optional(),
  companyWebsite: z.string().optional(),

  clientName: z.string().min(1, "Customer name is required"),
  clientPhone: z.string().optional(),
  clientAddress: z.string().optional(),
  shippingAddress: z.string().optional(),

  invoiceNumber: z.string().min(1, "Invoice number is required"),
  date: z.string(),
  dueDate: z.string().optional(),

  items: z.array(invoiceItemSchema).min(1, "Add at least one item"),

  discountType: z.enum(["percentage", "fixed"]).default("percentage"),
  discountValue: z.coerce.number().min(0).default(0),
  enableTax: z.boolean().default(true),
  taxRate: z.coerce.number().min(0).max(100).default(10),

  paymentType: z.enum(["Full Payment", "Advanced Payment", "Partial Payment", "Due"]).default("Full Payment"),
  amountPaid: z.coerce.number().min(0).default(0),

  currency: z.string().default("USD"),
  notes: z.string().optional(),
});

export type InvoiceData = z.infer<typeof invoiceSchema>;
export type InvoiceItem = z.infer<typeof invoiceItemSchema>;
