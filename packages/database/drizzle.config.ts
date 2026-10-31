import type { Config } from 'drizzle-kit';

export default {
  schema: './src/schemas/index.ts',
  out: './migrations',
  driver: 'pg',
  schemaFilter: [
    'iam',
    'finance',
    'hr',
    'scm',
    'inventory',
    'manufacturing',
    'sales_crm',
    'bi',
  ],
  dbCredentials: {
    connectionString:
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5433/zynveo_erp',
  },
} satisfies Config;
