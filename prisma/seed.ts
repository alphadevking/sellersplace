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
      images: [],
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
      images: [],
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
      images: [],
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
      images: [],
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
      images: [],
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
      images: [],
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
      images: [],
      categoryId: cosmetics.id,
      variants: [
        { name: "30ml", sku: "CSM-FS-002-30", stock: 18, options: { volume: "30ml" } },
        { name: "50ml", sku: "CSM-FS-002-50", price: 26500, stock: 10, options: { volume: "50ml" } },
      ],
    },
    // ——— Nigerian-market staples ———
    {
      name: "Ankara Print Fabric (6 Yards)",
      slug: "ankara-print-fabric",
      description:
        "Vibrant 100% cotton Ankara wax print, 6 full yards — enough for a complete outfit. Colourfast and iron-friendly; perfect for asoebi and everyday styles.",
      brand: "Adire Atelier",
      attributes: {
        "Material": "100% cotton wax print",
        "Length": "6 yards",
        "Width": "45 inches",
        "Care": "Cold wash, iron on medium",
      },
      price: 12500,
      compareAtPrice: 15000,
      stock: 60,
      sku: "FSH-AK-005",
      images: [],
      categoryId: fashion.id,
    },
    {
      name: "Men's Senator Wear (2-Piece)",
      slug: "mens-senator-wear",
      description:
        "Tailored senator suit in premium cashmere-blend fabric — kaftan top and trousers. Order your size or chat with us for custom measurements.",
      brand: "Urban Thread",
      attributes: {
        "Fabric": "Cashmere blend",
        "Pieces": "Kaftan top + trousers",
        "Tailoring": "Standard sizes or custom",
      },
      purchaseMode: PurchaseMode.BOTH,
      price: 35000,
      compareAtPrice: 42000,
      stock: 25,
      sku: "FSH-SW-006",
      images: [],
      categoryId: fashion.id,
      variants: [
        { name: "M", sku: "FSH-SW-006-M", stock: 8, options: { size: "M" } },
        { name: "L", sku: "FSH-SW-006-L", stock: 10, options: { size: "L" } },
        { name: "XL", sku: "FSH-SW-006-XL", stock: 7, options: { size: "XL" } },
      ],
    },
    {
      name: "Beaded Coral Necklace Set",
      slug: "beaded-coral-necklace-set",
      description:
        "Traditional coral bead necklace with matching bracelet and earrings — a statement set for weddings and cultural events.",
      brand: "Adire Atelier",
      attributes: {
        "Pieces": "Necklace, bracelet, earrings",
        "Beads": "Coral-tone",
        "Occasion": "Traditional weddings, owambe",
      },
      price: 18000,
      compareAtPrice: 22000,
      stock: 20,
      sku: "FSH-CN-007",
      images: [],
      categoryId: fashion.id,
    },
    {
      name: "Ladies' Block Heels",
      slug: "ladies-block-heels",
      description:
        "Comfortable 3-inch block heels that carry you through church, work, and owambe without the ache.",
      brand: "Strider",
      attributes: {
        "Heel": "3-inch block",
        "Upper": "Faux leather",
        "Fit": "True to size",
      },
      price: 21500,
      compareAtPrice: 26000,
      stock: 30,
      sku: "FSH-BH-008",
      images: [img("photo-1543163521-1bf539c55dd2")],
      categoryId: fashion.id,
      variants: [
        { name: "EU 37", sku: "FSH-BH-008-37", stock: 8, options: { size: "37" } },
        { name: "EU 39", sku: "FSH-BH-008-39", stock: 12, options: { size: "39" } },
        { name: "EU 41", sku: "FSH-BH-008-41", stock: 10, options: { size: "41" } },
      ],
    },
    {
      name: "Android Smartphone X20",
      slug: "android-smartphone-x20",
      description:
        "Dual-SIM Android phone with a 6.6\" display, 5000mAh all-day battery, and 50MP camera — built for Nigerian networks with 4G on both SIMs.",
      brand: "Pulse",
      attributes: {
        "Display": "6.6\" HD+",
        "Battery": "5000mAh",
        "Camera": "50MP + 8MP selfie",
        "SIM": "Dual SIM, dual 4G",
      },
      price: 145000,
      compareAtPrice: 165000,
      stock: 18,
      sku: "ELC-SP-005",
      images: [img("photo-1511707171634-5f897ff02aa9")],
      categoryId: electronics.id,
      variants: [
        { name: "64GB", sku: "ELC-SP-005-64", stock: 10, options: { storage: "64GB" } },
        { name: "128GB", sku: "ELC-SP-005-128", price: 165000, stock: 8, options: { storage: "128GB" } },
      ],
    },
    {
      name: "20,000mAh Fast-Charge Power Bank",
      slug: "power-bank-20000",
      description:
        "NEPA-proof 20,000mAh power bank with 22.5W fast charging — keeps two phones going through a full day of outage.",
      brand: "Pulse",
      attributes: {
        "Capacity": "20,000mAh",
        "Output": "22.5W fast charge",
        "Ports": "2× USB-A, 1× USB-C",
      },
      price: 24500,
      compareAtPrice: 29000,
      stock: 45,
      sku: "ELC-PB-006",
      images: [],
      categoryId: electronics.id,
    },
    {
      name: "Solar Home Lighting Kit",
      slug: "solar-home-lighting-kit",
      description:
        "Beat the outages: 30W solar panel, control box, and four bright LED bulbs with phone-charging USB ports. Installs in under an hour.",
      brand: "Pulse",
      attributes: {
        "Panel": "30W polycrystalline",
        "Bulbs": "4× LED",
        "Extras": "USB phone charging",
        "Runtime": "8+ hours fully charged",
      },
      price: 58000,
      compareAtPrice: 68000,
      stock: 15,
      sku: "ELC-SL-007",
      images: [img("photo-1509391366360-2e959784a276")],
      categoryId: electronics.id,
    },
    {
      name: "Long Grain Parboiled Rice",
      slug: "long-grain-rice",
      description:
        "Stone-free, well-parboiled long grain rice that cooks fluffy every time — the party jollof standard.",
      brand: "Highlands Roastery",
      attributes: {
        "Type": "Parboiled long grain",
        "Quality": "Stone-free, destoned twice",
        "Origin": "Nigeria",
      },
      price: 12000,
      compareAtPrice: 14000,
      stock: 100,
      sku: "GRC-RC-003",
      images: [img("photo-1586201375761-83865001e31c")],
      categoryId: grocery.id,
      variants: [
        { name: "5kg", sku: "GRC-RC-003-5", price: 12000, stock: 50, options: { weight: "5kg" } },
        { name: "10kg", sku: "GRC-RC-003-10", price: 22500, stock: 35, options: { weight: "10kg" } },
        { name: "25kg", sku: "GRC-RC-003-25", price: 52000, stock: 15, options: { weight: "25kg" } },
      ],
    },
    {
      name: "Garri Ijebu (5kg)",
      slug: "garri-ijebu",
      description:
        "Crisp, sour Ijebu garri — perfect for soaking or eba. Hygienically processed and double-sieved.",
      brand: "Highlands Roastery",
      attributes: {
        "Type": "Ijebu (sour, crisp)",
        "Weight": "5kg",
        "Processing": "Double-sieved",
      },
      price: 6500,
      compareAtPrice: 7500,
      stock: 70,
      sku: "GRC-GR-004",
      images: [img("photo-1586201375761-83865001e31c")],
      categoryId: grocery.id,
    },
    {
      name: "Pepper Soup Spice Mix",
      slug: "pepper-soup-spice-mix",
      description:
        "Authentic pepper soup blend — calabash nutmeg, uda, uziza, and chilli, ground fresh weekly. One pack seasons four family pots.",
      brand: "Highlands Roastery",
      attributes: {
        "Contents": "Calabash nutmeg, uda, uziza, chilli",
        "Weight": "250g",
        "Freshness": "Ground weekly",
      },
      price: 3500,
      compareAtPrice: 4200,
      stock: 90,
      sku: "GRC-PS-005",
      images: [img("photo-1596040033229-a9821ebd058d")],
      categoryId: grocery.id,
    },
    {
      name: "Fresh Plantain Bunch",
      slug: "fresh-plantain-bunch",
      description:
        "Semi-ripe plantain bunch (8–12 fingers) — ready for bole, dodo, or plantain porridge within 2–3 days.",
      brand: "Highlands Roastery",
      attributes: {
        "Count": "8–12 fingers",
        "Ripeness": "Semi-ripe",
        "Best within": "5 days",
      },
      price: 4500,
      compareAtPrice: 5500,
      stock: 40,
      sku: "GRC-PL-006",
      images: [img("photo-1571771894821-ce9b6c11b08e")],
      categoryId: grocery.id,
    },
    {
      name: "Raw Shea Butter (500g)",
      slug: "raw-shea-butter",
      description:
        "Unrefined grade-A shea butter from northern Nigeria — deeply moisturising for skin and hair, no additives.",
      brand: "Velvetine",
      attributes: {
        "Grade": "A, unrefined",
        "Weight": "500g",
        "Origin": "Northern Nigeria",
        "Use": "Skin & hair",
      },
      price: 5500,
      compareAtPrice: 7000,
      stock: 55,
      sku: "CSM-SB-003",
      images: [],
      categoryId: cosmetics.id,
    },
    {
      name: "African Black Soap (Ose Dudu)",
      slug: "african-black-soap",
      description:
        "Traditional black soap made with plantain skin ash and palm kernel oil — gentle daily cleansing for all skin types.",
      brand: "Velvetine",
      attributes: {
        "Ingredients": "Plantain ash, palm kernel oil, shea",
        "Weight": "300g",
        "Skin type": "All, incl. sensitive",
      },
      price: 3000,
      compareAtPrice: 3800,
      stock: 80,
      sku: "CSM-BS-004",
      images: [],
      categoryId: cosmetics.id,
    },
    {
      name: "Oud Perfume Oil (12ml)",
      slug: "oud-perfume-oil",
      description:
        "Long-lasting alcohol-free oud perfume oil — one roll lasts from morning meetings to evening events.",
      brand: "Velvetine",
      attributes: {
        "Volume": "12ml roll-on",
        "Base": "Alcohol-free oil",
        "Longevity": "10+ hours",
      },
      price: 8500,
      compareAtPrice: 11000,
      stock: 65,
      sku: "CSM-PO-005",
      images: [img("photo-1541643600914-78b084683601")],
      categoryId: cosmetics.id,
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
      images: [img("photo-1520854221256-17451cc331bf")],
      categoryId: services.id,
    },
    {
      name: "Makeup Artist — Owambe Package",
      slug: "makeup-owambe-package",
      description:
        "Professional makeup for weddings and parties: full glam with lashes and gele tying. Book with a 50% deposit; studio or home service across Lagos.",
      brand: "LensCraft Studios",
      attributes: {
        "Includes": "Full glam, lashes, gele tying",
        "Location": "Studio or home service (Lagos)",
        "Duration": "60–90 minutes",
      },
      offeringType: OfferingType.SERVICE,
      priceType: PriceType.FROM,
      purchaseMode: PurchaseMode.BOTH,
      depositPercent: 50,
      price: 30000,
      compareAtPrice: 35000,
      stock: 0,
      sku: "SVC-MU-003",
      images: [img("photo-1487412947147-5cebf100ffc2")],
      categoryId: services.id,
      variants: [
        { name: "Soft glam", sku: "SVC-MU-003-S", price: 30000, stock: 0, options: { tier: "Soft glam" } },
        { name: "Full glam + gele", sku: "SVC-MU-003-F", price: 45000, stock: 0, options: { tier: "Full glam" } },
        { name: "Bridal", sku: "SVC-MU-003-B", price: 80000, stock: 0, options: { tier: "Bridal" } },
      ],
    },
    {
      name: "Generator Repair & Servicing",
      slug: "generator-repair-servicing",
      description:
        "Small-gen and diesel generator servicing at your home or office — carburettor cleaning, oil change, and fault diagnosis. Chat with us to describe the fault and get a quote.",
      brand: "SparklePro",
      attributes: {
        "Covers": "Petrol & diesel generators",
        "Callout": "Home / office visit",
        "Warranty": "30 days on repairs",
      },
      offeringType: OfferingType.SERVICE,
      priceType: PriceType.QUOTE,
      purchaseMode: PurchaseMode.CONTACT_SELLER,
      price: 10000,
      compareAtPrice: 0,
      stock: 0,
      sku: "SVC-GR-004",
      images: [img("photo-1530124566582-a618bc2615dc")],
      categoryId: services.id,
    },
    {
      name: "Laundry & Dry Cleaning (Pickup)",
      slug: "laundry-dry-cleaning-pickup",
      description:
        "We pick up, wash, iron, and deliver within 48 hours. Price is per standard basket (up to 15 items); agbada and duvets count as two.",
      brand: "SparklePro",
      attributes: {
        "Turnaround": "48 hours",
        "Basket": "Up to 15 items",
        "Pickup": "Free within service area",
      },
      offeringType: OfferingType.SERVICE,
      priceType: PriceType.FROM,
      purchaseMode: PurchaseMode.PAY_ONLINE,
      price: 7500,
      compareAtPrice: 9000,
      stock: 0,
      sku: "SVC-LD-005",
      images: [img("photo-1545173168-9f1947eebb7f")],
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
