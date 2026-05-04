import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const envPath = fileURLToPath(new URL('../../server/.env', import.meta.url));
dotenv.config({ path: envPath });

const prisma = new PrismaClient();

async function main() {
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'laptopuri' },
      update: {},
      create: { name: 'Laptopuri', slug: 'laptopuri' },
    }),
    prisma.category.upsert({
      where: { slug: 'telefoane' },
      update: {},
      create: { name: 'Telefoane', slug: 'telefoane' },
    }),
    prisma.category.upsert({
      where: { slug: 'televizoare' },
      update: {},
      create: { name: 'Televizoare', slug: 'televizoare' },
    }),
    prisma.category.upsert({
      where: { slug: 'electrocasnice' },
      update: {},
      create: { name: 'Electrocasnice', slug: 'electrocasnice' },
    }),
  ]);

  const [laptops, phones, tvs, appliances] = categories;

  const products = [
    {
      categoryId: laptops.id,
      name: 'ASUS VivoBook 15',
      slug: 'asus-vivobook-15',
      description: 'Laptop 15.6 inch, 16GB RAM, SSD 512GB',
      price: 2999,
      stock: 12,
      imageUrl: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2',
      brand: 'ASUS',
    },
    {
      categoryId: laptops.id,
      name: 'Lenovo IdeaPad 5',
      slug: 'lenovo-ideapad-5',
      description: 'Laptop pentru office si multimedia',
      price: 3499,
      stock: 9,
      imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853',
      brand: 'Lenovo',
    },
    {
      categoryId: laptops.id,
      name: 'Apple MacBook Air M2',
      slug: 'apple-macbook-air-m2',
      description: 'Laptop premium ultrabook',
      price: 6399,
      stock: 6,
      imageUrl: 'https://images.unsplash.com/photo-1517336714739-489689fd1ca8',
      brand: 'Apple',
    },
    {
      categoryId: phones.id,
      name: 'Samsung Galaxy A55',
      slug: 'samsung-galaxy-a55',
      description: 'Telefon 5G, 8GB RAM, 256GB',
      price: 1899,
      stock: 25,
      imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9',
      brand: 'Samsung',
    },
    {
      categoryId: phones.id,
      name: 'iPhone 14',
      slug: 'iphone-14',
      description: 'Smartphone Apple cu camere avansate',
      price: 3999,
      stock: 14,
      imageUrl: 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb',
      brand: 'Apple',
    },
    {
      categoryId: phones.id,
      name: 'Xiaomi Redmi Note 13',
      slug: 'xiaomi-redmi-note-13',
      description: 'Telefon cu autonomie mare',
      price: 1299,
      stock: 21,
      imageUrl: 'https://images.unsplash.com/photo-1610792516307-ea5acd9c3b00',
      brand: 'Xiaomi',
    },
    {
      categoryId: tvs.id,
      name: 'Samsung QLED 55',
      slug: 'samsung-qled-55',
      description: 'Smart TV 4K UHD',
      price: 2799,
      stock: 8,
      imageUrl: 'https://images.unsplash.com/photo-1593784991095-a205069470b6',
      brand: 'Samsung',
    },
    {
      categoryId: tvs.id,
      name: 'LG OLED C3 55',
      slug: 'lg-oled-c3-55',
      description: 'TV OLED pentru filme si gaming',
      price: 5299,
      stock: 4,
      imageUrl: 'https://images.unsplash.com/photo-1461151304267-38535e780c79',
      brand: 'LG',
    },
    {
      categoryId: appliances.id,
      name: 'Masina de spalat Beko',
      slug: 'masina-spalat-beko',
      description: 'Masina de spalat 8kg',
      price: 1699,
      stock: 10,
      imageUrl: 'https://images.unsplash.com/photo-1626806787461-102c1a6c4b20',
      brand: 'Beko',
    },
    {
      categoryId: appliances.id,
      name: 'Frigider Arctic',
      slug: 'frigider-arctic',
      description: 'Frigider cu congelator jos',
      price: 2099,
      stock: 7,
      imageUrl: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30',
      brand: 'Arctic',
    },
    {
      categoryId: appliances.id,
      name: 'Espressor DeLonghi',
      slug: 'espressor-delonghi',
      description: 'Espressor manual pentru cafea',
      price: 1199,
      stock: 11,
      imageUrl: 'https://images.unsplash.com/photo-1511920170033-f8396924c348',
      brand: 'DeLonghi',
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product,
    });
  }

  // Create test user
  const passwordHash = await bcrypt.hash('mariogamer22', 10);
  await prisma.user.upsert({
    where: { email: 'opritamario26@gmail.com' },
    update: { emailVerified: true, role: 'ADMIN' },
    create: {
      email: 'opritamario26@gmail.com',
      fullName: 'Oprita Mario',
      passwordHash,
      role: 'ADMIN',
      emailVerified: true,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    await prisma.$disconnect();
    throw error;
  });
