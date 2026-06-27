"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  Card, CardContent, CardHeader, CardTitle, 
  Button, Input, Table, TableHeader, TableRow, TableHead, TableBody, TableCell 
} from '@erp/ui';
import { Plus, Edit2, Trash2, PackageSearch, Image as ImageIcon, CheckCircle, XCircle, Search } from 'lucide-react';

export default function ProductsClient() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  
  // Form states
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProducts();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('public:products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload: any) => {
        fetchProducts(); // Refresh list on any change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setName("");
    setSku("");
    setDescription("");
    setPrice("");
    setCategory("");
    setImageFile(null);
    setEditingProduct(null);
    setIsModalOpen(false);
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setName(product.name);
    setSku(product.sku);
    setDescription(product.description || "");
    setPrice(product.price?.toString() || "");
    setCategory(product.category || "");
    setIsModalOpen(true);
  };

  const handleImageUpload = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSave = async () => {
    setUploading(true);
    let imageUrl = editingProduct?.image_url || null;

    try {
      if (imageFile) {
        imageUrl = await handleImageUpload(imageFile);
      }

      const productData = {
        name,
        sku,
        description,
        price: parseFloat(price) || 0,
        category,
        image_url: imageUrl,
      };

      if (editingProduct) {
        await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
      } else {
        await supabase
          .from('products')
          .insert([productData]);
      }

      resetForm();
    } catch (err) {
      console.error("Error saving product:", err);
      alert("Failed to save product.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      await supabase.from('products').delete().eq('id', id);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search products by name, SKU, or category..." 
            value={search}
            onChange={(e: any) => setSearch(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-700 text-white"
          />
        </div>
        <Button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-900/20"
        >
          <Plus className="mr-2 h-4 w-4" /> Add New Product
        </Button>
      </div>

      {/* Product List */}
      <Card className="bg-slate-900/50 border-slate-800 shadow-xl backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-xl text-slate-100 flex items-center gap-2">
            <PackageSearch className="h-5 w-5 text-blue-400" />
            Product Catalog
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-800 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-800/80">
                <TableRow className="border-slate-800 hover:bg-slate-800/80">
                  <TableHead className="text-slate-300">Image</TableHead>
                  <TableHead className="text-slate-300">Name</TableHead>
                  <TableHead className="text-slate-300">SKU</TableHead>
                  <TableHead className="text-slate-300">Category</TableHead>
                  <TableHead className="text-slate-300 text-right">Price</TableHead>
                  <TableHead className="text-slate-300 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-slate-400">Loading catalog...</TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-slate-400">No products found.</TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id} className="border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <TableCell>
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="h-10 w-10 rounded-md object-cover border border-slate-700" />
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-slate-800 flex items-center justify-center border border-slate-700">
                            <ImageIcon className="h-4 w-4 text-slate-500" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-slate-200">{product.name}</TableCell>
                      <TableCell className="text-slate-400"><span className="bg-slate-800 px-2 py-1 rounded text-xs font-mono">{product.sku}</span></TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-900/30 text-indigo-300 border border-indigo-800/50">
                          {product.category || "Uncategorized"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium text-slate-200">${product.price?.toFixed(2) || "0.00"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(product)} className="text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 h-8 w-8 p-0">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)} className="text-slate-400 hover:text-red-400 hover:bg-red-400/10 h-8 w-8 p-0">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal for Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
              <h2 className="text-xl font-semibold text-white">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-slate-700 text-slate-400" onClick={resetForm}>
                <XCircle className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-6 overflow-y-auto flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">Product Name</label>
                <Input value={name} onChange={(e: any) => setName(e.target.value)} className="bg-slate-950 border-slate-700 text-white" placeholder="e.g. Premium Wireless Headphones" />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">SKU</label>
                <Input value={sku} onChange={(e: any) => setSku(e.target.value)} className="bg-slate-950 border-slate-700 text-white font-mono" placeholder="e.g. PRD-001" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">Category</label>
                <Input value={category} onChange={(e: any) => setCategory(e.target.value)} className="bg-slate-950 border-slate-700 text-white" placeholder="e.g. Electronics" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">Price ($)</label>
                <Input type="number" step="0.01" value={price} onChange={(e: any) => setPrice(e.target.value)} className="bg-slate-950 border-slate-700 text-white" placeholder="0.00" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">Description</label>
                <textarea 
                  value={description} 
                  onChange={(e: any) => setDescription(e.target.value)} 
                  className="flex min-h-[80px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" 
                  placeholder="Product description..."
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">Product Image</label>
                <div className="flex items-center gap-3">
                  <Input 
                    type="file" 
                    accept="image/*"
                    onChange={(e: any) => e.target.files && setImageFile(e.target.files[0])} 
                    className="bg-slate-950 border-slate-700 text-slate-300 file:bg-slate-800 file:text-slate-200 file:border-0 file:rounded file:px-2 file:py-1 file:mr-2 hover:file:bg-slate-700 cursor-pointer" 
                  />
                  {editingProduct?.image_url && !imageFile && (
                    <img src={editingProduct.image_url} alt="Current" className="h-10 w-10 rounded border border-slate-700 object-cover" />
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex justify-end gap-3">
              <Button variant="outline" onClick={resetForm} className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={uploading || !name || !sku}
                className="bg-blue-600 hover:bg-blue-500 text-white"
              >
                {uploading ? "Saving..." : editingProduct ? "Save Changes" : "Create Product"}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
