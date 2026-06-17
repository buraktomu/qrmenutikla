import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Starting Category-Menu relationship repair...");

  // 1. Find all categories with menuId null
  const nullCategories = await prisma.category.findMany({
    where: {
      menuId: null
    }
  });

  console.log(`Found ${nullCategories.length} categories with null menuId.`);

  if (nullCategories.length === 0) {
    console.log("No repair needed.");
    return;
  }

  let repairedCount = 0;

  for (const cat of nullCategories) {
    // 2. Find a Menu belonging to the same business
    // We order by createdAt asc so we fetch the oldest/default menu if multiple exist.
    let menu = await prisma.menu.findFirst({
      where: {
        businessId: cat.businessId
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // 3. If no Menu exists for this business, create a default one
    if (!menu) {
      const business = await prisma.business.findUnique({
        where: { id: cat.businessId }
      });
      const businessName = business?.name || "İşletme";
      const menuName = `${businessName} Menü`;
      console.log(`No Menu found for business ${cat.businessId}. Creating default Menu: "${menuName}"...`);
      menu = await prisma.menu.create({
        data: {
          businessId: cat.businessId,
          name: menuName
        }
      });
    }

    // 4. Update the Category's menuId to map to this Menu
    await prisma.category.update({
      where: {
        id: cat.id
      },
      data: {
        menuId: menu.id
      }
    });

    repairedCount++;
    console.log(`Category "${cat.name}" (ID: ${cat.id}) linked to Menu "${menu.name}" (ID: ${menu.id})`);
  }

  console.log(`Repair finished. Total categories repaired: ${repairedCount}`);
}

main()
  .catch((e) => {
    console.error("Repair failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
