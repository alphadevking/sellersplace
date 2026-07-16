import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";
import { createDbAdapter } from "../src/lib/db-adapter";

const adapter = createDbAdapter(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

// Stable Unsplash CDN photos so seeded data looks like a real store.
const img = (id: string) =>
  `https://images.unsplash.com/${id}?w=800&h=800&q=80&auto=format&fit=crop`;

async function main() {
  const categories = [
    { name: "Fashion", slug: "fashion", imageUrl: img("photo-1445205170230-053b83016050") },
    { name: "Electronics", slug: "electronics", imageUrl: img("photo-1498049794561-7780e7231661") },
    { name: "Grocery", slug: "grocery", imageUrl: img("photo-1542838132-92c53300491e") },
    { name: "Cosmetics", slug: "cosmetics", imageUrl: img("photo-1596462502278-27bfdc403348") },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, imageUrl: cat.imageUrl },
      create: cat,
    });
  }

  const bySlug = async (slug: string) =>
    prisma.category.findUniqueOrThrow({ where: { slug } });
  const fashion = await bySlug("fashion");
  const electronics = await bySlug("electronics");
  const grocery = await bySlug("grocery");
  const cosmetics = await bySlug("cosmetics");

  const products = [
    // Electronics
    {
      name: "Smart Watch",
      slug: "smart-watch",
      description:
        "Track your fitness, heart rate, sleep, and notifications on your wrist. Water-resistant with a 7-day battery and interchangeable straps.",
      price: 89999,
      compareAtPrice: 109999,
      stock: 25,
      sku: "ELC-SW-001",
      images: [img("photo-1523275335684-37898b6baf30")],
      categoryId: electronics.id,
    },
    {
      name: "Wireless Headphones",
      slug: "wireless-headphones",
      description:
        "Noise-cancelling over-ear headphones with 30hr battery life, plush memory-foam earcups, and crystal-clear call quality.",
      price: 45999,
      compareAtPrice: 59999,
      stock: 40,
      sku: "ELC-WH-002",
      images: [img("photo-1505740420928-5e560c06d30e")],
      categoryId: electronics.id,
    },
    {
      name: "Bluetooth Speaker",
      slug: "bluetooth-speaker",
      description:
        "Portable speaker with deep bass, 12hr playtime, and IPX7 waterproofing — perfect for home or outdoors.",
      price: 32500,
      compareAtPrice: 38000,
      stock: 30,
      sku: "ELC-BS-003",
      images: [img("photo-1608043152269-423dbba4e7e1")],
      categoryId: electronics.id,
    },
    {
      name: "Wireless Earbuds",
      slug: "wireless-earbuds",
      description:
        "True wireless earbuds with active noise cancellation, touch controls, and a pocket-sized charging case.",
      price: 27999,
      compareAtPrice: 34999,
      stock: 55,
      sku: "ELC-WE-004",
      images: [img("photo-1590658268037-6bf12165a8df")],
      categoryId: electronics.id,
    },
    // Fashion
    {
      name: "Leather Handbag",
      slug: "leather-handbag",
      description:
        "Genuine leather handbag with a hand-stitched finish, magnetic closure, and roomy interior pockets.",
      price: 62500,
      compareAtPrice: 75000,
      stock: 15,
      sku: "FSH-LH-001",
      images: [img("photo-1548036328-c9fa89d128fa")],
      categoryId: fashion.id,
    },
    {
      name: "Classic Sneakers",
      slug: "classic-sneakers",
      description:
        "Everyday low-top sneakers with cushioned insoles and a durable rubber outsole. Available in unisex sizing.",
      price: 38500,
      compareAtPrice: 45000,
      stock: 50,
      sku: "FSH-SN-002",
      images: [img("photo-1542291026-7eec264c27ff")],
      categoryId: fashion.id,
    },
    {
      name: "Denim Jacket",
      slug: "denim-jacket",
      description:
        "Timeless mid-wash denim jacket with button front, chest pockets, and a relaxed fit that layers over anything.",
      price: 29999,
      compareAtPrice: 36500,
      stock: 22,
      sku: "FSH-DJ-003",
      images: [img("photo-1576995853123-5a10305d93c0")],
      categoryId: fashion.id,
    },
    {
      name: "Aviator Sunglasses",
      slug: "aviator-sunglasses",
      description:
        "UV400-protected aviator sunglasses with polarized lenses and a lightweight metal frame.",
      price: 15500,
      compareAtPrice: 19999,
      stock: 60,
      sku: "FSH-SG-004",
      images: [img("photo-1572635196237-14b3f281503f")],
      categoryId: fashion.id,
    },
    // Grocery
    {
      name: "Premium Coffee Beans 1kg",
      slug: "premium-coffee-beans",
      description:
        "Single-origin arabica beans, medium roast, freshly packed for a rich and balanced cup every morning.",
      price: 8500,
      compareAtPrice: 9999,
      stock: 80,
      sku: "GRC-CB-001",
      images: [img("photo-1447933601403-0c6688de566e")],
      categoryId: grocery.id,
    },
    {
      name: "Pure Honey 500ml",
      slug: "pure-honey",
      description:
        "Raw, unfiltered honey harvested from local farms. No additives, no preservatives — just pure sweetness.",
      price: 6500,
      compareAtPrice: 7500,
      stock: 45,
      sku: "GRC-HN-002",
      images: [img("photo-1587049352846-4a222e784d38")],
      categoryId: grocery.id,
    },
    // Cosmetics
    {
      name: "Matte Lipstick Set",
      slug: "matte-lipstick-set",
      description:
        "Long-wear matte lipsticks in four everyday shades. Smudge-proof, hydrating formula that lasts all day.",
      price: 12999,
      compareAtPrice: 16500,
      stock: 35,
      sku: "CSM-LS-001",
      images: [img("photo-1586495777744-4413f21062fa")],
      categoryId: cosmetics.id,
    },
    {
      name: "Vitamin C Face Serum",
      slug: "vitamin-c-face-serum",
      description:
        "Brightening serum with 15% vitamin C and hyaluronic acid for glowing, even-toned skin. Suitable for all skin types.",
      price: 18500,
      compareAtPrice: 22000,
      stock: 28,
      sku: "CSM-FS-002",
      images: [img("photo-1620916566398-39f1143ab7be")],
      categoryId: cosmetics.id,
    },
  ];

  for (const product of products) {
    const { slug, ...data } = product;
    await prisma.product.upsert({
      where: { slug },
      // Re-seeding refreshes fields on existing rows so nothing is left empty.
      update: data,
      create: { slug, ...data },
    });
  }

  // Dev admin for /admin — set SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD in .env
  // to override, and change the password before any real deployment.
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@sellersplace.app";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "changeme123";
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN", name: "Store Admin", phone: "+2348000000000" },
    create: {
      email: adminEmail,
      name: "Store Admin",
      phone: "+2348000000000",
      role: "ADMIN",
      passwordHash: await bcrypt.hash(adminPassword, 10),
    },
  });

  console.log(`Seeded ${categories.length} categories and ${products.length} products.`);
  console.log(`Admin user: ${adminEmail} (password: ${adminPassword})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
