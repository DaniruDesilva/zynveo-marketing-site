import { eq, and, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { stockLevels, productVariants, warehouses } from '@erp/database';

/**
 * Service to manage inventory and stock levels
 */
export class InventoryService {
  constructor(private db: NodePgDatabase<any>) {}

  /**
   * Retrieves the current available stock for a given product variant across all warehouses.
   */
  async getAvailableStock(tenantId: string, variantId: string) {
    const result = await this.db
      .select({
        totalQuantity: sql<number>`sum(${stockLevels.quantity})`.mapWith(Number)
      })
      .from(stockLevels)
      .where(
        and(
          eq(stockLevels.tenantId, tenantId),
          eq(stockLevels.variantId, variantId)
        )
      );

    return result[0]?.totalQuantity || 0;
  }

  /**
   * Decrements stock for a given variant across warehouses (FIFO or specific warehouse).
   * For simplicity in this base implementation, we decrement from the primary warehouse.
   */
  async decrementStock(tenantId: string, variantId: string, quantity: number, warehouseId: string) {
    if (quantity <= 0) throw new Error("Quantity to decrement must be positive.");

    // Simple optimistic atomic decrement
    await this.db
      .update(stockLevels)
      .set({ quantity: sql`${stockLevels.quantity} - ${quantity}` })
      .where(
        and(
          eq(stockLevels.tenantId, tenantId),
          eq(stockLevels.variantId, variantId),
          eq(stockLevels.warehouseId, warehouseId)
        )
      );
  }
}
