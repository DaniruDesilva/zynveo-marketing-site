import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { tenants } from "./schema/tenant";
import { products, productVariants, warehouses, stockLevels } from "./schema/inventory";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Seeding database...");
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/erp",
  });
  const db = drizzle(pool, { schema });

  // 1. Create a Tenant
  const [tenant] = await db.insert(tenants).values({
    name: "Acme Corporation",
    slug: "acme-corp",
  }).onConflictDoNothing().returning();

  let tenantId = tenant?.id;

  if (!tenantId) {
    const existing = await db.select().from(tenants).where(eq(tenants.slug, "acme-corp")).limit(1);
    tenantId = existing[0].id;
  }

  // 2. Create a Warehouse
  const [warehouse] = await db.insert(warehouses).values({
    tenantId,
    name: "Main Distribution Center",
    location: "New York, NY",
  }).returning();

  // 3. Create Products
  const [prod1, prod2] = await db.insert(products).values([
    {
      tenantId,
      name: "Premium Wireless Headphones",
      description: "Noise-cancelling wireless headphones with 40h battery life.",
      category: "Electronics",
      brand: "AudioTech",
    },
    {
      tenantId,
      name: "Ergonomic Office Chair",
      description: "Mesh office chair with lumbar support.",
      category: "Furniture",
      brand: "OfficePro",
    }
  ]).returning();

  // 4. Create Product Variants
  const [var1, var2] = await db.insert(productVariants).values([
    {
      tenantId,
      productId: prod1.id,
      sku: "AUD-WH-001",
      name: "Black",
      price: "299.99",
      cost: "120.00",
    },
    {
      tenantId,
      productId: prod2.id,
      sku: "FUR-OC-099",
      name: "Standard Gray",
      price: "450.00",
      cost: "200.00",
    }
  ]).returning();

  // 5. Set Stock Levels
  await db.insert(stockLevels).values([
    {
      tenantId,
      variantId: var1.id,
      warehouseId: warehouse.id,
      quantity: "145",
    },
    {
      tenantId,
      variantId: var2.id,
      warehouseId: warehouse.id,
      quantity: "0",
    }
  ]);

  console.log("Seeding complete!");
  process.exit(0);
}

main().catch((e) => {
  console.error("Seeding failed:");
  console.error(e);
  process.exit(1);
});
