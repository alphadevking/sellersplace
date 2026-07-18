import { redirect } from "next/navigation";

// The catalog page at /products carries category filters now — a separate
// categories page is redundant. Kept as a redirect so old links survive.
export default function CategoriesPage() {
  redirect("/products");
}
