import React from 'react';
import ProductsClient from './ProductsClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@erp/ui';

export const metadata = {
  title: 'Product Catalog Management | Delight ERP',
  description: 'Manage product catalogs, update pricing, and categorize offerings',
};

export default function ProductsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Product & Services Management</h1>
        <p className="text-muted-foreground">
          Centralized interface to organize and maintain product catalogues, update pricing, and categorize offerings.
        </p>
      </div>

      <ProductsClient />
    </div>
  );
}
