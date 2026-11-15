"use client";

import React, { useState, useEffect, useCallback } from "react";
import Decimal from "decimal.js";
import { erpApi } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@zynveo/ui";
import { Plus, Edit2, Trash2, PackageSearch, XCircle, Search, AlertCircle, RefreshCw } from "lucide-react";

interface ProductRow {
  id: string;
  variantId: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  price: string;
  cost: string;
  wacCost: string;
  stock: string;
  reserved: string;
  reorderThreshold: string;
  isActive: boolean;
}

export default function ProductsClient() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0.00");
  const [cost, setCost] = useState("0.00");
  const [category, setCategory] = useState("General");
  const [reorderThreshold, setReorderThreshold] = useState("10.0000");
  const [saving, setSaving] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await erpApi.inventory.listProducts();
      setProducts(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load products from API Gateway.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const resetForm = () => {
    setName("");
    setSku("");
    setDescription("");
    setPrice("0.00");
    setCost("0.00");
    setCategory("General");
    setReorderThreshold("10.0000");
    setEditingProduct(null);
    setIsModalOpen(false);
  };

  const handleEdit = (product: ProductRow) => {
    setEditingProduct(product);
    setName(product.name);
    setSku(product.sku);
    setDescription(product.description || "");
    setPrice(new Decimal(product.price || 0).toFixed(2));
    setCost(new Decimal(product.cost || 0).toFixed(2));
    setCategory(product.category || "General");
    setReorderThreshold(new Decimal(product.reorderThreshold || 10).toFixed(4));
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const parsedPrice = new Decimal(price || 0).toFixed(2);
      const parsedCost = new Decimal(cost || 0).toFixed(2);
      const parsedThreshold = new Decimal(reorderThreshold || 10).toFixed(4);

      if (editingProduct) {
        await erpApi.inventory.updateProduct(editingProduct.id, {
          name: name.trim(),
          sku: sku.trim(),
          description: description.trim() || undefined,
          price: parsedPrice,
          cost: parsedCost,
          category: category.trim() || "General",
          reorderThreshold: parsedThreshold,
        });
      } else {
        await erpApi.inventory.createProduct({
          name: name.trim(),
          sku: sku.trim(),
          description: description.trim() || undefined,
          price: parsedPrice,
          cost: parsedCost,
          category: category.trim() || "General",
          reorderThreshold: parsedThreshold,
          initialStock: "0.0000",
        });
      }

      resetForm();
      await fetchProducts();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmSoftDelete = async (id: string) => {
    setError(null);
    try {
      await erpApi.inventory.softDeleteProduct(id);
      setPendingDeleteId(null);
      await fetchProducts();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to archive product.");
    }
  };

  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  });

  const formatMoney = (val: string) =>
    Number(new Decimal(val || 0).toFixed(2)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search products by name, SKU, or category..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="pl-10 bg-slate-50 border-slate-200 text-slate-800"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={fetchProducts}
            disabled={loading}
            className="border-slate-200 text-slate-600"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            type="button"
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" /> Add New Product
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-slate-800 flex items-center gap-2">
            <PackageSearch className="h-5 w-5 text-blue-600" />
            Product Catalog ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="border-slate-200">
                  <TableHead className="text-slate-600">Name</TableHead>
                  <TableHead className="text-slate-600">SKU</TableHead>
                  <TableHead className="text-slate-600">Category</TableHead>
                  <TableHead className="text-slate-600 text-right">Stock</TableHead>
                  <TableHead className="text-slate-600 text-right">Unit Cost</TableHead>
                  <TableHead className="text-slate-600 text-right">Selling Price</TableHead>
                  <TableHead className="text-slate-600 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-slate-400">
                      Loading catalog...
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-slate-400">
                      No active products found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id} className="border-slate-100 hover:bg-slate-50 transition-colors">
                      <TableCell className="font-medium text-slate-800">
                        <div>{product.name}</div>
                        {product.description && (
                          <div className="text-xs text-slate-400 line-clamp-1">{product.description}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-mono">
                          {product.sku}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {product.category || "General"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-slate-700">
                        {new Decimal(product.stock || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-slate-600">
                        LKR {formatMoney(product.wacCost || product.cost)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium text-slate-800">
                        LKR {formatMoney(product.price)}
                      </TableCell>
                      <TableCell className="text-right">
                        {pendingDeleteId === product.id ? (
                          <div className="flex justify-end items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleConfirmSoftDelete(product.id)}
                              className="px-2 py-1 text-xs font-semibold bg-rose-600 text-white rounded hover:bg-rose-700"
                            >
                              Archive
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingDeleteId(null)}
                              className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(product)}
                              className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 h-8 w-8 p-0"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setPendingDeleteId(product.id)}
                              className="text-slate-500 hover:text-rose-600 hover:bg-rose-50 h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <button type="button" onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Product Name *</label>
                <Input
                  required
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  className="bg-white border-slate-200 text-slate-800"
                  placeholder="e.g. Premium Wireless Headphones"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">SKU *</label>
                  <Input
                    required
                    value={sku}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSku(e.target.value)}
                    className="bg-white border-slate-200 text-slate-800 font-mono"
                    placeholder="e.g. PRD-001"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">Category</label>
                  <Input
                    value={category}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCategory(e.target.value)}
                    className="bg-white border-slate-200 text-slate-800"
                    placeholder="e.g. Electronics"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">Unit Cost (LKR)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cost}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCost(e.target.value)}
                    className="bg-white border-slate-200 text-slate-800 font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">Selling Price (LKR)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrice(e.target.value)}
                    className="bg-white border-slate-200 text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Reorder Threshold</label>
                <Input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={reorderThreshold}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReorderThreshold(e.target.value)}
                  className="bg-white border-slate-200 text-slate-800 font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Description</label>
                <textarea
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                  className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  placeholder="Product description..."
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {saving ? "Saving..." : editingProduct ? "Save Changes" : "Create Product"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
