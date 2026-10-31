# Zynveo Cloud OS (Enterprise ERP) — Antigravity Architectural Rules

## 1. System Architecture & Monorepo Boundaries
- **Pattern:** Distributed Microservices Architecture with a centralized API Gateway (`apps/api-gateway`) and 7 domain microservices inside `apps/services/svc-*`.
- **Transport Layer:** `@nestjs/microservices` using `Transport.REDIS` for asynchronous Event-Driven Pub/Sub (`@EventPattern`) and synchronous RPC commands (`@MessagePattern`).
- **Strict Isolation Rule:** Microservices (`apps/services/svc-*`) MUST NEVER import code, services, or controllers from another microservice. All inter-service communication MUST strictly use DTOs, Zod schemas, and pattern constants exported from `@zynveo/contracts`.

## 2. Database & Multi-Tenancy Standards (`@zynveo/database`)
- **Single Shared Database, Isolated Schemas:** Every microservice owns its own isolated PostgreSQL schema using Drizzle ORM's `pgSchema()`:
  1. `iam` (`svc-iam-tenant`)
  2. `finance` (`svc-finance`)
  3. `hr` (`svc-hr-payroll`)
  4. `scm` (`svc-procurement`)
  5. `inventory` (`svc-inventory-wms`)
  6. `manufacturing` (`svc-manufacturing`)
  7. `sales_crm` (`svc-crm-sales`)
  8. `bi` (`svc-bi-reporting` — read-only Materialized Views)
- **Zero Cross-Schema Joins in Write Services:** A microservice may only perform `INSERT`, `UPDATE`, or `DELETE` within its own `pgSchema`. Cross-service references (e.g., `productId` inside `sales_crm.invoice_lines`) are stored as logical `uuid` columns without cross-schema foreign key locks.
- **Mandatory Audit & Tenant Columns:** Every operational table MUST include:
  - `id: uuid('id').defaultRandom().primaryKey()`
  - `tenantId: uuid('tenant_id').notNull()`
  - `createdAt: timestamp('created_at').defaultNow().notNull()`
  - `updatedAt: timestamp('updated_at').defaultNow().notNull()`
  - `deletedAt: timestamp('deleted_at')` (Soft Delete — NEVER execute hard SQL `DELETE` on financial, inventory, or ERP document records).

## 3. Financial & Inventory Mathematical Integrity
- **No Floating-Point Math:** NEVER use native JavaScript `number` arithmetic (`+`, `-`, `*`, `/`) or SQL `FLOAT`/`REAL` for currency, tax, cost, or BOM ratios.
- **Drizzle Column Types:** Use `numeric(15, 2)` for currency/monetary fields and `numeric(15, 4)` for unit quantities and BOM conversion ratios.
- **Runtime Calculation:** Always use `Decimal` from `decimal.js` inside services before persisting to PostgreSQL.
- **Double-Entry Invariant:** Any operation in `svc-finance` writing to `journal_lines` MUST verify that `Sum(Debits).equals(Sum(Credits))` inside a PostgreSQL `db.transaction()`.
- **Immutable Stock Ledger:** Never mutate `inventory.stock_levels` directly without inserting a corresponding row into `inventory.stock_movements` within the same ACID transaction using `SELECT ... FOR UPDATE` row locking.

## 4. Distributed Transactions (Saga, Outbox & Idempotent Inbox Pattern)
- **Transactional Outbox:** Whenever a microservice mutates state AND emits an event to another microservice (e.g., finalizing an invoice, approving a GRN, completing a Work Order), it MUST write the event payload to its local schema's `outbox_events` table inside the exact same Drizzle `db.transaction(async (tx) => { ... })`.
- **Outbox Polling:** The `OutboxRelayWorker` MUST poll `outbox_events` using `SELECT ... FOR UPDATE SKIP LOCKED` (compatible with connection poolers) and fan out jobs to durable **BullMQ** queues.
- **Durable Event Delivery & Idempotent Consumers:** Synchronous RPC commands (`@MessagePattern`) use NestJS `Transport.REDIS`, while asynchronous domain events MUST be delivered via **BullMQ** (at-least-once delivery with retries and DLQ). Every event/job consumer MUST enforce idempotency by recording `event_id` in its local schema's `processed_events` inbox table inside the handler's database transaction.

## 5. Frontend (`apps/web`) Rules
- **Offline-First Reads:** Query local SQLite WASM via `@zynveo/sync` (PowerSync) for instant table/dashboard rendering.
- **Mutations:** Route all state-changing ERP transactions (`POST`, `PATCH`) through `apps/api-gateway` validated with `@zynveo/contracts` Zod schemas. Never trust client-supplied prices, ordered quantities, or tenant/user IDs—authoritative pricing/quantities are loaded by the owning service from its database, and `TenantContext` is injected strictly by `apps/api-gateway` from the verified JWT.