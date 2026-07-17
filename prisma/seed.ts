import { OfferingType, PriceType, PrismaClient, PurchaseMode } from "@prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";
import { createDbAdapter } from "../src/lib/db-adapter";

const adapter = createDbAdapter(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

type SeedVariant = {
  name: string;
  sku: string;
  price?: number;
  stock: number;
  options?: Record<string, string>;
};

// Stable Unsplash CDN photos so seeded data looks like a real store.
const img = (id: string) =>
  `https://images.unsplash.com/${id}?w=800&h=800&q=80&auto=format&fit=crop`;

async function main() {
  const categories = [
    { name: "Fashion", slug: "fashion", imageUrl: img("photo-1445205170230-053b83016050") },
    { name: "Electronics", slug: "electronics", imageUrl: img("photo-1498049794561-7780e7231661") },
    { name: "Grocery", slug: "grocery", imageUrl: img("photo-1542838132-92c53300491e") },
    { name: "Cosmetics", slug: "cosmetics", imageUrl: img("photo-1596462502278-27bfdc403348") },
    { name: "Services", slug: "services", imageUrl: img("photo-1521791136064-7986c2920216") },
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
  const services = await bySlug("services");

  const products: Array<{
    name: string;
    slug: string;
    description: string;
    brand: string;
    attributes: Record<string, string>;
    purchaseMode?: PurchaseMode;
    offeringType?: OfferingType;
    priceType?: PriceType;
    depositPercent?: number;
    price: number;
    compareAtPrice: number;
    stock: number;
    sku: string;
    images: string[];
    categoryId: string;
    variants?: SeedVariant[];
  }> = [
    // Electronics
    {
      name: "Smart Watch",
      slug: "smart-watch",
      description:
        "Track your fitness, heart rate, sleep, and notifications on your wrist. Water-resistant with a 7-day battery and interchangeable straps.",
      brand: "Pulse",
      attributes: {
        "Display": "1.4\" AMOLED",
        "Battery life": "7 days",
        "Water resistance": "5 ATM",
        "Connectivity": "Bluetooth 5.2",
      },
      price: 89999,
      compareAtPrice: 109999,
      stock: 25,
      sku: "ELC-SW-001",
      images: [img("photo-1523275335684-37898b6baf30")],
      categoryId: electronics.id,
      variants: [
        { name: "Midnight Black", sku: "ELC-SW-001-BLK", stock: 15, options: { color: "Black" } },
        { name: "Rose Gold", sku: "ELC-SW-001-RG", price: 94999, stock: 10, options: { color: "Rose Gold" } },
      ],
    },
    {
      name: "Wireless Headphones",
      slug: "wireless-headphones",
      description:
        "Noise-cancelling over-ear headphones with 30hr battery life, plush memory-foam earcups, and crystal-clear call quality.",
      brand: "AudioMax",
      attributes: {
        "Battery life": "30 hours",
        "Noise cancelling": "Active (ANC)",
        "Driver": "40mm dynamic",
        "Weight": "254g",
      },
      price: 45999,
      compareAtPrice: 59999,
      stock: 40,
      sku: "ELC-WH-002",
      images: [img("photo-1505740420928-5e560c06d30e")],
      categoryId: electronics.id,
      variants: [
        { name: "Black", sku: "ELC-WH-002-BLK", stock: 25, options: { color: "Black" } },
        { name: "Silver", sku: "ELC-WH-002-SLV", stock: 15, options: { color: "Silver" } },
      ],
    },
    {
      name: "Bluetooth Speaker",
      slug: "bluetooth-speaker",
      description:
        "Portable speaker with deep bass, 12hr playtime, and IPX7 waterproofing — perfect for home or outdoors.",
      brand: "AudioMax",
      attributes: {
        "Playtime": "12 hours",
        "Waterproofing": "IPX7",
        "Output": "20W",
      },
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
      brand: "Pulse",
      attributes: {
        "Battery life": "8h + 24h case",
        "Noise cancelling": "Active (ANC)",
        "Water resistance": "IPX4",
      },
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
        "Genuine leather handbag with a hand-stitched finish, magnetic closure, and roomy interior pockets. Made to order — chat with us to personalise yours.",
      brand: "Adire Atelier",
      attributes: {
        "Material": "Full-grain leather",
        "Finish": "Hand-stitched",
        "Made in": "Nigeria",
      },
      // Bespoke, made-to-order product: buyers discuss details with the seller.
      purchaseMode: PurchaseMode.CONTACT_SELLER,
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
      brand: "Strider",
      attributes: {
        "Upper": "Canvas",
        "Sole": "Vulcanised rubber",
        "Fit": "Unisex, true to size",
      },
      price: 38500,
      compareAtPrice: 45000,
      stock: 50,
      sku: "FSH-SN-002",
      images: [img("photo-1542291026-7eec264c27ff")],
      categoryId: fashion.id,
      variants: [
        { name: "EU 40", sku: "FSH-SN-002-40", stock: 12, options: { size: "40" } },
        { name: "EU 42", sku: "FSH-SN-002-42", stock: 20, options: { size: "42" } },
        { name: "EU 44", sku: "FSH-SN-002-44", stock: 18, options: { size: "44" } },
        { name: "EU 46", sku: "FSH-SN-002-46", stock: 0, options: { size: "46" } },
      ],
    },
    {
      name: "Denim Jacket",
      slug: "denim-jacket",
      description:
        "Timeless mid-wash denim jacket with button front, chest pockets, and a relaxed fit that layers over anything.",
      brand: "Urban Thread",
      attributes: {
        "Material": "100% cotton denim",
        "Wash": "Mid-blue",
        "Fit": "Relaxed",
      },
      price: 29999,
      compareAtPrice: 36500,
      stock: 22,
      sku: "FSH-DJ-003",
      images: [img("photo-1576995853123-5a10305d93c0")],
      categoryId: fashion.id,
      variants: [
        { name: "M", sku: "FSH-DJ-003-M", stock: 8, options: { size: "M" } },
        { name: "L", sku: "FSH-DJ-003-L", stock: 9, options: { size: "L" } },
        { name: "XL", sku: "FSH-DJ-003-XL", stock: 5, options: { size: "XL" } },
      ],
    },
    {
      name: "Aviator Sunglasses",
      slug: "aviator-sunglasses",
      description:
        "UV400-protected aviator sunglasses with polarized lenses and a lightweight metal frame.",
      brand: "Solstice",
      attributes: {
        "Lens": "Polarized, UV400",
        "Frame": "Stainless steel",
      },
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
        "Single-origin arabica beans, medium roast, freshly packed for a rich and balanced cup every morning. Bulk orders welcome — chat with us for wholesale pricing.",
      brand: "Highlands Roastery",
      attributes: {
        "Origin": "Single-origin arabica",
        "Roast": "Medium",
        "Weight": "1kg",
      },
      // Retail buyers pay online; bulk/wholesale buyers negotiate via chat.
      purchaseMode: PurchaseMode.BOTH,
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
      brand: "Highlands Roastery",
      attributes: {
        "Type": "Raw, unfiltered",
        "Volume": "500ml",
        "Source": "Local farms",
      },
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
      brand: "Velvetine",
      attributes: {
        "Finish": "Matte",
        "Shades": "4",
        "Wear": "Up to 12 hours",
      },
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
      brand: "Velvetine",
      attributes: {
        "Active": "15% Vitamin C",
        "Volume": "30ml",
        "Skin type": "All",
      },
      price: 18500,
      compareAtPrice: 22000,
      stock: 28,
      sku: "CSM-FS-002",
      images: [img("photo-1620916566398-39f1143ab7be")],
      categoryId: cosmetics.id,
      variants: [
        { name: "30ml", sku: "CSM-FS-002-30", stock: 18, options: { volume: "30ml" } },
        { name: "50ml", sku: "CSM-FS-002-50", price: 26500, stock: 10, options: { volume: "50ml" } },
      ],
    },
    // Services — the template serves service brands too (bookings & quotes).
    {
      name: "Home Deep Cleaning",
      slug: "home-deep-cleaning",
      description:
        "Professional deep cleaning for apartments and houses: kitchens, bathrooms, floors, and windows. Pick a package that matches your home size and book a session online.",
      brand: "SparklePro",
      attributes: {
        "Duration": "3–6 hours",
        "Team": "2–4 cleaners",
        "Coverage": "Lagos mainland & island",
        "Supplies": "Included",
      },
      offeringType: OfferingType.SERVICE,
      priceType: PriceType.FROM,
      purchaseMode: PurchaseMode.BOTH,
      depositPercent: 30, // book with 30% down, pay the rest after the job
      price: 25000,
      compareAtPrice: 30000,
      stock: 0,
      sku: "SVC-HC-001",
      images: [img("photo-1581578731548-c64695cc6952")],
      categoryId: services.id,
      variants: [
        { name: "Studio / 1-bed", sku: "SVC-HC-001-S", price: 25000, stock: 0, options: { size: "Studio/1-bed" } },
        { name: "2–3 bedroom", sku: "SVC-HC-001-M", price: 40000, stock: 0, options: { size: "2-3 bed" } },
        { name: "4+ bedroom / duplex", sku: "SVC-HC-001-L", price: 65000, stock: 0, options: { size: "4+ bed" } },
      ],
    },
    {
      name: "Event Photography",
      slug: "event-photography",
      description:
        "Weddings, birthdays, corporate events — professional coverage with edited photos delivered within 7 days. Every event is different, so chat with us for a tailored quote.",
      brand: "LensCraft Studios",
      attributes: {
        "Delivery": "Edited photos in 7 days",
        "Coverage": "Half-day or full-day",
        "Extras": "Drone & same-day previews available",
      },
      offeringType: OfferingType.SERVICE,
      priceType: PriceType.QUOTE,
      purchaseMode: PurchaseMode.CONTACT_SELLER,
      price: 150000,
      compareAtPrice: 0,
      stock: 0,
      sku: "SVC-EP-002",
      images: [img("photo-1492691527719-9d1e07e534b4")],
      categoryId: services.id,
    },
  ];

  for (const product of products) {
    const { slug, variants, ...data } = product;
    const saved = await prisma.product.upsert({
      where: { slug },
      // Re-seeding refreshes fields on existing rows so nothing is left empty.
      update: data,
      create: { slug, ...data },
    });

    // Variants are upserted by SKU so re-seeding never orphans order items.
    for (const variant of variants ?? []) {
      const { sku: variantSku, ...variantData } = variant;
      await prisma.productVariant.upsert({
        where: { sku: variantSku },
        update: { ...variantData, productId: saved.id },
        create: { sku: variantSku, ...variantData, productId: saved.id },
      });
    }
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

  // Demo customer with a delivered order + reviews, so ratings and the
  // verified-buyer flow have visible sample data out of the box.
  const customer = await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: {},
    create: {
      email: "customer@example.com",
      name: "Ada Demo",
      phone: "+2348111111111",
      passwordHash: await bcrypt.hash("customer123", 10),
    },
  });

  const watch = await prisma.product.findUniqueOrThrow({ where: { slug: "smart-watch" } });
  const headphones = await prisma.product.findUniqueOrThrow({
    where: { slug: "wireless-headphones" },
  });

  const demoOrderNumber = "SS-DEMO-1";
  let demoOrder = await prisma.order.findUnique({ where: { orderNumber: demoOrderNumber } });
  if (!demoOrder) {
    demoOrder = await prisma.order.create({
      data: {
        orderNumber: demoOrderNumber,
        userId: customer.id,
        subtotal: 135998,
        deliveryFee: 1500,
        total: 137498,
        amountPaid: 137498,
        status: "DELIVERED",
        paymentStatus: "PAID",
        items: {
          create: [
            { productId: watch.id, quantity: 1, unitPrice: watch.price },
            { productId: headphones.id, quantity: 1, unitPrice: headphones.price },
          ],
        },
        statusHistory: { create: { status: "DELIVERED", note: "Demo order" } },
      },
    });
  }

  const demoReviews = [
    {
      productId: watch.id,
      rating: 5,
      body: "Battery really does last the week. Strap swap took seconds — very happy.",
    },
    {
      productId: headphones.id,
      rating: 4,
      body: "Great noise cancelling for the price. Slightly tight fit out of the box.",
    },
  ];
  for (const review of demoReviews) {
    await prisma.review.upsert({
      where: { productId_userId: { productId: review.productId, userId: customer.id } },
      update: { rating: review.rating, body: review.body },
      create: { ...review, userId: customer.id },
    });
    const agg = await prisma.review.aggregate({
      where: { productId: review.productId },
      _avg: { rating: true },
      _count: true,
    });
    await prisma.product.update({
      where: { id: review.productId },
      data: { ratingAvg: agg._avg.rating ?? null, ratingCount: agg._count },
    });
  }

  console.log(`Seeded ${categories.length} categories and ${products.length} products.`);
  console.log(`Admin user: ${adminEmail} (password: ${adminPassword})`);
  console.log(`Demo customer: customer@example.com (password: customer123)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
