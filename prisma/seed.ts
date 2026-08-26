import 'dotenv/config';
import { PrismaClient, UserRole, ProductSize, ProductFrame, Category } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:local_dev_password_123@localhost:5432/hellfire_db?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ON_WALL_IMAGES = [
  'https://images.unsplash.com/photo-1549887534-1541e9326642?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1530982011887-3cc11ac86807?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1616422285623-13ff0162193c?auto=format&fit=crop&w=600&q=80'
];

const IN_HAND_IMAGES = [
  'https://images.unsplash.com/photo-1580136579312-94651dfd596d?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1582230225124-400f191cb24a?auto=format&fit=crop&w=600&q=80'
];

const GALLERY_IMAGES = [
  'https://images.unsplash.com/photo-1601887389937-0b02c26b6c3c?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1579783928621-7a13d66a62d1?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1531243269054-5ebf6f3b0b6e?auto=format&fit=crop&w=600&q=80'
];

function getProductImages(slug: string, primaryUrl: string): string[] {
  const hash = slug.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const wallImg = ON_WALL_IMAGES[hash % ON_WALL_IMAGES.length];
  const handImg = IN_HAND_IMAGES[hash % IN_HAND_IMAGES.length];
  const galleryImg = GALLERY_IMAGES[hash % GALLERY_IMAGES.length];
  
  return [primaryUrl, wallImg, handImg, galleryImg];
}

async function main() {
  console.log('--- Seeding Roles & Users (Idempotent) ---');
  
  const adminPassword = await bcrypt.hash('HellfireAdmin123!', 10);
  const customerPassword = await bcrypt.hash('HellfireCustomer123!', 10);

  let admin = await prisma.user.findUnique({
    where: { email: 'admin@hellfireprints.com' },
  });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        name: 'Hellfire Admin',
        email: 'admin@hellfireprints.com',
        passwordHash: adminPassword,
        role: UserRole.ADMIN,
        image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      },
    });
    console.log(`Seeded Admin User: ${admin.email}`);
  }

  let customer = await prisma.user.findUnique({
    where: { email: 'customer@hellfireprints.com' },
  });
  if (!customer) {
    customer = await prisma.user.create({
      data: {
        name: 'Raj Kumar',
        email: 'customer@hellfireprints.com',
        passwordHash: customerPassword,
        role: UserRole.CUSTOMER,
        image: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
      },
    });
    console.log(`Seeded Customer User: ${customer.email}`);
  }

  console.log('--- Seeding Sizes (Idempotent) ---');
  const sizes = [
    { name: 'A4', dimensions: '21 x 29.7 cm', width: 21.0, height: 29.7, additionalPrice: 0.0 },
    { name: 'A3', dimensions: '29.7 x 42 cm', width: 29.7, height: 42.0, additionalPrice: 199.0 },
    { name: 'A2', dimensions: '42 x 59.4 cm', width: 42.0, height: 59.4, additionalPrice: 449.0 },
    { name: 'A1', dimensions: '59.4 x 84.1 cm', width: 59.4, height: 84.1, additionalPrice: 899.0 },
  ];

  const dbSizes: ProductSize[] = [];
  for (const s of sizes) {
    let dbSize = await prisma.productSize.findFirst({
      where: { name: s.name },
    });
    if (!dbSize) {
      dbSize = await prisma.productSize.create({ data: s });
      console.log(`Seeded Size: ${s.name}`);
    }
    dbSizes.push(dbSize);
  }

  console.log('--- Seeding Frames (Idempotent) ---');
  const frames = [
    { name: 'Unframed / Poster Only', material: 'Paper only', color: 'N/A', additionalPrice: 0.0 },
    { name: 'Matte Black Classic Frame', material: 'Wood & Acrylic', color: 'Black', additionalPrice: 149.0 },
    { name: 'Crimson Red Hellfire Frame', material: 'Glossy Premium Wood', color: 'Red', additionalPrice: 249.0 },
    { name: 'Gold Luxury Accent Frame', material: 'Polished Metal Accent', color: 'Gold', additionalPrice: 399.0 },
  ];

  const dbFrames: ProductFrame[] = [];
  for (const f of frames) {
    let dbFrame = await prisma.productFrame.findFirst({
      where: { name: f.name },
    });
    if (!dbFrame) {
      dbFrame = await prisma.productFrame.create({ data: f });
      console.log(`Seeded Frame: ${f.name}`);
    }
    dbFrames.push(dbFrame);
  }

  console.log('--- Seeding Categories (Idempotent) ---');
  const categories = [
    { name: 'Anime', slug: 'anime', description: 'Legendary anime styles and cyberpunk aesthetics.', image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=400&q=80' },
    { name: 'Cars', slug: 'cars', description: 'JDM, supercars, and classic automotive photography.', image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=400&q=80' },
    { name: 'Formula 1', slug: 'formula-1', description: 'Cinematic trackside moments and historic racing legends.', image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=400&q=80' },
    { name: 'Gaming', slug: 'gaming', description: 'Retro arcades, controller layouts, and fantasy landscapes.', image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=400&q=80' },
    { name: 'Music', slug: 'music', description: 'Album covers, instruments, and synthwave vinyl records.', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80' },
    { name: 'Minimalist', slug: 'minimalist', description: 'Clean lines, geometry, and high-end luxury layouts.', image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=400&q=80' },
    { name: 'Movies', slug: 'movies', description: 'Cult classics, sci-fi masterpieces, and vintage cinema.', image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=400&q=80' },
    { name: 'Architecture', slug: 'architecture', description: 'Brutalist concrete structures and architectural sketches.', image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80' },
    { name: 'Sports', slug: 'sports', description: 'Historic sporting triumphs and athletic icons.', image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=400&q=80' },
    { name: 'Technology', slug: 'technology', description: 'Retro circuitry, motherboard patents, and digital art.', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80' },
    { name: 'Abstract Art', slug: 'abstract-art', description: 'Splashes of raw energy, canvas textures, and modern forms.', image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=400&q=80' },
    { name: 'Custom', slug: 'custom', description: 'Upload your own image and design a premium poster.', image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=400&q=80' },
  ];

  const dbCategories: Category[] = [];
  for (const c of categories) {
    let dbCategory = await prisma.category.findUnique({
      where: { slug: c.slug },
    });
    if (!dbCategory) {
      dbCategory = await prisma.category.create({ data: c });
      console.log(`Seeded Category: ${c.name}`);
    }
    dbCategories.push(dbCategory);
  }

  console.log('--- Seeding Products (Idempotent) ---');
  const productsData = [
    // 1. Existing Products
    {
      title: 'Tokyo Neon Drift',
      slug: 'tokyo-neon-drift',
      description: 'A classic JDM Legend drifting through Shinjuku neon rain. Printed on premium heavy-stock paper.',
      price: 399.0,
      MRP: 799.0,
      discount: 50.0,
      SKU: 'HFP-CAR-TND-01',
      featured: true,
      trending: true,
      categorySlug: 'cars',
      images: [
        'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1616422285623-13ff0162193c?auto=format&fit=crop&w=600&q=80'
      ],
      ratings: [5, 5, 4, 5],
      reviews: [
        { rating: 5, comment: 'Insane quality! The red in the neon pops perfectly in my setup.' },
        { rating: 5, comment: 'Looks premium, shipping was fast too!' }
      ]
    },
    {
      title: 'Synthwave Skyline GT-R',
      slug: 'synthwave-skyline-gtr',
      description: 'An iconic R34 Skyline backlit by a glowing synthwave sun. Retro-futurism at its best.',
      price: 499.0,
      MRP: 999.0,
      discount: 50.0,
      SKU: 'HFP-CAR-SSG-02',
      featured: false,
      trending: true,
      categorySlug: 'cars',
      images: [
        'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=600&q=80'
      ],
      ratings: [5, 4, 5],
      reviews: [
        { rating: 5, comment: 'Perfect addition to my gaming room.' }
      ]
    },
    {
      title: 'Neon Cyberpunk Samurai',
      slug: 'neon-cyberpunk-samurai',
      description: 'A futuristic warrior overlooking Neo Tokyo skyline in deep crimson and electric blue hues.',
      price: 449.0,
      MRP: 899.0,
      discount: 50.0,
      SKU: 'HFP-ANI-NCS-01',
      featured: true,
      trending: false,
      categorySlug: 'anime',
      images: [
        'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80'
      ],
      ratings: [5, 5, 5],
      reviews: []
    },
    {
      title: 'Monaco GP Retro Cinematic',
      slug: 'monaco-gp-retro-cinematic',
      description: 'Golden era Formula 1 racing around the tight turns of Monte Carlo. Vintage speed aesthetic.',
      price: 499.0,
      MRP: 999.0,
      discount: 50.0,
      SKU: 'HFP-F1-MGR-01',
      featured: true,
      trending: true,
      categorySlug: 'formula-1',
      images: [
        'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=600&q=80'
      ],
      ratings: [4, 5, 5, 4],
      reviews: [
        { rating: 5, comment: 'Amazing details. The paper texture makes it look like an authentic vintage poster.' }
      ]
    },
    {
      title: 'Retro Arcade Cabinet Blueprint',
      slug: 'retro-arcade-cabinet-blueprint',
      description: 'A glowing schematics print of a classic 1980s coin-op machine. Perfect for retro game rooms.',
      price: 349.0,
      MRP: 699.0,
      discount: 50.0,
      SKU: 'HFP-GAM-RAB-01',
      featured: false,
      trending: false,
      categorySlug: 'gaming',
      images: [
        'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=600&q=80'
      ],
      ratings: [5, 4],
      reviews: []
    },
    {
      title: 'L\'Imperatrice Vintage Synth',
      slug: 'limperatrice-vintage-synth',
      description: 'A stylish musical design showcasing modular synths and minimalist typography.',
      price: 399.0,
      MRP: 799.0,
      discount: 50.0,
      SKU: 'HFP-MUS-LIV-01',
      featured: false,
      trending: true,
      categorySlug: 'music',
      images: [
        'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80'
      ],
      ratings: [5],
      reviews: []
    },
    {
      title: 'Abstract Geometric Bauhaus',
      slug: 'abstract-geometric-bauhaus',
      description: 'A premium crimson, black, and beige Bauhaus art poster. Pure minimalist style.',
      price: 499.0,
      MRP: 999.0,
      discount: 50.0,
      SKU: 'HFP-MIN-AGB-01',
      featured: true,
      trending: false,
      categorySlug: 'minimalist',
      images: [
        'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80'
      ],
      ratings: [5, 5, 5, 5],
      reviews: []
    },

    // 2. Custom Poster Base Product
    {
      title: 'Custom Poster Print',
      slug: 'custom-poster',
      description: 'Create your own personalized design. Upload custom artwork and overlay text. Handcrafted to order.',
      price: 499.0,
      MRP: 999.0,
      discount: 50.0,
      SKU: 'HFP-CUST-POSTER',
      featured: false,
      trending: false,
      categorySlug: 'custom',
      images: [
        'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80'
      ],
      ratings: [5, 5],
      reviews: []
    },

    // 3. 10-12 Additional Products
    {
      title: 'Elden Tree Sanctuary',
      slug: 'elden-tree-sanctuary',
      description: 'A breathtaking landscape poster of the glowing golden sanctuary tree amidst dark fantasy ruins.',
      price: 449.0,
      MRP: 899.0,
      discount: 50.0,
      SKU: 'HFP-GAM-ETS-02',
      featured: true,
      trending: true,
      categorySlug: 'gaming',
      images: [
        'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80'
      ],
      ratings: [5, 5, 5],
      reviews: []
    },
    {
      title: 'Nordschleife Green Hell',
      slug: 'nordschleife-green-hell',
      description: 'Detailed elevation blueprint of the historic Nurburgring Nordschleife race track in crimson vector lines.',
      price: 499.0,
      MRP: 999.0,
      discount: 50.0,
      SKU: 'HFP-CAR-NNT-03',
      featured: false,
      trending: true,
      categorySlug: 'cars',
      images: [
        'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=600&q=80'
      ],
      ratings: [5, 4, 5],
      reviews: []
    },
    {
      title: 'Gargantua Singularity',
      slug: 'gargantua-singularity',
      description: 'A cinematic high-contrast rendering of a massive black hole event horizon in deep space.',
      price: 449.0,
      MRP: 899.0,
      discount: 50.0,
      SKU: 'HFP-MOV-IBH-02',
      featured: true,
      trending: true,
      categorySlug: 'movies',
      images: [
        'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80'
      ],
      ratings: [5, 5],
      reviews: []
    },
    {
      title: 'Colossal Wall Defense',
      slug: 'colossal-wall-defense',
      description: 'High-contrast silhouette artwork of a titan peering over the historic brick defense walls.',
      price: 399.0,
      MRP: 799.0,
      discount: 50.0,
      SKU: 'HFP-ANI-AOT-02',
      featured: false,
      trending: true,
      categorySlug: 'anime',
      images: [
        'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80'
      ],
      ratings: [4, 5],
      reviews: []
    },
    {
      title: 'Bauhaus Exhibition 1923',
      slug: 'bauhaus-exhibition-1923',
      description: 'Vintage exhibition design poster featuring clean typography and primary block structures.',
      price: 499.0,
      MRP: 999.0,
      discount: 50.0,
      SKU: 'HFP-MIN-BEA-02',
      featured: true,
      trending: false,
      categorySlug: 'minimalist',
      images: [
        'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?auto=format&fit=crop&w=600&q=80'
      ],
      ratings: [5, 5, 5],
      reviews: []
    },
    {
      title: 'Daft Punk Alive 2007',
      slug: 'daft-punk-alive-2007',
      description: 'Minimalist metallic vector blueprint of the legendary helmet structures from the Alive tour.',
      price: 399.0,
      MRP: 799.0,
      discount: 50.0,
      SKU: 'HFP-MUS-DPB-02',
      featured: false,
      trending: true,
      categorySlug: 'music',
      images: [
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80'
      ],
      ratings: [5, 4, 5],
      reviews: []
    },
    {
      title: 'Brutalist Concrete Horizon',
      slug: 'brutalist-concrete-horizon',
      description: 'High-contrast architectural photography highlighting heavy shadows and raw brutalist design panels.',
      price: 449.0,
      MRP: 899.0,
      discount: 50.0,
      SKU: 'HFP-ARC-BCH-01',
      featured: false,
      trending: false,
      categorySlug: 'architecture',
      images: [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80'
      ],
      ratings: [4, 5],
      reviews: []
    },
    {
      title: 'Senna Eternal Legend',
      slug: 'senna-eternal-legend',
      description: 'Minimalist quote poster celebrating Ayrton Senna, featuring his signature yellow and green helmet design.',
      price: 499.0,
      MRP: 999.0,
      discount: 50.0,
      SKU: 'HFP-SPO-SEL-01',
      featured: true,
      trending: true,
      categorySlug: 'sports',
      images: [
        'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=600&q=80'
      ],
      ratings: [5, 5, 5, 5],
      reviews: []
    },
    {
      title: 'Silicon Retro Motherboard',
      slug: 'silicon-retro-motherboard',
      description: 'Patent schematics print of microcircuitry layout from the retro computer chipsets era.',
      price: 349.0,
      MRP: 699.0,
      discount: 50.0,
      SKU: 'HFP-TEC-SRM-01',
      featured: false,
      trending: false,
      categorySlug: 'technology',
      images: [
        'https://images.unsplash.com/photo-1601524909162-be87252be298?auto=format&fit=crop&w=600&q=80'
      ],
      ratings: [4, 4],
      reviews: []
    },
    {
      title: 'Abstract Crimson Distortion',
      slug: 'abstract-crimson-distortion',
      description: 'Splashes of raw energy, canvas textures, and modern forms in contrasting charcoal and crimson.',
      price: 499.0,
      MRP: 999.0,
      discount: 50.0,
      SKU: 'HFP-ART-ACD-01',
      featured: true,
      trending: false,
      categorySlug: 'abstract-art',
      images: [
        'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=600&q=80'
      ],
      ratings: [5, 5, 4],
      reviews: []
    },

    // 4. Razorpay Verification Products (Intentionally Low-Priced)
    {
      title: 'Razorpay Verification Poster — ₹1',
      slug: 'razorpay-verification-1',
      description: 'Special verification print. Do not purchase unless requested for manual payment verification.',
      price: 1.0,
      MRP: 1.0,
      discount: 0.0,
      SKU: 'HFP-VERIFY-1',
      featured: false,
      trending: false,
      categorySlug: 'minimalist',
      images: [
        'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80'
      ],
      ratings: [5],
      reviews: []
    },
    {
      title: 'Razorpay Verification Poster — ₹2',
      slug: 'razorpay-verification-2',
      description: 'Special verification print. Do not purchase unless requested for manual payment verification.',
      price: 2.0,
      MRP: 2.0,
      discount: 0.0,
      SKU: 'HFP-VERIFY-2',
      featured: false,
      trending: false,
      categorySlug: 'minimalist',
      images: [
        'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80'
      ],
      ratings: [5],
      reviews: []
    }
  ];

  for (const p of productsData) {
    const category = dbCategories.find(c => c.slug === p.categorySlug);
    if (!category) continue;

    // Check if product SKU already exists
    let product = await prisma.product.findUnique({
      where: { SKU: p.SKU },
    });

    const primaryUrl = p.images[0] || 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80';
    const finalImagesList = getProductImages(p.slug, primaryUrl);

    if (!product) {
      // Create main product
      product = await prisma.product.create({
        data: {
          title: p.title,
          slug: p.slug,
          description: p.description,
          price: p.price,
          MRP: p.MRP,
          discount: p.discount,
          SKU: p.SKU,
          featured: p.featured,
          trending: p.trending,
          categoryId: category.id,
        },
      });
      console.log(`Seeded Product: "${p.title}"`);

      // Create Ratings
      for (const r of p.ratings) {
        await prisma.productRating.create({
          data: {
            rating: r,
            productId: product.id,
          },
        });
      }

      // Create Reviews
      for (const rev of p.reviews) {
        await prisma.review.create({
          data: {
            rating: rev.rating,
            comment: rev.comment,
            userId: customer.id,
            productId: product.id,
          },
        });
      }

      // Create Inventory
      await prisma.inventory.create({
        data: {
          productId: product.id,
          quantity: 120, // Stock level
          alertThreshold: 10,
        },
      });

      // Create Variants (Sizes x Frames x PaperTypes)
      // To limit database size, we generate standard size/frame variants
      const paperTypes = ['Matte Premium (300 GSM)', 'Glossy Metallic (320 GSM)'];
      let variantCount = 0;

      for (const size of dbSizes) {
        for (const frame of dbFrames) {
          for (const paper of paperTypes) {
            const additionalPrice = size.additionalPrice + frame.additionalPrice + (paper.includes('Glossy') ? 49.0 : 0.0);
            
            await prisma.productVariant.create({
              data: {
                productId: product.id,
                sizeId: size.id,
                frameId: frame.id,
                paperType: paper,
                additionalPrice,
                stock: 25,
                SKU: `${product.SKU}-${size.name}-${frame.name.substring(0, 3).toUpperCase()}-${paper.includes('Glossy') ? 'GLO' : 'MAT'}`.replace(/\s+/g, ''),
              },
            });
            variantCount++;
          }
        }
      }
      console.log(`Seeded Product variants: "${product.title}" with ${variantCount} size/frame/paper variants.`);
    } else {
      console.log(`Product already exists: "${product.title}". Refreshing images...`);
      // Clean up old images first to prevent duplicates
      await prisma.productImage.deleteMany({
        where: { productId: product.id },
      });
    }

    // Seed the 4 images for the product (both for new and updated ones)
    for (let i = 0; i < finalImagesList.length; i++) {
      await prisma.productImage.create({
        data: {
          url: finalImagesList[i],
          alt: `${product.title} - ${['Normal', 'On Wall', 'In Hand', 'Gallery'][i]} View`,
          productId: product.id,
          sortOrder: i,
        },
      });
    }
  }

  console.log('--- Seeding Coupons (Idempotent) ---');
  const couponsData = [
    {
      code: 'WELCOME10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      maxDiscount: 200,
      minPurchase: 0,
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      active: true,
    },
    {
      code: 'SAVE150',
      discountType: 'FIXED',
      discountValue: 150,
      minPurchase: 1499,
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      active: true,
    },
    {
      code: 'HELLFIRE15',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      maxDiscount: 500,
      minPurchase: 1499,
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      active: true,
    },
  ];

  for (const c of couponsData) {
    let dbCoupon = await prisma.coupon.findUnique({
      where: { code: c.code },
    });
    if (!dbCoupon) {
      dbCoupon = await prisma.coupon.create({ data: c });
      console.log(`Seeded Coupon: ${c.code}`);
    }
  }
  
  console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
