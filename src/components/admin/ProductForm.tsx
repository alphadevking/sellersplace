import type { Category, Product } from "@prisma/client";
import { createProduct, updateProduct } from "@/app/actions/admin";

/**
 * Shared create/edit product form. Server component — submits straight to a
 * server action; no client-side state needed.
 */
export default function ProductForm({
  product,
  categories,
}: {
  product?: Product;
  categories: Category[];
}) {
  const editing = Boolean(product);

  return (
    <form action={editing ? updateProduct : createProduct} className="flex flex-col gap-4">
      {product && <input type="hidden" name="id" value={product.id} />}

      <label className="field-label">
        Name
        <input
          name="name"
          required
          defaultValue={product?.name}
          placeholder="e.g. Wireless Headphones"
          className="input-field"
        />
      </label>

      <label className="field-label">
        Description
        <textarea
          name="description"
          rows={3}
          defaultValue={product?.description ?? ""}
          className="input-field"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="field-label">
          Price (₦)
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={product ? Number(product.price) : undefined}
            className="input-field"
          />
        </label>
        <label className="field-label">
          Compare-at price (₦)
          <input
            name="compareAtPrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={
              product?.compareAtPrice ? Number(product.compareAtPrice) : undefined
            }
            className="input-field"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="field-label">
          Stock
          <input
            name="stock"
            type="number"
            min="0"
            required
            defaultValue={product?.stock ?? 0}
            className="input-field"
          />
        </label>
        <label className="field-label">
          SKU (optional)
          <input name="sku" defaultValue={product?.sku ?? ""} className="input-field" />
        </label>
      </div>

      <label className="field-label">
        Category
        <select
          name="categoryId"
          defaultValue={product?.categoryId ?? ""}
          className="input-field"
        >
          <option value="">No category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </label>

      <label className="field-label">
        Image URLs (one per line)
        <textarea
          name="images"
          rows={3}
          defaultValue={product?.images?.join("\n") ?? ""}
          placeholder={"https://example.com/front.jpg\nhttps://example.com/back.jpg"}
          className="input-field font-mono text-xs"
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={product?.isActive ?? true}
          className="h-4 w-4 accent-[var(--brand)]"
        />
        Visible in the storefront
      </label>

      <button type="submit" className="btn-primary">
        {editing ? "Save changes" : "Create product"}
      </button>
    </form>
  );
}
