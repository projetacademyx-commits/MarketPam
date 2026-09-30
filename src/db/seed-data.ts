export function px(id: number, w = 900, h = 1200) {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=${w}&h=${h}`;
}

const POOL: Record<string, number[]> = {
  apparel: [11671275, 9594089, 8148577, 9558699, 20669538, 8515484, 9558761, 20763273, 9558265, 9594081],
  home: [33105316, 17619624, 6476112, 7119223, 33105314, 12859529, 18278210, 6944986, 4207890, 14380620],
  tech: [8038334, 30428605, 36230830, 11063287, 3563627, 36130481, 16092415, 8038327, 35265842, 9800615],
  beauty: [8101673, 8015807, 7796461, 15785493, 6682950, 7005933, 8100776, 8049848, 7795760, 5632335],
  kitchen: [4641439, 7658112, 13935593, 12176055, 11183345, 15774251, 14747994, 17384066, 37703518, 9785812],
  carry: [13870707, 13870011, 35865087, 9407360, 33666586, 8442057, 33666552, 33666550, 33666549, 33666540],
};

export const HERO_IMAGE = "https://images.pexels.com/photos/7402632/pexels-photo-7402632.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1600&h=1100";
export const STORY_IMAGE = "https://images.pexels.com/photos/5793956/pexels-photo-5793956.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1400&h=900";
export const SELL_IMAGE = "https://images.pexels.com/photos/7225796/pexels-photo-7225796.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1400&h=900";

function gallery(cat: keyof typeof POOL, offset: number, count = 3) {
  const pool = POOL[cat];
  return Array.from({ length: count }, (_, i) => px(pool[(offset + i) % pool.length]));
}

export type SeedCategory = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
};

export const seedCategories: SeedCategory[] = [
  {
    slug: "apparel",
    name: "Apparel",
    tagline: "Considered essentials",
    description: "Slow-made staples in natural fibres, cut for everyday wear and built to outlast the season.",
    imageUrl: px(POOL.apparel[0], 900, 1100),
    sortOrder: 1,
  },
  {
    slug: "home",
    name: "Home & Objects",
    tagline: "Quiet luxury for the everyday",
    description: "Hand-thrown ceramics, sculptural lighting and objects that make a room feel finished.",
    imageUrl: px(POOL.home[0], 900, 1100),
    sortOrder: 2,
  },
  {
    slug: "tech",
    name: "Sound & Tech",
    tagline: "Beautifully engineered",
    description: "Audio and imaging gear chosen for craft, longevity and honest performance.",
    imageUrl: px(POOL.tech[0], 900, 1100),
    sortOrder: 3,
  },
  {
    slug: "beauty",
    name: "Skin & Scent",
    tagline: "Clean formulations",
    description: "Small-batch skincare and fragrance made with traceable, high-potency ingredients.",
    imageUrl: px(POOL.beauty[0], 900, 1100),
    sortOrder: 4,
  },
  {
    slug: "kitchen",
    name: "Kitchen & Coffee",
    tagline: "Rituals worth keeping",
    description: "Brewing tools and tableware for people who take the first cup seriously.",
    imageUrl: px(POOL.kitchen[0], 900, 1100),
    sortOrder: 5,
  },
  {
    slug: "carry",
    name: "Carry & Accessories",
    tagline: "Go-anywhere goods",
    description: "Bags, straps and small leather goods finished by hand and guaranteed for a decade.",
    imageUrl: px(POOL.carry[0], 900, 1100),
    sortOrder: 6,
  },
];

export type SeedProduct = {
  slug: string;
  name: string;
  brand: string;
  categorySlug: string;
  summary: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  highlights: string[];
  tags: string[];
  colors: string[];
  stock: number;
  featured?: boolean;
  badge?: string;
  affiliateUrl?: string;
  isAffiliate?: boolean;
  isActive?: boolean;
};

export const seedProducts: SeedProduct[] = [
  {
    slug: "brosse-a-dents-electrique-ultrasonique",
    name: "Brosse à Dents Électrique Ultrasonique 6 Vitesses",
    brand: "AliExpress Choice",
    categorySlug: "beauty",
    summary: "Nettoyeur de dents ultrasonique étanche IPX7 avec 6 modes de vibration, poils doux Dupont et charge rapide USB.",
    description:
      "Brosse à dents électrique ultrasonique Mode Six vitesses, cheveux doux pour la maison, chargement USB, nettoyeur de dents étanche pour adulte, ensemble automatique pour Couple. Idéale pour éliminer efficacement la plaque dentaire et blanchir les dents en douceur.",
    price: 109,
    compareAtPrice: 888,
    images: [
      px(8101673),
      px(8015807),
      px(7796461),
    ],
    highlights: [
      "6 modes de vibration intelligents",
      "Poils souples haute précision Dupont",
      "Étanchéité IPX7 lavable sous l'eau",
      "Batterie longue durée rechargeable USB",
    ],
    tags: ["bestseller", "promo", "aliexpress"],
    colors: ["Blanc Perle", "Noir Mat", "Rose Pastel"],
    stock: 850,
    featured: true,
    badge: "88% OFF",
    affiliateUrl: "https://s.click.aliexpress.com/e/_c4tpqGYH",
    isAffiliate: true,
    isActive: true,
  },
  {
    slug: "montre-connectee-smartwatch-ultra",
    name: "Montre Connectée Smartwatch Ultra Écran HD & Santé",
    brand: "AliExpress Choice",
    categorySlug: "tech",
    summary: "Suivi fréquence cardiaque, SpO2, sommeil, notifications d'appels et plus de 100 modes sportifs.",
    description:
      "Design élégant en alliage d'aluminium avec écran tactile HD ultra-lumineux. Suivez votre santé en temps réel, recevez vos notifications et gérez votre musique directement au poignet avec une autonomie record de 14 jours.",
    price: 1899,
    compareAtPrice: 5999,
    images: [
      px(8038334),
      px(30428605),
      px(36230830),
    ],
    highlights: [
      "Écran tactile HD couleur 1.95 pouces",
      "Capteurs cardio-fréquence & oxygène SpO2",
      "Étanche immersion 5ATM",
      "Autonomie 14 jours par charge",
    ],
    tags: ["new", "bestseller", "aliexpress"],
    colors: ["Noir Minuit", "Argent Sidéral", "Orange Sport"],
    stock: 420,
    featured: true,
    badge: "Bestseller",
    affiliateUrl: "https://s.click.aliexpress.com/e/_c4tpqGYH",
    isAffiliate: true,
    isActive: true,
  },
  {
    slug: "ecouteurs-sans-fil-bluetooth-tws",
    name: "Écouteurs Sans Fil TWS Bluetooth 5.3 avec Réduction de Bruit",
    brand: "AliExpress Choice",
    categorySlug: "tech",
    summary: "Son stéréo immersif Hi-Fi, microphone HD réduction de bruit active et boîtier avec affichage LED.",
    description:
      "Technologie Bluetooth 5.3 avec connexion instantanée, latence ultra-faible pour vidéos et jeux, et isolation acoustique parfaite. Jusqu'à 32 heures d'écoute totale avec le boîtier de charge rapide.",
    price: 999,
    compareAtPrice: 3499,
    images: [
      px(11063287),
      px(3563627),
      px(36130481),
    ],
    highlights: [
      "Bluetooth 5.3 sans décalage",
      "Microphones avec réduction de bruit ambiant",
      "Affichage digital du niveau de batterie",
      "Design ergonomique ultra-léger",
    ],
    tags: ["promo", "aliexpress"],
    colors: ["Noir Mat", "Blanc Pur", "Bleu Nuit"],
    stock: 950,
    featured: true,
    badge: "Promo Flash",
    affiliateUrl: "https://s.click.aliexpress.com/e/_c4tpqGYH",
    isAffiliate: true,
    isActive: true,
  },
  {
    slug: "diffuseur-huiles-essentielles-flamme-led",
    name: "Diffuseur d'Huiles Essentielles Effet Flamme LED & Aromathérapie",
    brand: "AliExpress Choice",
    categorySlug: "home",
    summary: "Humidificateur d'air ultrasonique ultra-silencieux avec jeu de lumière flamme chaleureuse.",
    description:
      "Créez une atmosphère relaxante et parfumée dans votre intérieur. Combine une brume d'aromathérapie ultrafine et une simulation de flamme à LED douce. Arrêt automatique dès que le réservoir est vide.",
    price: 1499,
    compareAtPrice: 4200,
    images: [
      px(33105316),
      px(17619624),
      px(6476112),
    ],
    highlights: [
      "Effet visuel flamme chaleureuse 3D",
      "Diffusion ultrasonique huiles essentielles",
      "Protection coupure automatique sans eau",
      "Fonctionnement ultra-silencieux < 30dB",
    ],
    tags: ["bestseller", "home", "aliexpress"],
    colors: ["Noir Carbone", "Blanc Albâtre"],
    stock: 310,
    featured: true,
    badge: "Coup de Cœur",
    affiliateUrl: "https://s.click.aliexpress.com/e/_c4tpqGYH",
    isAffiliate: true,
    isActive: true,
  },
  {
    slug: "cloud-brushed-oversized-tee",
    name: "Cloud-Brushed Oversized Tee",
    brand: "Atelier Pam",
    categorySlug: "apparel",
    summary: "Heavyweight 240gsm organic cotton with a softened, lived-in hand feel.",
    description:
      "Cut from 240gsm long-staple organic cotton and garment-washed twice for an immediately broken-in feel. The drop shoulder and boxy body give it a relaxed silhouette that holds shape wash after wash.",
    price: 6800,
    compareAtPrice: 8500,
    images: gallery("apparel", 0),
    highlights: ["240gsm organic cotton", "Garment-washed twice", "Drop shoulder, boxy fit", "Made in Portugal"],
    tags: ["new", "bestseller"],
    colors: ["Bone", "Clay", "Ink"],
    stock: 64,
    featured: true,
    badge: "Bestseller",
  },
  {
    slug: "kyoto-fleece-crewneck",
    name: "Kyoto Loopback Crewneck",
    brand: "Atelier Pam",
    categorySlug: "apparel",
    summary: "Japanese loopback terry with ribbed side panels for structure.",
    description:
      "Milled in Wakayama on vintage loopback machines, this crewneck softens beautifully while keeping a defined shoulder. Side ribbing adds structure so it layers cleanly under a coat.",
    price: 14800,
    images: gallery("apparel", 1),
    highlights: ["Japanese loopback terry", "Ribbed side panels", "Unbrushed interior", "Pre-shrunk"],
    tags: ["new"],
    colors: ["Fog", "Charcoal"],
    stock: 38,
    featured: true,
  },
  {
    slug: "linen-camp-shirt",
    name: "Belgian Linen Camp Shirt",
    brand: "Maison Verte",
    categorySlug: "apparel",
    summary: "Airy 100% Belgian linen with a soft convertible collar.",
    description:
      "A warm-weather staple in washed Belgian linen. Corozo buttons, a relaxed camp collar and a curved hem make it as easy untucked as it is layered.",
    price: 11200,
    compareAtPrice: 13900,
    images: gallery("apparel", 2),
    highlights: ["100% Belgian linen", "Corozo buttons", "Breathable open weave"],
    tags: ["sale"],
    colors: ["Sand", "Olive", "White"],
    stock: 21,
    badge: "Sale",
  },
  {
    slug: "everyday-polo-knit",
    name: "Everyday Merino Polo",
    brand: "Atelier Pam",
    categorySlug: "apparel",
    summary: "Fine-gauge merino that breathes in summer and warms in autumn.",
    description:
      "Knitted from 19.5 micron extra-fine merino, this polo resists odour and wrinkles — ideal for long travel days and long dinners after.",
    price: 16500,
    images: gallery("apparel", 3),
    highlights: ["19.5 micron merino", "Odour resistant", "Machine washable cold"],
    tags: ["bestseller"],
    colors: ["Stone", "Navy"],
    stock: 44,
  },
  {
    slug: "hand-thrown-monolith-vase",
    name: "Monolith Hand-Thrown Vase",
    brand: "Studio Kaya",
    categorySlug: "home",
    summary: "Matte stoneware vase finished with a mineral slip glaze.",
    description:
      "Each vase is thrown on the wheel in a small Lisbon studio, then finished in a mineral slip that pools softly at the base. No two pieces are identical.",
    price: 12800,
    images: gallery("home", 0),
    highlights: ["Hand-thrown stoneware", "Food-safe interior glaze", "H 32cm × Ø 14cm"],
    tags: ["new", "bestseller"],
    colors: ["Chalk", "Ash"],
    stock: 18,
    featured: true,
    badge: "Handmade",
  },
  {
    slug: "duo-ceramic-set",
    name: "Duo Ceramic Vessel Set",
    brand: "Studio Kaya",
    categorySlug: "home",
    summary: "A pair of sculptural vessels for shelves, mantels and entryways.",
    description:
      "Sold as a pair, these vessels are sized to sit together or apart. Speckled clay body with a soft satin finish that catches low evening light.",
    price: 19400,
    compareAtPrice: 22000,
    images: gallery("home", 1),
    highlights: ["Set of two", "Speckled clay body", "Satin matte finish"],
    tags: ["sale"],
    colors: ["Natural"],
    stock: 12,
  },
  {
    slug: "halo-table-lamp",
    name: "Halo Alabaster Table Lamp",
    brand: "Nord & Field",
    categorySlug: "home",
    summary: "Warm, diffused light from a solid alabaster shade.",
    description:
      "A dimmable 2700K LED sits inside a hand-cut alabaster dome, producing a soft halo that flatters every room. Brass base with a woven cloth cord.",
    price: 28900,
    images: gallery("home", 9),
    highlights: ["Hand-cut alabaster", "Dimmable 2700K LED", "Solid brass base"],
    tags: ["new"],
    colors: ["Alabaster / Brass"],
    stock: 9,
    featured: true,
  },
  {
    slug: "marble-object-tray",
    name: "Carrara Object Tray",
    brand: "Nord & Field",
    categorySlug: "home",
    summary: "A honed marble catch-all for keys, rings and small rituals.",
    description:
      "Cut from a single block of Carrara and honed to a velvety finish, with cork feet to protect surfaces.",
    price: 8600,
    images: gallery("home", 3),
    highlights: ["Solid honed Carrara", "Cork protective feet", "24cm × 16cm"],
    tags: [],
    colors: ["White marble"],
    stock: 27,
  },
  {
    slug: "aura-over-ear-headphones",
    name: "Aura Over-Ear Headphones",
    brand: "Kestrel Audio",
    categorySlug: "tech",
    summary: "Adaptive noise cancelling with 60-hour battery and memory foam ear cups.",
    description:
      "Forty-millimetre beryllium-coated drivers deliver a wide, natural soundstage. Adaptive ANC reads your environment 40,000 times a second, and the lambskin memory-foam cushions stay comfortable through long-haul flights.",
    price: 34900,
    compareAtPrice: 39900,
    images: gallery("tech", 0),
    highlights: ["Adaptive ANC", "60-hour battery", "Beryllium-coated drivers", "USB-C fast charge"],
    tags: ["bestseller", "sale"],
    colors: ["Silver", "Graphite"],
    stock: 33,
    featured: true,
    badge: "Editor's Pick",
  },
  {
    slug: "kestrel-studio-monitor-cans",
    name: "Kestrel Studio Reference Cans",
    brand: "Kestrel Audio",
    categorySlug: "tech",
    summary: "Flat-response monitoring headphones with replaceable leather pads.",
    description:
      "Built for mixing rather than impressing — an honest, flat response with a detachable braided cable and pads you can replace instead of retiring the whole pair.",
    price: 27500,
    images: gallery("tech", 1),
    highlights: ["Flat reference tuning", "Replaceable lambskin pads", "Detachable braided cable"],
    tags: ["new"],
    colors: ["Black"],
    stock: 16,
  },
  {
    slug: "field-compact-camera",
    name: "Field Compact Camera Kit",
    brand: "Orbit Optics",
    categorySlug: "tech",
    summary: "APS-C sensor, 28mm prime and a body that fits a coat pocket.",
    description:
      "A pocketable everyday camera with a 26MP APS-C sensor, fixed 28mm f/2 lens and film-simulation profiles that render straight out of camera.",
    price: 89900,
    images: gallery("tech", 4),
    highlights: ["26MP APS-C sensor", "28mm f/2 prime", "Film simulation profiles", "Weather sealed"],
    tags: ["new"],
    colors: ["Silver"],
    stock: 7,
    featured: true,
  },
  {
    slug: "desk-companion-earbuds",
    name: "Companion Wireless Earbuds",
    brand: "Kestrel Audio",
    categorySlug: "tech",
    summary: "Tiny, all-day earbuds with multipoint pairing and wireless charging.",
    description:
      "Weighing four grams each, Companion disappears in the ear while delivering surprising low end and eight hours per charge.",
    price: 15900,
    compareAtPrice: 18900,
    images: gallery("tech", 6),
    highlights: ["Multipoint Bluetooth 5.4", "IPX5 water resistant", "Wireless charging case"],
    tags: ["sale", "bestseller"],
    colors: ["Ivory", "Onyx"],
    stock: 52,
  },
  {
    slug: "midnight-renewal-serum",
    name: "Midnight Renewal Serum",
    brand: "Bloom & Bare",
    categorySlug: "beauty",
    summary: "Encapsulated retinal with squalane for overnight resurfacing.",
    description:
      "0.1% encapsulated retinal buffered with squalane and ceramide NP resurfaces while you sleep, without the flaking of traditional retinoids. Dermatologist tested.",
    price: 7400,
    images: gallery("beauty", 0),
    highlights: ["0.1% encapsulated retinal", "Ceramide NP + squalane", "Fragrance free", "30ml amber glass"],
    tags: ["bestseller"],
    colors: ["30ml"],
    stock: 71,
    featured: true,
    badge: "Cult Favourite",
  },
  {
    slug: "cloudmilk-cleanser",
    name: "Cloudmilk Gentle Cleanser",
    brand: "Bloom & Bare",
    categorySlug: "beauty",
    summary: "A pH-balanced milk cleanser that removes SPF without stripping.",
    description:
      "Oat lipid and glycerin cleanse thoroughly while keeping the barrier intact. Rinses clean, leaves no film, safe for twice-daily use.",
    price: 4200,
    images: gallery("beauty", 1),
    highlights: ["pH 5.5", "Oat lipid complex", "Removes SPF and makeup"],
    tags: ["new"],
    colors: ["200ml"],
    stock: 88,
  },
  {
    slug: "botanic-body-oil",
    name: "Botanic After-Bath Body Oil",
    brand: "Maison Verte",
    categorySlug: "beauty",
    summary: "Fast-absorbing oil with neroli, cedar and cold-pressed jojoba.",
    description:
      "Blended from nine cold-pressed botanicals, this oil sinks in within a minute and leaves a faint neroli-and-cedar trail.",
    price: 6800,
    compareAtPrice: 8200,
    images: gallery("beauty", 3),
    highlights: ["Nine cold-pressed botanicals", "Non-greasy finish", "Recyclable glass"],
    tags: ["sale"],
    colors: ["100ml"],
    stock: 40,
  },
  {
    slug: "atlas-eau-de-parfum",
    name: "Atlas Eau de Parfum",
    brand: "Maison Verte",
    categorySlug: "beauty",
    summary: "Fig leaf, salt and warm cedar — a coastline in a bottle.",
    description:
      "Top notes of fig leaf and bergamot dry down through sea salt into a warm cedar-and-ambrette base. 22% concentration for eight-hour wear.",
    price: 13500,
    images: gallery("beauty", 8),
    highlights: ["22% parfum concentration", "Fig, salt, cedar", "Refillable 50ml flacon"],
    tags: ["new", "bestseller"],
    colors: ["50ml"],
    stock: 25,
    featured: true,
  },
  {
    slug: "heritage-moka-pot",
    name: "Heritage Six-Cup Moka Pot",
    brand: "Terra Cucina",
    categorySlug: "kitchen",
    summary: "Polished aluminium stovetop brewer with a heat-safe handle.",
    description:
      "The classic octagonal moka, updated with a silicone gasket that lasts three times longer and a handle that stays cool on gas or induction plates.",
    price: 5400,
    images: gallery("kitchen", 0),
    highlights: ["Six-cup capacity", "Long-life silicone gasket", "Gas, electric and induction plate"],
    tags: ["bestseller"],
    colors: ["Polished aluminium"],
    stock: 58,
    featured: true,
  },
  {
    slug: "glass-pourover-carafe",
    name: "Glass Pour-Over Carafe",
    brand: "Terra Cucina",
    categorySlug: "kitchen",
    summary: "Borosilicate carafe with a laser-etched dose scale.",
    description:
      "Hand-blown borosilicate with a wide brew bed for even extraction, plus a walnut collar and leather tie.",
    price: 7800,
    compareAtPrice: 9400,
    images: gallery("kitchen", 1),
    highlights: ["Hand-blown borosilicate", "Walnut collar", "600ml with dose scale"],
    tags: ["sale"],
    colors: ["Clear / Walnut"],
    stock: 30,
  },
  {
    slug: "burr-coffee-grinder",
    name: "Precision Conical Burr Grinder",
    brand: "Terra Cucina",
    categorySlug: "kitchen",
    summary: "Forty-eight click settings from espresso to French press.",
    description:
      "Stainless conical burrs with 48 detented settings and a magnetic catch cup. Consistent particle distribution without the price of a commercial grinder.",
    price: 18900,
    images: gallery("kitchen", 2),
    highlights: ["48 grind settings", "Stainless conical burrs", "Magnetic catch cup"],
    tags: ["new", "bestseller"],
    colors: ["Matte black"],
    stock: 22,
    featured: true,
    badge: "New",
  },
  {
    slug: "stoneware-mug-set",
    name: "Reactive Glaze Mug Set",
    brand: "Studio Kaya",
    categorySlug: "kitchen",
    summary: "Four 300ml mugs, each with a one-of-a-kind reactive glaze.",
    description:
      "Fired at 1240°C so the reactive glaze breaks differently on every piece. Dishwasher and microwave safe despite the artisanal finish.",
    price: 9600,
    images: gallery("kitchen", 5),
    highlights: ["Set of four", "300ml capacity", "Dishwasher safe"],
    tags: [],
    colors: ["Indigo", "Sand"],
    stock: 34,
  },
  {
    slug: "voyager-leather-backpack",
    name: "Voyager Full-Grain Backpack",
    brand: "Field & Forge",
    categorySlug: "carry",
    summary: "Vegetable-tanned leather with a 16-inch padded laptop sleeve.",
    description:
      "Cut from 1.8mm vegetable-tanned hide that patinas with use, with solid brass hardware, a suspended laptop sleeve and a lifetime repair guarantee.",
    price: 42500,
    compareAtPrice: 49000,
    images: gallery("carry", 0),
    highlights: ["1.8mm vegetable-tanned leather", "16\" padded sleeve", "Solid brass hardware", "Lifetime repairs"],
    tags: ["bestseller", "sale"],
    colors: ["Indigo / Tan", "Espresso"],
    stock: 14,
    featured: true,
    badge: "Lifetime Guarantee",
  },
  {
    slug: "weekender-duffle",
    name: "Weekender Waxed Duffle",
    brand: "Field & Forge",
    categorySlug: "carry",
    summary: "Forty-litre waxed canvas duffle that meets carry-on limits.",
    description:
      "Waxed British canvas with leather-reinforced corners, a removable shoulder pad and an internal pocket that swallows a pair of shoes.",
    price: 29500,
    images: gallery("carry", 3),
    highlights: ["40L carry-on size", "Waxed British canvas", "Leather-reinforced corners"],
    tags: ["new"],
    colors: ["Charcoal", "Field green"],
    stock: 19,
  },
  {
    slug: "meridian-automatic-watch",
    name: "Meridian Automatic Watch",
    brand: "Orbit Optics",
    categorySlug: "carry",
    summary: "38mm sapphire-crystal automatic with a 41-hour reserve.",
    description:
      "A restrained 38mm case houses a Miyota 9039 automatic movement, domed sapphire crystal and 100m water resistance. Quick-release straps included.",
    price: 54000,
    images: gallery("carry", 2),
    highlights: ["Miyota 9039 automatic", "Sapphire crystal", "100m water resistant", "Quick-release straps"],
    tags: ["new", "bestseller"],
    colors: ["Steel / Cream"],
    stock: 11,
    featured: true,
  },
  {
    slug: "everyday-card-wallet",
    name: "Everyday Slim Card Wallet",
    brand: "Field & Forge",
    categorySlug: "carry",
    summary: "Four pockets, one pull-tab, no bulk.",
    description:
      "Two panels of vegetable-tanned leather, saddle-stitched by hand with waxed linen thread. Slim enough for a front pocket, roomy enough for a week of cards.",
    price: 9800,
    images: gallery("carry", 5),
    highlights: ["Hand saddle-stitched", "Four card pockets", "Slims with use"],
    tags: [],
    colors: ["Tan", "Black"],
    stock: 62,
  },
];

type SeedReview = { author: string; rating: number; title: string; body: string; daysAgo: number };

const REVIEW_BANK: SeedReview[][] = [
  [
    { author: "Elena M.", rating: 5, title: "Better than expected", body: "Photos don't do it justice — the finish is flawless and it arrived in two days. I've already ordered a second.", daysAgo: 6 },
    { author: "Tomás R.", rating: 5, title: "Worth every cent", body: "I've bought cheaper versions of this three times over. Should have started here. Feels like it will last a decade.", daysAgo: 19 },
    { author: "Priya N.", rating: 4, title: "Beautiful, runs slightly large", body: "Quality is superb. I sized down and it's perfect now. Packaging was lovely too — no plastic anywhere.", daysAgo: 33 },
  ],
  [
    { author: "Marcus L.", rating: 5, title: "My new favourite thing", body: "Three weeks in and it's already part of my daily routine. Genuinely thoughtful design, nothing extraneous.", daysAgo: 4 },
    { author: "Sofia K.", rating: 4, title: "Great, with one nitpick", body: "Love the material and the weight of it. Would prefer one more colour option, but no complaints on quality.", daysAgo: 15 },
    { author: "Daniel O.", rating: 5, title: "Gifted it twice already", body: "Bought one for myself, then two more as gifts. Both recipients messaged me the same day to ask where it was from.", daysAgo: 27 },
    { author: "Hana W.", rating: 5, title: "Impeccable finishing", body: "You can feel where the money went. Stitching and edges are clean, and customer service answered within an hour.", daysAgo: 48 },
  ],
  [
    { author: "Jonas F.", rating: 5, title: "Exceptional", body: "Rarely leave reviews but this earned one. Exactly as described, shipped fast, and the details are considered.", daysAgo: 9 },
    { author: "Amara T.", rating: 4, title: "Very happy", body: "Slightly different in tone to the photos under warm light, but honestly I like it more in person.", daysAgo: 22 },
    { author: "Ines B.", rating: 5, title: "Everyday use, zero regrets", body: "Two months of daily use and it still looks new. This is the standard I'll judge everything else by.", daysAgo: 61 },
  ],
];

export function reviewsForProduct(slug: string, index: number) {
  const bank = REVIEW_BANK[index % REVIEW_BANK.length];
  const extra = index % 2 === 0 ? REVIEW_BANK[(index + 1) % REVIEW_BANK.length].slice(0, 1) : [];
  return [...bank, ...extra].map((r) => ({
    productSlug: slug,
    author: r.author,
    rating: r.rating,
    title: r.title,
    body: r.body,
    verified: true,
    createdAt: new Date(Date.now() - r.daysAgo * 24 * 60 * 60 * 1000),
  }));
}
