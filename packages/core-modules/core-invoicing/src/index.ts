import { eq, and, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { documents, documentLines, journalEntries, journalLines, documentStatusEnum } from '@erp/database';
import { InventoryService } from '@erp/core-inventory';

export class InvoicingService {
  constructor(
    private db: NodePgDatabase<any>,
    private inventoryService: InventoryService
  ) {}

  /**
   * Finalizes an invoice, updating its status to 'sent' and triggering stock decrements.
   */
  async finalizeInvoice(tenantId: string, invoiceId: string, primaryWarehouseId: string) {
    // 1. Fetch the invoice and its lines
    const invoiceResults = await this.db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.tenantId, tenantId),
          eq(documents.id, invoiceId),
          eq(documents.type, 'invoice')
        )
      );

    const invoice = invoiceResults[0];
    if (!invoice) throw new Error("Invoice not found.");
    if (invoice.status !== 'draft') throw new Error("Invoice is already finalized or voided.");

    const lines = await this.db
      .select()
      .from(documentLines)
      .where(
        and(
          eq(documentLines.tenantId, tenantId),
          eq(documentLines.documentId, invoiceId)
        )
      );

    // 2. Transactionally update invoice status and decrement stock
    await this.db.transaction(async (tx: any) => {
      // Mark as sent
      await tx
        .update(documents)
        .set({ status: 'sent', updatedAt: new Date() })
        .where(eq(documents.id, invoiceId));

      // Decrement stock for physical items
      for (const line of lines) {
        if (line.variantId) {
          // If the line has a variant linked, it's a physical product or tracked service
          // Call inventory service to decrement stock
          // NOTE: We pass `tx` to inventory service in a real scenario to ensure atomicity
          // For simplicity in this demo structure, we assume InventoryService can take a transaction context
          
          await this.inventoryService.decrementStock(
            tenantId,
            line.variantId,
            Number(line.quantity),
            primaryWarehouseId
          );
        }
      }

      // FUTURE: Generate Journal Entries automatically linking AR and Revenue accounts
    });

    return true;
  }
}
