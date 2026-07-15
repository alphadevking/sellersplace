import { getAllCategories } from "@/lib/products";
import ProductForm from "@/components/admin/ProductForm";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  const categories = await getAllCategories();

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <h1 className="text-lg font-semibold">New product</h1>
      <div className="card p-5">
        <ProductForm categories={categories} />
      </div>
    </div>
  );
}
