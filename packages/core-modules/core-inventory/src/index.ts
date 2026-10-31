import Decimal from 'decimal.js';
import { eq, and, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { stockLevels } from '@zynveo/database';

export interface WacCalculationResult {
  newQuantityOnHand: string;
  newWac: string;
  receiptValuation: string;
}

/**
 * Pure Decimal Weighted Average Cost (WAC) calculator:
 * New WAC = ((CurrentQty * CurrentWAC) + (ReceivedQty * ReceivedUnitCost)) / (CurrentQty + ReceivedQty)
 */
export function calculateWeightedAverageCost(
  currentOnHandQty: string,
  currentWac: string,
  receivedQty: string,
  receivedUnitCost: string,
): WacCalculationResult {
  const curQty = new Decimal(currentOnHandQty || '0');
  const curCost = new Decimal(currentWac || '0');
  const recQty = new Decimal(receivedQty);
  const recCost = new Decimal(receivedUnitCost);

  if (recQty.lte(0)) {
    throw new Error('Received quantity must be strictly positive.');
  }
  if (recCost.isNegative()) {
    throw new Error('Received unit cost cannot be negative.');
  }

  const effectiveCurQty = curQty.gt(0) ? curQty : new Decimal(0);
  const currentValuation = effectiveCurQty.mul(curCost);
  const receiptValuation = recQty.mul(recCost);
  const newQty = curQty.plus(recQty);

  const newWac = newQty.gt(0)
    ? currentValuation.plus(receiptValuation).div(newQty).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    : recCost.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  return {
    newQuantityOnHand: newQty.toDecimalPlaces(4, Decimal.ROUND_HALF_UP).toFixed(4),
    newWac: newWac.toFixed(2),
    receiptValuation: receiptValuation.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2),
  };
}

/**
 * Pure Decimal COGS valuation for stock dispatch (`dispatchedQty * currentWac`).
 */
export function calculateDispatchCogs(dispatchedQty: string, currentWac: string): {
  unitCost: string;
  totalCogs: string;
} {
  const qty = new Decimal(dispatchedQty);
  const wac = new Decimal(currentWac || '0').toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  if (qty.lte(0)) {
    throw new Error('Dispatched quantity must be strictly positive.');
  }
  const totalCogs = qty.mul(wac).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  return {
    unitCost: wac.toFixed(2),
    totalCogs: totalCogs.toFixed(2),
  };
}

export interface BatchCandidate {
  id: string;
  batchNumber: string;
  quantityAvailable: string;
  expiryDate?: Date | string | null;
}

export interface AllocatedBatchSlice {
  batchId: string;
  batchNumber: string;
  allocatedQty: string;
  remainingBatchQty: string;
}

/**
 * First-Expired, First-Out (FEFO) batch allocator using exact Decimal(15,4) quantities.
 */
export function allocateFefoBatches(
  batches: BatchCandidate[],
  requestedQty: string,
  referenceDate: Date = new Date(),
): AllocatedBatchSlice[] {
  let remainingToAllocate = new Decimal(requestedQty);
  if (remainingToAllocate.lte(0)) {
    throw new Error('Requested FEFO allocation quantity must be positive.');
  }

  const validBatches = batches
    .filter((b) => {
      const avail = new Decimal(b.quantityAvailable || '0');
      if (avail.lte(0)) return false;
      if (b.expiryDate) {
        const exp = b.expiryDate instanceof Date ? b.expiryDate : new Date(b.expiryDate);
        if (exp.getTime() < referenceDate.getTime()) {
          return false; // Skip expired lots
        }
      }
      return true;
    })
    .sort((a, b) => {
      const aTime = a.expiryDate
        ? (a.expiryDate instanceof Date ? a.expiryDate : new Date(a.expiryDate)).getTime()
        : Number.MAX_SAFE_INTEGER;
      const bTime = b.expiryDate
        ? (b.expiryDate instanceof Date ? b.expiryDate : new Date(b.expiryDate)).getTime()
        : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });

  const allocations: AllocatedBatchSlice[] = [];

  for (const batch of validBatches) {
    if (remainingToAllocate.lte(0)) break;
    const avail = new Decimal(batch.quantityAvailable);
    const take = avail.lte(remainingToAllocate) ? avail : remainingToAllocate;
    const remainingBatch = avail.minus(take);

    allocations.push({
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      allocatedQty: take.toDecimalPlaces(4, Decimal.ROUND_HALF_UP).toFixed(4),
      remainingBatchQty: remainingBatch.toDecimalPlaces(4, Decimal.ROUND_HALF_UP).toFixed(4),
    });

    remainingToAllocate = remainingToAllocate.minus(take);
  }

  if (remainingToAllocate.gt(0)) {
    throw new Error(
      `Insufficient non-expired batch stock for FEFO allocation: short by ${remainingToAllocate.toFixed(4)} units.`,
    );
  }

  return allocations;
}

/**
 * Legacy helper class preserved for backwards compatibility with apps/web.
 */
export class InventoryService {
  constructor(private db: any) {}

  async getAvailableStock(tenantId: string, variantId: string) {
    const sl = stockLevels as any;
    const result = await this.db
      .select({
        totalQuantity: sql<number>`sum(${sl.quantity})`.mapWith(Number),
      })
      .from(sl)
      .where(and(eq(sl.tenantId, tenantId), eq(sl.variantId, variantId)));

    return result[0]?.totalQuantity || 0;
  }

  async decrementStock(tenantId: string, variantId: string, quantity: number, warehouseId: string) {
    if (quantity <= 0) throw new Error('Quantity to decrement must be positive.');
    const sl = stockLevels as any;

    await this.db
      .update(sl)
      .set({ quantity: sql`${sl.quantity} - ${quantity}` })
      .where(
        and(
          eq(sl.tenantId, tenantId),
          eq(sl.variantId, variantId),
          eq(sl.warehouseId, warehouseId),
        ),
      );
  }
}
