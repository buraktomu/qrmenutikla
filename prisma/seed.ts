import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Veritabanı sıfırlanıyor ve tohumlanıyor...');

  // 1. Abonelik Planları
  const plans = [
    {
      id: 'starter',
      name: 'Başlangıç',
      priceMonthly: 199,
      maxCategories: 5,
      maxProducts: 15,
      hasAI: false,
      hasWhatsAppOrder: false,
      hasNutrients: false,
      stripePriceId: 'price_starter_mock',
    },
    {
      id: 'pro',
      name: 'Pro',
      priceMonthly: 399,
      maxCategories: 15,
      maxProducts: 50,
      hasAI: true,
      hasWhatsAppOrder: true,
      hasNutrients: true,
      stripePriceId: 'price_pro_mock',
    },
    {
      id: 'premium',
      name: 'Premium',
      priceMonthly: 699,
      maxCategories: 999,
      maxProducts: 999,
      hasAI: true,
      hasWhatsAppOrder: true,
      hasNutrients: true,
      stripePriceId: 'price_premium_mock',
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { id: plan.id },
      update: plan,
      create: plan,
    });
  }
  console.log('Abonelik planları eklendi.');

  // 2. Ortak Görsel Galerisi (Unsplash Premium Seçkisi)
  const commonImages = [
    // Kahve
    { categoryKey: 'Kahve', title: 'Espresso', imageUrl: 'https://images.unsplash.com/photo-151097252790b-af4f902673a1?w=600&auto=format&fit=crop&q=80' },
    { categoryKey: 'Kahve', title: 'Latte Art', imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80' },
    { categoryKey: 'Kahve', title: 'Türk Kahvesi', imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80' },
    // Çay
    { categoryKey: 'Çay', title: 'Türk Çayı', imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80' },
    { categoryKey: 'Çay', title: 'Bitki Çayı', imageUrl: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=600&auto=format&fit=crop&q=80' },
    // Soğuk İçecekler
    { categoryKey: 'Soğuk İçecekler', title: 'Limonata', imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80' },
    { categoryKey: 'Soğuk İçecekler', title: 'Buzlu Kahve', imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80' },
    // Burger
    { categoryKey: 'Burger', title: 'Klasik Cheeseburger', imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80' },
    { categoryKey: 'Burger', title: 'Tavuk Burger', imageUrl: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=600&auto=format&fit=crop&q=80' },
    // Pizza
    { categoryKey: 'Pizza', title: 'Margarita Pizza', imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80' },
    { categoryKey: 'Pizza', title: 'Karışık Pizza', imageUrl: 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=600&auto=format&fit=crop&q=80' },
    // Tatlılar
    { categoryKey: 'Tatlılar', title: 'Çikolatalı Sufle', imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80' },
    { categoryKey: 'Tatlılar', title: 'Çilekli Waffle', imageUrl: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&auto=format&fit=crop&q=80' },
    { categoryKey: 'Tatlılar', title: 'San Sebastian Cheesecake', imageUrl: 'https://images.unsplash.com/photo-1524351199679-46cddf530c04?w=600&auto=format&fit=crop&q=80' },
    // Sandviçler
    { categoryKey: 'Sandviçler', title: 'Kulüp Sandviç', imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80' },
    { categoryKey: 'Sandviçler', title: 'Ayvalık Tostu', imageUrl: 'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=600&auto=format&fit=crop&q=80' },
    // Salatalar
    { categoryKey: 'Salatalar', title: 'Sezar Salata', imageUrl: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=600&auto=format&fit=crop&q=80' },
    { categoryKey: 'Salatalar', title: 'Kinoa Kasesi', imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80' },
    // Fast Food
    { categoryKey: 'Fast Food', title: 'Çıtır Patates Kızartması', imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80' },
    { categoryKey: 'Fast Food', title: 'Soğan Halkaları', imageUrl: 'https://images.unsplash.com/photo-1639024471283-2bc7b3c6a267?w=600&auto=format&fit=crop&q=80' },
    // Ana Yemekler
    { categoryKey: 'Ana Yemekler', title: 'Izgara Bonfile', imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80' },
    { categoryKey: 'Ana Yemekler', title: 'Izgara Somon', imageUrl: 'https://images.unsplash.com/photo-1485962398605-ef6a4555418f?w=600&auto=format&fit=crop&q=80' },
  ];

  await prisma.commonGalleryImage.deleteMany();
  for (const img of commonImages) {
    await prisma.commonGalleryImage.create({
      data: img,
    });
  }
  console.log('Ortak görsel galerisi hazırlandı.');

  // 3. Kullanıcılar & Rolleri
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const ownerPasswordHash = await bcrypt.hash('owner123', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@qrmenu.com' },
    update: {},
    create: {
      email: 'admin@qrmenu.com',
      name: 'Super Admin',
      passwordHash: adminPasswordHash,
      role: 'SUPER_ADMIN',
    },
  });

  const businessOwner = await prisma.user.upsert({
    where: { email: 'owner@bistrocaf.com' },
    update: {},
    create: {
      email: 'owner@bistrocaf.com',
      name: 'Burak Cafe Sahibi',
      passwordHash: ownerPasswordHash,
      role: 'BUSINESS_OWNER',
    },
  });

  console.log('Kullanıcılar oluşturuldu.');

  // 4. Örnek İşletme (Bistro Cafe)
  const business = await prisma.business.upsert({
    where: { slug: 'bistro-cafe' },
    update: {},
    create: {
      ownerId: businessOwner.id,
      name: 'Bistro Cafe & Restoran',
      slug: 'bistro-cafe',
      description: 'En taze kahveler ve el yapımı özel burgerlerin adresi.',
      phone: '+90 555 555 5555',
      address: 'Kadıköy, İstanbul',
      whatsappNumber: '905555555555',
      showCalories: true,
      themeId: 'modern-cafe',
      status: 'ACTIVE',
    },
  });

  // Örnek İşletmeye Pro Abonelik Atama
  await prisma.subscription.upsert({
    where: { businessId: business.id },
    update: {},
    create: {
      businessId: business.id,
      planId: 'pro',
      status: 'ACTIVE',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 gün
    },
  });

  console.log('Örnek işletme ve abonelik ayarlandı.');

  // 5. Kategoriler ve Ürünler
  const categoriesData = [
    {
      name: 'Kahveler',
      sortOrder: 1,
      products: [
        {
          name: 'Caffe Latte',
          price: 85,
          description: 'Çift shot espresso ve sıcak sütün kadife köpükle buluşması.',
          calories: 190,
          protein: 8.0,
          carbs: 15.0,
          fat: 6.0,
          isCommonImage: true,
          commonImageKey: 'Latte Art',
          imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80',
        },
        {
          name: 'Türk Kahvesi',
          price: 65,
          description: 'Geleneksel yöntemlerle cezvede demlenmiş orta kavruk kahve çekirdekleri.',
          calories: 15,
          protein: 0.2,
          carbs: 0.5,
          fat: 0.1,
          isCommonImage: true,
          commonImageKey: 'Türk Kahvesi',
          imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
        },
      ],
    },
    {
      name: 'Burgerler',
      sortOrder: 2,
      products: [
        {
          name: 'Bistro Smokehouse Burger',
          price: 295,
          description: '180 gr dana köfte, füme et, eritilmiş cheddar peyniri, karamelize soğan ve özel barbekü sos.',
          calories: 780,
          protein: 42.0,
          carbs: 65.0,
          fat: 38.0,
          isCommonImage: true,
          commonImageKey: 'Klasik Cheeseburger',
          imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
        },
      ],
    },
    {
      name: 'Tatlılar',
      sortOrder: 3,
      products: [
        {
          name: 'Çikolatalı Akışkan Sufle',
          price: 135,
          description: 'Belçika çikolatalı akışkan iç dolgusu ile vanilyalı dondurma eşliğinde servis edilir.',
          calories: 450,
          protein: 6.5,
          carbs: 58.0,
          fat: 22.0,
          isCommonImage: true,
          commonImageKey: 'Çikolatalı Sufle',
          imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80',
        },
      ],
    },
  ];

  for (const catData of categoriesData) {
    const cat = await prisma.category.create({
      data: {
        businessId: business.id,
        name: catData.name,
        sortOrder: catData.sortOrder,
      },
    });

    for (const prodData of catData.products) {
      await prisma.product.create({
        data: {
          categoryId: cat.id,
          name: prodData.name,
          price: prodData.price,
          description: prodData.description,
          calories: prodData.calories,
          protein: prodData.protein,
          carbs: prodData.carbs,
          fat: prodData.fat,
          isCommonImage: prodData.isCommonImage,
          commonImageKey: prodData.commonImageKey,
          imageUrl: prodData.imageUrl,
        },
      });
    }
  }

  // 6. Örnek İstatistikler (Son 7 Günlük Ziyaretçi Verisi)
  for (let i = 0; i < 7; i++) {
    const logDate = new Date();
    logDate.setDate(logDate.getDate() - i);
    logDate.setHours(0, 0, 0, 0);

    await prisma.visitorLog.upsert({
      where: {
        businessId_date: {
          businessId: business.id,
          date: logDate,
        },
      },
      update: {},
      create: {
        businessId: business.id,
        date: logDate,
        count: Math.floor(Math.random() * 80) + 20, // 20-100 arası ziyaretçi
      },
    });
  }

  console.log('Örnek kategoriler, ürünler ve ziyaretçi istatistikleri eklendi.');
  console.log('Tohumlama tamamlandı!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
