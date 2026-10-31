import Decimal from 'decimal.js';
import { eq, and } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { documents, documentLines } from '@zynveo/database';
import { InventoryService } from '@zynveo/core-inventory';

export interface InvoiceLinePricingInput {
  productId: string;
  variantId?: string | null;
  description: string;
  quantity: string;
  unitPrice: string;
  discountPercent?: string;
  taxPercent?: string;
}

export interface CalculatedInvoiceLine {
  productId: string;
  variantId?: string;
  description: string;
  quantity: string;
  unitPrice: string;
  discountPercent: string;
  taxPercent: string;
  grossLineAmount: string;
  discountAmount: string;
  lineSubtotal: string;
  lineTaxAmount: string;
  lineTotal: string;
}

export interface CalculatedInvoiceSummary {
  lines: CalculatedInvoiceLine[];
  subtotal: string;
  discountTotal: string;
  taxTotal: string;
  grossTotal: string;
}

/**
 * Pure Decimal invoice line & header calculator with HALF_UP rounding at the line level.
 * Never uses native JS floating-point math.
 */
export function calculateInvoiceTotals(
  rawLines: InvoiceLinePricingInput[],
): CalculatedInvoiceSummary {
  if (!rawLines || rawLines.length === 0) {
    throw new Error('Invoice must contain at least one line item.');
  }

  let subtotal = new Decimal(0);
  let discountTotal = new Decimal(0);
  let taxTotal = new Decimal(0);

  const lines: CalculatedInvoiceLine[] = rawLines.map((line) => {
    const qty = new Decimal(line.quantity);
    const price = new Decimal(line.unitPrice);
    const discPct = new Decimal(line.discountPercent || '0');
    const taxPct = new Decimal(line.taxPercent || '0');

    if (qty.lte(0)) {
      throw new Error(`Invoice line quantity must be positive for product ${line.productId}`);
    }
    if (price.isNegative()) {
      throw new Error(`Invoice line unitPrice cannot be negative for product ${line.productId}`);
    }

    const grossLine = qty.mul(price).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const discountAmount = grossLine
      .mul(discPct)
      .div(100)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const lineSubtotal = grossLine.minus(discountAmount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const lineTaxAmount = lineSubtotal
      .mul(taxPct)
      .div(100)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const lineTotal = lineSubtotal.plus(lineTaxAmount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    subtotal = subtotal.plus(lineSubtotal);
    discountTotal = discountTotal.plus(discountAmount);
    taxTotal = taxTotal.plus(lineTaxAmount);

    return {
      productId: line.productId,
      variantId: line.variantId ?? undefined,
      description: line.description,
      quantity: qty.toDecimalPlaces(4, Decimal.ROUND_HALF_UP).toFixed(4),
      unitPrice: price.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2),
      discountPercent: discPct.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2),
      taxPercent: taxPct.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2),
      grossLineAmount: grossLine.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      lineSubtotal: lineSubtotal.toFixed(2),
      lineTaxAmount: lineTaxAmount.toFixed(2),
      lineTotal: lineTotal.toFixed(2),
    };
  });

  const grossTotal = subtotal.plus(taxTotal).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  return {
    lines,
    subtotal: subtotal.toFixed(2),
    discountTotal: discountTotal.toFixed(2),
    taxTotal: taxTotal.toFixed(2),
    grossTotal: grossTotal.toFixed(2),
  };
}

export class InvoicingService {
  constructor(
    private db: any,
    private inventoryService: InventoryService,
  ) {}

  async finalizeInvoice(tenantId: string, invoiceId: string, primaryWarehouseId: string) {
    const docs = documents as any;
    const docLines = documentLines as any;
    const invoiceResults = await this.db
      .select()
      .from(docs)
      .where(
        and(
          eq(docs.tenantId, tenantId),
          eq(docs.id, invoiceId),
          eq(docs.type, 'invoice'),
        ),
      );

    const invoice = invoiceResults[0];
    if (!invoice) throw new Error('Invoice not found.');
    if (invoice.status !== 'draft') throw new Error('Invoice is already finalized or voided.');

    const lines = await this.db
      .select()
      .from(docLines)
      .where(and(eq(docLines.tenantId, tenantId), eq(docLines.documentId, invoiceId)));

    await this.db.transaction(async (tx: any) => {
      await tx
        .update(docs)
        .set({ status: 'sent', updatedAt: new Date() })
        .where(eq(docs.id, invoiceId));

      for (const line of lines) {
        if (line.variantId) {
          await this.inventoryService.decrementStock(
            tenantId,
            line.variantId,
            Number(line.quantity),
            primaryWarehouseId,
          );
        }
      }
    });

    return true;
  }
}
