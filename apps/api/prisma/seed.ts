import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding the database...');

  // 1. Create a category
  const category = await prisma.category.upsert({
    where: { slug: 'electronics' },
    update: {},
    create: {
      name: 'Electronics',
      slug: 'electronics',
    },
  });

  // 2. Create some products
  const product1 = await prisma.product.upsert({
    where: { slug: 'target-returns-electronics-pallet' },
    update: {},
    create: {
      name: 'Target Returns Electronics Pallet',
      slug: 'target-returns-electronics-pallet',
      description: 'Mixed electronics returns from Target. Untested.',
      price: 550.00,
      stock: 1,
      categoryId: category.id,
      media: {
        create: [
          { url: 'https://images.unsplash.com/photo-1555529771-835f59fc5efe?q=80&w=800&auto=format&fit=crop', position: 0 }
        ]
      },
      variants: {
        create: [
          {
            sku: 'TR-ELEC-001',
            price: 550.00,
            stock: 1,
            inventory: {
              create: {
                quantity: 1,
                reserved: 0
              }
            }
          }
        ]
      }
    },
  });

  const product2 = await prisma.product.upsert({
    where: { slug: 'amazon-overstock-home-appliance' },
    update: {},
    create: {
      name: 'Amazon Overstock Home Appliance Lot',
      slug: 'amazon-overstock-home-appliance',
      description: 'Brand new home appliances with box damage. 2 pallets.',
      price: 1200.00,
      stock: 2,
      categoryId: category.id,
      media: {
        create: [
          { url: 'https://images.unsplash.com/photo-1583847268964-b28e5f884f67?q=80&w=800&auto=format&fit=crop', position: 0 }
        ]
      },
      variants: {
        create: [
          {
            sku: 'AMZ-HA-001',
            price: 1200.00,
            stock: 2,
            inventory: {
              create: {
                quantity: 2,
                reserved: 0
              }
            }
          }
        ]
      }
    },
  });

  console.log('Seeding complete!', { category, product1, product2 });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
