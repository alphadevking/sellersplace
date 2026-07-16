import Link from "next/link";
import { getAllCategories } from "@/lib/products";
import { emojiForCategorySlug } from "@/lib/category-icons";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const categories = await getAllCategories();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Categories</h1>
      {categories.length === 0 ? (
        <p className="card-surface p-4 text-sm text-muted">
          No categories yet. Seed sample data with <code>pnpm dlx prisma db seed</code>.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/categories/${cat.slug}`}
              className="flex flex-col items-center gap-2 card-surface p-5 text-center transition-transform hover:-translate-y-0.5 active:scale-95"
            >
              {cat.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cat.imageUrl}
                  alt={cat.name}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <span className="text-3xl">{emojiForCategorySlug(cat.slug)}</span>
              )}
              <span className="text-sm">{cat.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
