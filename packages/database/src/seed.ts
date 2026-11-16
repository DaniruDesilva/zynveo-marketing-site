import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { and, eq, isNull } from 'drizzle-orm';
import * as schema from './schemas';
import { tenants } from './schemas/iam';
import {
  products,
  productVariants,
  warehouses,
  stockLevels,
  stockMovements,
} from './schemas/inventory';
import { accounts } from './schemas/finance';

const DEFAULT_COA_SPECS = [
  { code: '1000', name: 'Cash & Bank', type: 'ASSET' as const, normalBalance: 'DEBIT' as const },
  { code: '1100', name: 'Accounts Receivable', type: 'ASSET' as const, normalBalance: 'DEBIT' as const },
  { code: '1300', name: 'Inventory Asset', type: 'ASSET' as const, normalBalance: 'DEBIT' as const },
  { code: '2000', name: 'Accounts Payable (GRNI)', type: 'LIABILITY' as const, normalBalance: 'CREDIT' as const },
  { code: '2100', name: 'Output Tax Payable', type: 'LIABILITY' as const, normalBalance: 'CREDIT' as const },
  { code: '2200', name: 'Net Salaries Payable', type: 'LIABILITY' as const, normalBalance: 'CREDIT' as const },
  { code: '2210', name: 'Statutory EPF/ETF/APIT Payable', type: 'LIABILITY' as const, normalBalance: 'CREDIT' as const },
  { code: '3000', name: 'Retained Earnings', type: 'EQUITY' as const, normalBalance: 'CREDIT' as const },
  { code: '4000', name: 'Sales Revenue', type: 'REVENUE' as const, normalBalance: 'CREDIT' as const },
  { code: '5000', name: 'Cost of Goods Sold', type: 'EXPENSE' as const, normalBalance: 'DEBIT' as const },
  { code: '5100', name: 'Production Absorption / WIP', type: 'EXPENSE' as const, normalBalance: 'CREDIT' as const },
  { code: '5200', name: 'Salaries & Wages Expense', type: 'EXPENSE' as const, normalBalance: 'DEBIT' as const },
  { code: '5210', name: 'Employer EPF/ETF Contribution Expense', type: 'EXPENSE' as const, normalBalance: 'DEBIT' as const },
];

async function main() {
  console.log('Seeding Zynveo ERP multi-schema database...');
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5433/zynveo_erp',
  });
  const db = drizzle(pool, { schema });

  // 1. Create or Resolve Default Tenant (`iam.tenants`)
  const [insertedTenant] = await db
    .insert(tenants)
    .values({
      name: 'Acme Corporation',
      slug: 'acme-corp',
      baseCurrency: 'LKR',
    })
    .onConflictDoNothing()
    .returning();

  let tenantId = insertedTenant?.id;

  if (!tenantId) {
    const existing = await db
      .select()
      .from(tenants)
      .where(and(eq(tenants.slug, 'acme-corp'), isNull(tenants.deletedAt)))
      .limit(1);
    tenantId = existing[0].id;
  }

  // 2. Seed Canonical Chart of Accounts (`finance.accounts`, aligned with svc-finance)
  const existingAccounts = await db
    .select({ code: accounts.code })
    .from(accounts)
    .where(and(eq(accounts.tenantId, tenantId), isNull(accounts.deletedAt)));
  const existingCodes = new Set(existingAccounts.map((a) => a.code));

  const missingAccounts = DEFAULT_COA_SPECS.filter((spec) => !existingCodes.has(spec.code));
  if (missingAccounts.length > 0) {
    await db.insert(accounts).values(
      missingAccounts.map((spec) => ({
        tenantId,
        code: spec.code,
        name: spec.name,
        type: spec.type,
        normalBalance: spec.normalBalance,
      })),
    );
  }

  // 3. Create or Resolve Primary Warehouse (`inventory.warehouses`)
  const existingWarehouses = await db
    .select()
    .from(warehouses)
    .where(
      and(
        eq(warehouses.tenantId, tenantId),
        eq(warehouses.code, 'WH-COL-01'),
        isNull(warehouses.deletedAt),
      ),
    )
    .limit(1);

  const warehouse =
    existingWarehouses[0] ??
    (
      await db
        .insert(warehouses)
        .values({
          tenantId,
          code: 'WH-COL-01',
          name: 'Main Distribution Center',
          location: 'Colombo, Sri Lanka',
        })
        .returning()
    )[0];

  // 4. Create Sample Products/Variants/Stock only if SKU does not already exist for this tenant
  const existingVariants = await db
    .select({ sku: productVariants.sku })
    .from(productVariants)
    .where(and(eq(productVariants.tenantId, tenantId), isNull(productVariants.deletedAt)));
  const existingSkus = new Set(existingVariants.map((v) => v.sku));

  if (!existingSkus.has('AUD-WH-001') && !existingSkus.has('FUR-OC-099')) {
    const [prod1, prod2] = await db
      .insert(products)
      .values([
        {
          tenantId,
          name: 'Premium Wireless Headphones',
          description: 'Noise-cancelling wireless headphones with 40h battery life.',
          category: 'Electronics',
          brand: 'AudioTech',
          reorderThreshold: '15.0000',
        },
        {
          tenantId,
          name: 'Ergonomic Office Chair',
          description: 'Mesh office chair with lumbar support.',
          category: 'Furniture',
          brand: 'OfficePro',
          reorderThreshold: '5.0000',
        },
      ])
      .returning();

    const [var1, var2] = await db
      .insert(productVariants)
      .values([
        {
          tenantId,
          productId: prod1.id,
          sku: 'AUD-WH-001',
          name: 'Black',
          price: '299.99',
          cost: '120.00',
          wacCost: '120.00',
        },
        {
          tenantId,
          productId: prod2.id,
          sku: 'FUR-OC-099',
          name: 'Standard Gray',
          price: '450.00',
          cost: '200.00',
          wacCost: '200.00',
        },
      ])
      .returning();

    // 5. Set Stock Levels & Opening Stock Movements inside an ACID transaction
    await db.transaction(async (tx) => {
      await tx.insert(stockLevels).values([
        {
          tenantId,
          productId: prod1.id,
          variantId: var1.id,
          warehouseId: warehouse.id,
          quantity: '145.0000',
          unitWacCost: '120.00',
          batchNumber: 'BATCH-OPEN-001',
        },
        {
          tenantId,
          productId: prod2.id,
          variantId: var2.id,
          warehouseId: warehouse.id,
          quantity: '0.0000',
          unitWacCost: '200.00',
          batchNumber: 'BATCH-OPEN-002',
        },
      ]);

      await tx.insert(stockMovements).values([
        {
          tenantId,
          warehouseId: warehouse.id,
          productId: prod1.id,
          variantId: var1.id,
          reason: 'STOCK_ADJUSTMENT',
          referenceDocumentId: warehouse.id,
          batchNumber: 'BATCH-OPEN-001',
          quantityDelta: '145.0000',
          balanceAfter: '145.0000',
          unitCostAtMovement: '120.00',
          totalValuationDelta: '17400.00',
          notes: 'Opening seed inventory balance',
        },
      ]);
    });
  }

  console.log('Seeding complete!');
  await pool.end();
  process.exit(0);
}

main().catch((e) => {
  console.error('Seeding failed:');
  console.error(e);
  process.exit(1);
});
