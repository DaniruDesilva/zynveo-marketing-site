import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getTableConfig, PgTable } from 'drizzle-orm/pg-core';
import { is } from 'drizzle-orm';
import * as iam from '../schemas/iam';
import * as finance from '../schemas/finance';
import * as hr from '../schemas/hr';
import * as scm from '../schemas/scm';
import * as inventory from '../schemas/inventory';
import * as manufacturing from '../schemas/manufacturing';
import * as salesCrm from '../schemas/sales_crm';
import * as bi from '../schemas/bi';

const SCHEMA_MODULES: Record<string, Record<string, unknown>> = {
  iam,
  finance,
  hr,
  scm,
  inventory,
  manufacturing,
  sales_crm: salesCrm,
  bi,
};

function extractTables(mod: Record<string, unknown>): PgTable[] {
  const seen = new Set<PgTable>();
  for (const val of Object.values(mod)) {
    if (is(val, PgTable)) {
      seen.add(val);
    }
  }
  return Array.from(seen);
}

describe('@zynveo/database isolated pgSchema() verification', () => {
  it('assigns every table to its owning microservice pgSchema()', () => {
    for (const [expectedSchema, mod] of Object.entries(SCHEMA_MODULES)) {
      const tables = extractTables(mod);
      assert.ok(tables.length > 0, `Schema ${expectedSchema} should export at least 1 table`);
      for (const tbl of tables) {
        const cfg = getTableConfig(tbl);
        assert.equal(
          cfg.schema,
          expectedSchema,
          `Table ${cfg.name} has schema "${cfg.schema}", expected "${expectedSchema}"`,
        );
      }
    }
  });

  it('enforces zero cross-schema foreign key locks across all 8 schemas', () => {
    for (const [schemaName, mod] of Object.entries(SCHEMA_MODULES)) {
      const tables = extractTables(mod);
      for (const tbl of tables) {
        const cfg = getTableConfig(tbl);
        for (const fk of cfg.foreignKeys) {
          const ref = fk.reference();
          const foreignCfg = getTableConfig(ref.foreignTable);
          assert.equal(
            foreignCfg.schema,
            schemaName,
            `Cross-schema FK violation: ${schemaName}.${cfg.name} references ${foreignCfg.schema}.${foreignCfg.name}`,
          );
        }
      }
    }
  });

  it('includes outbox_events and processed_events in every write schema', () => {
    const writeSchemas = ['iam', 'finance', 'hr', 'scm', 'inventory', 'manufacturing', 'sales_crm'];
    for (const schemaName of writeSchemas) {
      const tableNames = extractTables(SCHEMA_MODULES[schemaName]).map((t) => getTableConfig(t).name);
      assert.ok(
        tableNames.includes('outbox_events'),
        `Missing ${schemaName}.outbox_events`,
      );
      assert.ok(
        tableNames.includes('processed_events'),
        `Missing ${schemaName}.processed_events`,
      );
    }
    const biTables = extractTables(SCHEMA_MODULES.bi).map((t) => getTableConfig(t).name);
    assert.ok(biTables.includes('processed_events'), 'Missing bi.processed_events');
  });

  it('enforces mandatory audit & soft-delete columns on operational tables', () => {
    const rootTablesWithoutTenantId = new Set(['tenants', 'users']);
    const infraTables = new Set(['outbox_events', 'processed_events']);

    for (const [schemaName, mod] of Object.entries(SCHEMA_MODULES)) {
      for (const tbl of extractTables(mod)) {
        const cfg = getTableConfig(tbl);
        if (infraTables.has(cfg.name)) continue;

        const colNames = cfg.columns.map((c) => c.name);
        assert.ok(colNames.includes('id'), `${schemaName}.${cfg.name} missing id`);
        assert.ok(colNames.includes('created_at'), `${schemaName}.${cfg.name} missing created_at`);
        assert.ok(colNames.includes('updated_at'), `${schemaName}.${cfg.name} missing updated_at`);
        assert.ok(colNames.includes('deleted_at'), `${schemaName}.${cfg.name} missing deleted_at (Soft Delete)`);

        if (!rootTablesWithoutTenantId.has(cfg.name)) {
          assert.ok(colNames.includes('tenant_id'), `${schemaName}.${cfg.name} missing tenant_id`);
        }
      }
    }
  });
});

