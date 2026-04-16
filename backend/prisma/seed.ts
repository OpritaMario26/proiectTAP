import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const laptops = await prisma.category.upsert({
    where: { slug: 'laptopuri' },
    update: {},
    create: {
      name: 'Laptopuri',
      slug: 'laptopuri',
    },
  });

  const telefoane = await prisma.category.upsert({
    where: { slug: 'telefoane' },
    update: {},
    create: {
      name: 'Telefoane',
      slug: 'telefoane',
    },
  });

  await prisma.product.upsert({
    where: { slug: 'asus-vivobook-15' },
    update: {},
    create: {
      categoryId: laptops.id,
      name: 'ASUS VivoBook 15',
      slug: 'asus-vivobook-15',
      description: 'Laptop 15.6 inch, 16GB RAM, SSD 512GB',
      price: 2999,
      stock: 12,
      imageUrl: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2',
      brand: 'ASUS',
    },
  });

  await prisma.product.upsert({
    where: { slug: 'samsung-galaxy-a55' },
    update: {},
    create: {
      categoryId: telefoane.id,
      name: 'Samsung Galaxy A55',
      slug: 'samsung-galaxy-a55',
      description: 'Telefon 5G, 8GB RAM, 256GB',
      price: 1899,
      stock: 25,
      imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9',
      brand: 'Samsung',
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
