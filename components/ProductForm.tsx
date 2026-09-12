'use client';

import { useTransition, useState, useRef, useMemo } from 'react';
import { createProductAction, updateProductAction } from '@/app/admin/actions';
import Link from 'next/link';
import { Save, Image as ImageIcon, Sparkles, FileText, Upload, Trash2, Loader2, Layers } from 'lucide-react';

interface CategoryData {
  id: string;
  name: string;
}

interface ProductFormProps {
  categories: CategoryData[];
  initialData?: {
    id: string;
    title: string;
    description: string;
    price: number;
    MRP: number;
    discount: number;
    SKU: string;
    categoryId: string;
    active: boolean;
    featured: boolean;
    trending: boolean;
    images: { url: string }[];
    inventory?: { quantity: number } | null;
    variants?: Array<{
      id: string;
      sizeId: string;
      price?: number | null;
      additionalPrice?: number | null;
      stock?: number;
      size?: {
        name: string;
        dimensions?: string;
      } | null;
    }>;
  };
}

export default function ProductForm({ categories, initialData }: ProductFormProps) {
  const isEdit = !!initialData;
  const [isPending, startTransition] = useTransition();

  // Combine client submit with useTransition for progress indicators
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Set checkboxes explicitly as strings
    formData.set('featured', e.currentTarget.featured.checked ? 'true' : 'false');
    formData.set('trending', e.currentTarget.trending.checked ? 'true' : 'false');
    if (isEdit) {
      formData.set('active', e.currentTarget.active.checked ? 'true' : 'false');
    }

    startTransition(async () => {
      let result;
      if (isEdit) {
        result = await updateProductAction(null, formData);
      } else {
        result = await createProductAction(null, formData);
      }

      if (result?.error) {
        alert(result.error);
      }
    });
  };

  const [imagesText, setImagesText] = useState(initialData?.images.map((img) => img.url).join('\n') || '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const imageUrls = useMemo(() => {
    return imagesText
      .split(/[\n,]/)
      .map((url) => url.trim())
      .filter((url) => url.length > 0);
  }, [imagesText]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (15MB limit matching API constraints)
    if (file.size > 15 * 1024 * 1024) {
      alert('File size exceeds the 15MB limit.');
      return;
    }

    // Validate MIME types
    const validMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validMimes.includes(file.type)) {
      alert('Invalid file type. Only PNG, JPG, JPEG, and WEBP are allowed.');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setImagesText((prev) => {
          const trimmed = prev.trim();
          return trimmed ? `${trimmed}\n${data.url}` : data.url;
        });
      } else {
        alert(data.error || 'Failed to upload image to Cloudinary.');
      }
    } catch (err) {
      console.error('File upload error:', err);
      alert('An unexpected network error occurred during upload.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteUrl = (indexToDelete: number) => {
    const updatedList = imageUrls.filter((_, idx) => idx !== indexToDelete);
    setImagesText(updatedList.join('\n'));
  };
  const currentStock = initialData?.inventory?.quantity ?? 0;

  const sizePrices = useMemo(() => {
    const defaults = {
      A6: 19,
      A5: 39,
      A4: 59,
      A3: 99,
    };

    if (!initialData?.variants || initialData.variants.length === 0) {
      return defaults;
    }

    const map: Record<string, number> = { ...defaults };
    for (const v of initialData.variants) {
      const sizeName = v.size?.name;
      if (sizeName && sizeName in map) {
        if (v.price !== null && v.price !== undefined) {
          map[sizeName] = v.price;
        } else {
          map[sizeName] = initialData.price + (v.additionalPrice || 0);
        }
      }
    }
    return map;
  }, [initialData]);

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      {isEdit && <input type="hidden" name="id" value={initialData.id} />}

      {/* Form Card */}
      <div className="bg-[#161616] border border-neutral-900 rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#C1121F]/5 blur-3xl pointer-events-none"></div>

        {/* Section: General Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-900 pb-3">
            <FileText className="w-4 h-4 text-[#C1121F]" />
            <h3 className="text-xs text-neutral-200 font-extrabold uppercase tracking-widest">
              General Information
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                Product Title / Name
              </label>
              <input
                type="text"
                name="title"
                defaultValue={initialData?.title || ''}
                required
                placeholder="e.g. Cyberpunk Samurai Redux"
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-900 rounded-xl text-xs text-white focus:outline-none focus:border-[#C1121F] transition-all"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                Poster Description
              </label>
              <textarea
                name="description"
                defaultValue={initialData?.description || ''}
                required
                rows={4}
                placeholder="Describe the cinematic design assets, paper grade details, and design inspirations..."
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-900 rounded-xl text-xs text-white focus:outline-none focus:border-[#C1121F] transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Section: Product-Specific Size Pricing */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#C1121F]" />
              <h3 className="text-xs text-neutral-200 font-extrabold uppercase tracking-widest">
                Product-Specific Size Pricing
              </h3>
            </div>
            <span className="text-[9px] text-[#FF4D4D] bg-[#C1121F]/10 border border-[#C1121F]/30 px-2 py-0.5 rounded font-black uppercase tracking-wider">
              Authoritative Variant Pricing
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* A6 Price */}
            <div className="bg-neutral-950 p-4 border border-neutral-900 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-white tracking-wide">A6</span>
                <span className="text-[9px] text-neutral-500 font-bold">10.5 × 14.8 cm</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-xs font-bold">₹</span>
                <input
                  type="number"
                  name="price_A6"
                  defaultValue={sizePrices.A6}
                  required
                  min="0"
                  step="1"
                  placeholder="19"
                  className="w-full pl-7 pr-3 py-2.5 bg-neutral-900 border border-neutral-800 focus:border-[#C1121F] rounded-xl text-xs text-white focus:outline-none transition-all font-mono font-bold"
                />
              </div>
              <p className="text-[9px] text-neutral-500">Default: ₹19</p>
            </div>

            {/* A5 Price */}
            <div className="bg-neutral-950 p-4 border border-neutral-900 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-white tracking-wide">A5</span>
                <span className="text-[9px] text-neutral-500 font-bold">14.8 × 21 cm</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-xs font-bold">₹</span>
                <input
                  type="number"
                  name="price_A5"
                  defaultValue={sizePrices.A5}
                  required
                  min="0"
                  step="1"
                  placeholder="39"
                  className="w-full pl-7 pr-3 py-2.5 bg-neutral-900 border border-neutral-800 focus:border-[#C1121F] rounded-xl text-xs text-white focus:outline-none transition-all font-mono font-bold"
                />
              </div>
              <p className="text-[9px] text-neutral-500">Default: ₹39</p>
            </div>

            {/* A4 Price */}
            <div className="bg-neutral-950 p-4 border border-neutral-900 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-white tracking-wide">A4 (Standard)</span>
                <span className="text-[9px] text-neutral-500 font-bold">21 × 29.7 cm</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-xs font-bold">₹</span>
                <input
                  type="number"
                  name="price_A4"
                  defaultValue={sizePrices.A4}
                  required
                  min="0"
                  step="1"
                  placeholder="59"
                  className="w-full pl-7 pr-3 py-2.5 bg-neutral-900 border border-neutral-800 focus:border-[#C1121F] rounded-xl text-xs text-white focus:outline-none transition-all font-mono font-bold"
                />
              </div>
              <p className="text-[9px] text-neutral-500">Default: ₹59</p>
            </div>

            {/* A3 Price */}
            <div className="bg-neutral-950 p-4 border border-neutral-900 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-white tracking-wide">A3</span>
                <span className="text-[9px] text-neutral-500 font-bold">29.7 × 42 cm</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-xs font-bold">₹</span>
                <input
                  type="number"
                  name="price_A3"
                  defaultValue={sizePrices.A3}
                  required
                  min="0"
                  step="1"
                  placeholder="99"
                  className="w-full pl-7 pr-3 py-2.5 bg-neutral-900 border border-neutral-800 focus:border-[#C1121F] rounded-xl text-xs text-white focus:outline-none transition-all font-mono font-bold"
                />
              </div>
              <p className="text-[9px] text-neutral-500">Default: ₹99</p>
            </div>
          </div>
        </div>

        {/* Section: Financials & Categorization */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-900 pb-3">
            <Sparkles className="w-4 h-4 text-[#C1121F]" />
            <h3 className="text-xs text-neutral-200 font-extrabold uppercase tracking-widest">
              Pricing, Inventory & Category
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Price */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                Base Selling Price (₹)
              </label>
              <input
                type="number"
                name="price"
                defaultValue={initialData?.price || 59}
                required
                min="0"
                step="1"
                placeholder="59"
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-900 rounded-xl text-xs text-white focus:outline-none focus:border-[#C1121F] transition-all font-mono"
              />
            </div>

            {/* MRP */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                Retail MRP (₹)
              </label>
              <input
                type="number"
                name="MRP"
                defaultValue={initialData?.MRP || ''}
                required
                min="0"
                step="1"
                placeholder="149"
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-900 rounded-xl text-xs text-white focus:outline-none focus:border-[#C1121F] transition-all font-mono"
              />
            </div>

            {/* Discount */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                Discount percentage (%)
              </label>
              <input
                type="number"
                name="discount"
                defaultValue={initialData?.discount ?? 0}
                required
                min="0"
                max="100"
                step="1"
                placeholder="50"
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-900 rounded-xl text-xs text-white focus:outline-none focus:border-[#C1121F] transition-all font-mono"
              />
            </div>

            {/* SKU */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                SKU Identifier
              </label>
              <input
                type="text"
                name="SKU"
                defaultValue={initialData?.SKU || ''}
                required
                placeholder="HFP-ANI-NCS-01"
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-900 rounded-xl text-xs text-white focus:outline-none focus:border-[#C1121F] transition-all font-mono"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                Category
              </label>
              <select
                name="categoryId"
                defaultValue={initialData?.categoryId || ''}
                required
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-900 rounded-xl text-xs text-neutral-400 focus:outline-none focus:border-[#C1121F] transition-all font-bold uppercase tracking-wider cursor-pointer"
              >
                <option value="" disabled>SELECT CATEGORY</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Initial Stock */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                Total Stock Quantity
              </label>
              <input
                type="number"
                name="stock"
                defaultValue={isEdit ? currentStock : 100}
                required
                min="0"
                step="1"
                placeholder="100"
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-900 rounded-xl text-xs text-white focus:outline-none focus:border-[#C1121F] transition-all font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section: Images */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#C1121F]" />
              <h3 className="text-xs text-neutral-200 font-extrabold uppercase tracking-widest">
                Gallery Images
              </h3>
            </div>
            
            {/* Direct Cloudinary Uploader Controls */}
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/jpg, image/webp"
                className="hidden"
              />
              <button
                type="button"
                onClick={handleUploadClick}
                disabled={uploading}
                className="inline-flex items-center gap-2 bg-[#C1121F]/10 hover:bg-[#C1121F]/20 text-[#FF4D4D] border border-[#C1121F]/30 disabled:border-red-950/40 px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer select-none active:scale-95 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Uploading to Cloudinary...
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    Upload Product Image
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                Image URLs (one per line, or separated by commas)
              </label>
              <textarea
                name="images"
                value={imagesText}
                onChange={(e) => setImagesText(e.target.value)}
                rows={4}
                placeholder="Paste image URLs (one per line, or separated by commas)..."
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-900 rounded-xl text-xs text-white focus:outline-none focus:border-[#C1121F] transition-all font-mono resize-none leading-relaxed"
              />
              <p className="text-[9px] text-neutral-500 uppercase tracking-wide">
                Tip: Paste direct public image links, or click the upload button to save files directly to Cloudinary.
              </p>
            </div>

            {/* Thumbnail Previews Grid */}
            {imageUrls.length > 0 && (
              <div className="space-y-2">
                <label className="text-[10px] text-neutral-450 font-black uppercase tracking-widest block">
                  Gallery Previews ({imageUrls.length})
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {imageUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-900 group shadow-md"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          // Handle preview load failure visual safely
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=150&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteUrl(idx)}
                          className="p-2 bg-neutral-900/90 hover:bg-[#C1121F] text-neutral-450 hover:text-white rounded-xl border border-neutral-800 hover:border-transparent transition-all duration-200 active:scale-90 cursor-pointer"
                          title="Remove Image"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="absolute bottom-2 left-2 bg-black/75 px-1.5 py-0.5 rounded text-[8px] font-mono text-neutral-400">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section: Badges & Statuses */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-wrap gap-6 items-center bg-neutral-950/40 p-4 border border-neutral-900 rounded-2xl">
            {/* Featured */}
            <label className="flex items-center gap-3 cursor-pointer text-xs font-bold uppercase tracking-wider text-neutral-300">
              <input
                type="checkbox"
                name="featured"
                defaultChecked={initialData?.featured || false}
                className="w-4.5 h-4.5 accent-[#C1121F] bg-neutral-950 border border-neutral-900 rounded cursor-pointer"
              />
              FEATURE ON STOREFRONT
            </label>

            {/* Trending */}
            <label className="flex items-center gap-3 cursor-pointer text-xs font-bold uppercase tracking-wider text-neutral-300">
              <input
                type="checkbox"
                name="trending"
                defaultChecked={initialData?.trending || false}
                className="w-4.5 h-4.5 accent-[#C1121F] bg-neutral-950 border border-neutral-900 rounded cursor-pointer"
              />
              MARK AS TRENDING
            </label>

            {/* Active Status (Only in Edit Mode) */}
            {isEdit && (
              <label className="flex items-center gap-3 cursor-pointer text-xs font-bold uppercase tracking-wider text-neutral-300">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={initialData?.active ?? true}
                  className="w-4.5 h-4.5 accent-[#C1121F] bg-neutral-950 border border-neutral-900 rounded cursor-pointer"
                />
                IS ACTIVE (PURCHASEABLE)
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Form Submission Buttons */}
      <div className="flex items-center gap-4 justify-end">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-400 hover:text-white px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 bg-[#C1121F] hover:bg-[#A00F19] disabled:bg-red-950/60 text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-red-950/20 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {isPending ? 'Saving to Neon...' : 'Save Product Configuration'}
        </button>
      </div>
    </form>
  );
}
