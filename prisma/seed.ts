import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const categories = [
    { name: "Fashion", slug: "fashion" },
    { name: "Electronics", slug: "electronics" },
    { name: "Grocery", slug: "grocery" },
    { name: "Cosmetics", slug: "cosmetics" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  const fashion = await prisma.category.findUniqueOrThrow({ where: { slug: "fashion" } });
  const electronics = await prisma.category.findUniqueOrThrow({ where: { slug: "electronics" } });

  const products = [
    {
      name: "Smart Watch",
      slug: "smart-watch",
      description: "Track your fitness, notifications, and more on your wrist.",
      price: 89999,
      stock: 25,
      images: [],
      categoryId: electronics.id,
    },
    {
      name: "Wireless Headphones",
      slug: "wireless-headphones",
      description: "Noise-cancelling over-ear headphones with 30hr battery life.",
      price: 45999,
      stock: 40,
      images: [],
      categoryId: electronics.id,
    },
    {
      name: "Leather Handbag",
      slug: "leather-handbag",
      description: "Genuine leather handbag, hand-stitched finish.",
      price: 62500,
      stock: 15,
      images: [],
      categoryId: fashion.id,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    });
  }

  console.log(`Seeded ${categories.length} categories and ${products.length} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
