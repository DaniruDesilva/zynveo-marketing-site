import React from 'react';
import ProductsClient from './ProductsClient';

export const metadata = {
  title: 'Product Catalog Management | Zynveo ERP',
  description: 'Manage product catalogs, update pricing, and categorize offerings',
};

export default function ProductsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Product & Services Management</h1>
        <p className="text-sm text-slate-500">
          Centralized interface to organize and maintain product catalogues, update pricing, and categorize offerings.
        </p>
      </div>

      <ProductsClient />
    </div>
  );
}
