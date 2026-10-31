import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
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
      .where(eq(tenants.slug, 'acme-corp'))
      .limit(1);
    tenantId = existing[0].id;
  }

  // 2. Seed Default Chart of Accounts (`finance.accounts`)
  await db
    .insert(accounts)
    .values([
      {
        tenantId,
        code: '1100',
        name: 'Accounts Receivable',
        type: 'ASSET',
        normalBalance: 'DEBIT',
      },
      {
        tenantId,
        code: '1300',
        name: 'Inventory Asset',
        type: 'ASSET',
        normalBalance: 'DEBIT',
      },
      {
        tenantId,
        code: '2100',
        name: 'Accounts Payable',
        type: 'LIABILITY',
        normalBalance: 'CREDIT',
      },
      {
        tenantId,
        code: '2200',
        name: 'Tax Payable (VAT)',
        type: 'LIABILITY',
        normalBalance: 'CREDIT',
      },
      {
        tenantId,
        code: '4000',
        name: 'Sales Revenue',
        type: 'REVENUE',
        normalBalance: 'CREDIT',
      },
      {
        tenantId,
        code: '5000',
        name: 'Cost of Goods Sold (COGS)',
        type: 'EXPENSE',
        normalBalance: 'DEBIT',
      },
    ])
    .onConflictDoNothing();

  // 3. Create Primary Warehouse (`inventory.warehouses`)
  const [warehouse] = await db
    .insert(warehouses)
    .values({
      tenantId,
      code: 'WH-COL-01',
      name: 'Main Distribution Center',
      location: 'Colombo, Sri Lanka',
    })
    .returning();

  // 4. Create Products (`inventory.products`)
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

  // 5. Create Product Variants (`inventory.product_variants`)
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

  // 6. Set Stock Levels & Opening Stock Movements inside an ACID transaction
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

  console.log('Seeding complete!');
  await pool.end();
  process.exit(0);
}

main().catch((e) => {
  console.error('Seeding failed:');
  console.error(e);
  process.exit(1);
});
