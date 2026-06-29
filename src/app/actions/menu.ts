'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import {
  generateProductDescription,
  predictCaloriesAndMacros,
  suggestProductCategory,
  generateCampaignText,
  getAIConfig,
  callVisionAI,
  supportsVision
} from '@/lib/openai';
import fs from 'fs/promises';
import path from 'path';
import { getPlatformSettings } from '@/lib/settings';
import { cleanToRelativePath } from '@/lib/imageUtils';

const AI_DISABLED_MSG = 'Yapay zeka özelliği yönetici tarafından geçici olarak kapatılmıştır.';

// -------------------------------------------------------------
// SCHEMAS
// -------------------------------------------------------------
const categorySchema = z.object({
  name: z.string().min(2, 'Kategori adı en az 2 karakter olmalıdır.'),
  categoryImageUrl: z.string().optional().nullable(),
});

const productSchema = z.object({
  name: z.string().min(2, 'Ürün adı en az 2 karakter olmalıdır.'),
  price: z.number().min(0, 'Fiyat 0 veya daha yüksek olmalıdır.'),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  isCommonImage: z.boolean().default(false),
  commonImageKey: z.string().optional(),
  calories: z.number().nullable().optional(),
  protein: z.number().nullable().optional(),
  carbs: z.number().nullable().optional(),
  fat: z.number().nullable().optional(),
  ingredients: z.string().optional().nullable(),
  allergens: z.string().optional().nullable(),
  extraInfo: z.string().optional().nullable(),
  isCaloriesEstimated: z.boolean().default(false),
  nutritionInfo: z.string().optional().nullable(),
  nutritionDescription: z.string().optional().nullable(),
  nutrition: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

// Helper: Ensure user owns the business containing the resource
async function verifyBusinessOwnership(businessId: string) {
  const session = await auth();
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { businesses: true },
  });

  if (user?.role === 'SUPER_ADMIN') return user;

  const hasBusiness = user?.businesses.some((b) => b.id === businessId);
  return hasBusiness ? user : null;
}

// Helper: Check active subscription limit
async function verifySubscriptionLimits(businessId: string, type: 'categories' | 'products') {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { 
      subscription: { include: { plan: true } },
      categories: { include: { products: true } },
    },
  });

  if (!business) return false;

  const plan = business.subscription?.plan;
  if (!plan) return false; // No plan details

  if (type === 'categories') {
    return business.categories.length < plan.maxCategories;
  } else {
    let count = 0;
    business.categories.forEach(c => count += c.products.length);
    return count < plan.maxProducts;
  }
}

// -------------------------------------------------------------
// CATEGORY ACTIONS
// -------------------------------------------------------------
export async function createCategory(businessId: string, name: string, menuId?: string | null) {
  const owner = await verifyBusinessOwnership(businessId);
  if (!owner) return { success: false, error: 'Yetkisiz erişim.' };

  const isWithinLimit = await verifySubscriptionLimits(businessId, 'categories');
  if (!isWithinLimit) {
    return { success: false, error: 'Bu özellik için Pro pakete geçmelisiniz.' };
  }

  const validation = categorySchema.safeParse({ name });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  try {
    // Determine sort order
    const count = await prisma.category.count({ where: { businessId } });

    await prisma.category.create({
      data: {
        businessId,
        menuId: menuId || null,
        name,
        sortOrder: count,
      },
    });

    revalidatePath('/dashboard/menu');
    return { success: true, error: null };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Kategori oluşturulurken hata oluştu.' };
  }
}

export async function updateCategory(businessId: string, categoryId: string, name: string, categoryImageUrl?: string | null) {
  const owner = await verifyBusinessOwnership(businessId);
  if (!owner) return { success: false, error: 'Yetkisiz erişim.' };

  const validation = categorySchema.safeParse({ name, categoryImageUrl });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  try {
    await prisma.category.update({
      where: { id: categoryId, businessId },
      data: { name, categoryImageUrl: cleanToRelativePath(categoryImageUrl) ?? null },
    });

    revalidatePath('/dashboard/menu');
    return { success: true, error: null };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Kategori güncellenemedi.' };
  }
}

export async function deleteCategory(businessId: string, categoryId: string) {
  const owner = await verifyBusinessOwnership(businessId);
  if (!owner) return { success: false, error: 'Yetkisiz erişim.' };

  try {
    await prisma.category.delete({
      where: { id: categoryId, businessId },
    });

    revalidatePath('/dashboard/menu');
    return { success: true, error: null };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Kategori silinirken hata oluştu.' };
  }
}

export async function reorderCategories(businessId: string, categoryIds: string[]) {
  const owner = await verifyBusinessOwnership(businessId);
  if (!owner) return { success: false, error: 'Yetkisiz erişim.' };

  try {
    await prisma.$transaction(
      categoryIds.map((id, index) =>
        prisma.category.update({
          where: { id, businessId },
          data: { sortOrder: index },
        })
      )
    );

    revalidatePath('/dashboard/menu');
    return { success: true, error: null };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Sıralama güncellenemedi.' };
  }
}

// -------------------------------------------------------------
// PRODUCT ACTIONS
// -------------------------------------------------------------
export async function createProduct(businessId: string, categoryId: string, data: any) {
  const owner = await verifyBusinessOwnership(businessId);
  if (!owner) return { success: false, error: 'Yetkisiz erişim.' };

  const isWithinLimit = await verifySubscriptionLimits(businessId, 'products');
  if (!isWithinLimit) {
    return { success: false, error: 'Bu özellik için Pro pakete geçmelisiniz.' };
  }

  // Ensure category belongs to this business
  const category = await prisma.category.findFirst({
    where: { id: categoryId, businessId },
  });
  if (!category) return { success: false, error: 'Kategori bulunamadı.' };

  const validation = productSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  try {
    const count = await prisma.product.count({ where: { categoryId } });
    
    await prisma.product.create({
      data: {
        categoryId,
        name: data.name,
        price: data.price,
        description: data.description,
        imageUrl: cleanToRelativePath(data.imageUrl),
        isCommonImage: data.isCommonImage,
        commonImageKey: data.commonImageKey,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        ingredients: data.ingredients || null,
        allergens: data.allergens || null,
        extraInfo: data.extraInfo || null,
        isCaloriesEstimated: data.isCaloriesEstimated ?? false,
        nutritionInfo: data.nutritionInfo || null,
        nutritionDescription: data.nutritionDescription || null,
        nutrition: data.nutrition || null,
        isActive: data.isActive,
        sortOrder: count,
      },
    });

    revalidatePath('/dashboard/menu');
    return { success: true, error: null };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Ürün oluşturulurken hata oluştu.' };
  }
}

export async function updateProduct(businessId: string, categoryId: string, productId: string, data: any) {
  const owner = await verifyBusinessOwnership(businessId);
  if (!owner) return { success: false, error: 'Yetkisiz erişim.' };

  // Ensure category and product belong to this business
  const category = await prisma.category.findFirst({
    where: { id: categoryId, businessId },
  });
  if (!category) return { success: false, error: 'Yetkisiz kategori.' };

  const validation = productSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  try {
    await prisma.product.update({
      where: { id: productId, categoryId },
      data: {
        name: data.name,
        price: data.price,
        description: data.description,
        imageUrl: cleanToRelativePath(data.imageUrl),
        isCommonImage: data.isCommonImage,
        commonImageKey: data.commonImageKey,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        ingredients: data.ingredients || null,
        allergens: data.allergens || null,
        extraInfo: data.extraInfo || null,
        isCaloriesEstimated: data.isCaloriesEstimated ?? false,
        nutritionInfo: data.nutritionInfo || null,
        nutritionDescription: data.nutritionDescription || null,
        nutrition: data.nutrition || null,
        isActive: data.isActive,
      },
    });

    revalidatePath('/dashboard/menu');
    return { success: true, error: null };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Ürün güncellenirken hata oluştu.' };
  }
}

export async function deleteProduct(businessId: string, categoryId: string, productId: string) {
  const owner = await verifyBusinessOwnership(businessId);
  if (!owner) return { success: false, error: 'Yetkisiz erişim.' };

  // Ensure category belongs to this business
  const category = await prisma.category.findFirst({
    where: { id: categoryId, businessId },
  });
  if (!category) return { success: false, error: 'Yetkisiz kategori.' };

  try {
    await prisma.product.delete({
      where: { id: productId, categoryId },
    });

    revalidatePath('/dashboard/menu');
    return { success: true, error: null };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Ürün silinirken hata oldu.' };
  }
}

// -------------------------------------------------------------
// AI ACTIONS
// -------------------------------------------------------------
async function getSessionBusinessId(): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.email) return undefined;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { businesses: true },
  });
  return user?.businesses[0]?.id;
}

export async function getAIDescription(productName: string, categoryName: string) {
  const settings = await getPlatformSettings();
  if (!settings.aiEnabled) return { success: false, error: AI_DISABLED_MSG };
  const businessId = await getSessionBusinessId();
  try {
    const desc = await generateProductDescription(productName, categoryName, businessId);
    return { success: true, result: desc };
  } catch (error) {
    return { success: false, error: 'Yapay zeka açıklaması üretilemedi.' };
  }
}

export async function getAIMacros(productName: string, description: string) {
  const settings = await getPlatformSettings();
  if (!settings.aiEnabled) return { success: false, error: AI_DISABLED_MSG };
  const businessId = await getSessionBusinessId();
  try {
    const macros = await predictCaloriesAndMacros(productName, description, businessId);
    return { success: true, result: macros };
  } catch (error) {
    return { success: false, error: 'Makro değerleri hesaplanamadı.' };
  }
}

export async function getAICategory(productName: string) {
  const settings = await getPlatformSettings();
  if (!settings.aiEnabled) return { success: false, error: AI_DISABLED_MSG };
  const businessId = await getSessionBusinessId();
  try {
    const cat = await suggestProductCategory(productName, businessId);
    return { success: true, result: cat };
  } catch (error) {
    return { success: false, error: 'Kategori önerisi alınamadı.' };
  }
}

export async function getAICampaign(productName: string, discount: number) {
  const settings = await getPlatformSettings();
  if (!settings.aiEnabled) return { success: false, error: AI_DISABLED_MSG };
  const businessId = await getSessionBusinessId();
  try {
    const campaign = await generateCampaignText(productName, discount, businessId);
    return { success: true, result: campaign };
  } catch (error) {
    return { success: false, error: 'Kampanya metni oluşturulamadı.' };
  }
}

/**
 * Parses quick text content to add categories and products.
 */
export async function importTextMenuAction(businessId: string, text: string, menuId?: string | null) {
  const owner = await verifyBusinessOwnership(businessId);
  if (!owner) return { success: false, error: 'Yetkisiz erişim.' };

  if (!text.trim()) return { success: false, error: 'Lütfen menü metnini girin.' };

  try {
    const lines = text.split('\n');
    let currentCategoryName = '';
    
    const parsedData: { categoryName: string; products: { name: string; price: number; description: string }[] }[] = [];

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      if (line.startsWith('-')) {
        if (!currentCategoryName) {
          currentCategoryName = 'Genel';
        }

        const cleanLine = line.substring(1).trim();
        const parts = cleanLine.split('|').map(p => p.trim());
        const name = parts[0] || '';
        if (!name) continue;

        let price = 0;
        if (parts[1]) {
          const rawPrice = parts[1].replace(/[^\d.,]/g, '').replace(',', '.');
          price = parseFloat(rawPrice) || 0;
        }

        const description = parts[2] || '';

        let catGroup = parsedData.find(g => g.categoryName.toLowerCase() === currentCategoryName.toLowerCase());
        if (!catGroup) {
          catGroup = { categoryName: currentCategoryName, products: [] };
          parsedData.push(catGroup);
        }
        
        if (!catGroup.products.some(p => p.name.toLowerCase() === name.toLowerCase())) {
          catGroup.products.push({ name, price, description });
        }
      } else {
        currentCategoryName = line;
      }
    }

    for (const group of parsedData) {
      let category = await prisma.category.findFirst({
        where: {
          businessId,
          menuId: menuId || null,
          name: group.categoryName
        }
      });

      if (!category) {
        const count = await prisma.category.count({ where: { businessId } });
        category = await prisma.category.create({
          data: {
            businessId,
            menuId: menuId || null,
            name: group.categoryName,
            sortOrder: count,
          }
        });
      }

      for (const prod of group.products) {
        const existingProd = await prisma.product.findFirst({
          where: {
            categoryId: category.id,
            name: prod.name
          }
        });

        if (!existingProd) {
          const count = await prisma.product.count({ where: { categoryId: category.id } });
          await prisma.product.create({
            data: {
              categoryId: category.id,
              name: prod.name,
              price: prod.price,
              description: prod.description,
              isActive: true,
              sortOrder: count,
            }
          });
        }
      }
    }

    revalidatePath('/dashboard/menu');
    return { success: true };
  } catch (err: any) {
    console.error('importTextMenuAction error:', err);
    return { success: false, error: err.message || 'Metin işlenirken hata oluştu.' };
  }
}

/**
 * OCR / Vision based extraction from menu photos.
 */
export async function parseMenuFromPhotosAction(businessId: string, imageUrls: string[]) {
  const owner = await verifyBusinessOwnership(businessId);
  if (!owner) return { success: false, error: 'Yetkisiz erişim.' };

  if (!imageUrls || imageUrls.length === 0) {
    return { success: false, error: 'Lütfen en az bir menü fotoğrafı yükleyin.' };
  }

  try {
    const config = await getAIConfig(businessId);
    if (!config || !config.apiKey) {
      return { success: false, error: 'AI API anahtarı tanımlı değil.' };
    }

    if (!supportsVision(config.provider, config.model)) {
      return { success: false, error: 'Seçili AI modeli görsel okuma desteklemiyor.' };
    }

    const imagesData: { mimeType: string; base64: string }[] = [];
    let imageBuffer: Buffer | null = null;

    for (const imgUrl of imageUrls) {
      if (!imgUrl) continue;
      const localPath = path.join(process.cwd(), 'public', imgUrl);
      const buffer = await fs.readFile(localPath);
      if (!imageBuffer) {
        imageBuffer = buffer;
      }
      const base64 = buffer.toString('base64');
      
      let mimeType = 'image/jpeg';
      if (imgUrl.toLowerCase().endsWith('.png')) mimeType = 'image/png';
      else if (imgUrl.toLowerCase().endsWith('.webp')) mimeType = 'image/webp';

      imagesData.push({ mimeType, base64 });
    }

    const systemPrompt = `Bu bir restoran/kafe menü fotoğrafıdır. Görseldeki tüm kategori başlıklarını, ürün adlarını, fiyatları ve açıklamaları çıkar. Çok küçük yazıları da dikkatle oku. Sadece JSON döndür.

Format:
{
  "categories": [
    {
      "name": "Kategori Adı",
      "products": [
        {
          "name": "Ürün Adı",
          "price": "120",
          "description": "Açıklama veya boş string"
        }
      ]
    }
  ]
}

Kurallar:
- Fiyat varsa sadece sayı olarak yaz.
- TL, ₺ sembolünü kaldır.
- Okuyamadığın ürünü uydurma.
- Ürün adı net ama fiyat okunmuyorsa price boş string olsun.
- JSON dışında hiçbir şey döndürme.
- Markdown code block kullanma.`;

    const userPrompt = 'Lütfen bu menü fotoğraflarından kategorileri ve ürünleri çıkarıp belirtilen formatta ve kurallara uygun olarak döndür.';
    
    const images = imagesData;
    console.log("Images count:", images.length);
    if (imageBuffer) {
      console.log("Image size:", imageBuffer.length);
    }

    const { provider, model } = config;
    let responseText = '';
    let rawResponse: any = null;

    try {
      const result = await callVisionAI(systemPrompt, userPrompt, imagesData, config);
      responseText = result.text;
      rawResponse = result.rawResponse;
    } catch (aiCallErr: any) {
      console.error('OCR Vision call AI error:', aiCallErr);
      return { success: false, error: aiCallErr.message || 'Fotoğraflar işlenirken yapay zeka hatası oluştu.' };
    }

    console.log("OCR provider:", provider);
    console.log("OCR model:", model);
    console.log("OCR raw response:", JSON.stringify(rawResponse, null, 2));

    if (!responseText || !responseText.trim()) {
      console.error(`OCR Error: AI text content is empty. Provider: ${provider}, Model: ${model}`);
      return {
        success: false,
        error: 'AI yanıt verdi ancak metin içeriği boş geldi. Model veya provider ayarını kontrol edin.'
      };
    }

    let cleanJson = responseText.trim();
    // Clean response if AI wrapped it in markdown code blocks
    cleanJson = cleanJson
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/, '')
      .replace(/```$/, '')
      .trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error('OCR JSON Parse Error. Original text was:', responseText, parseErr);
      console.log("OCR Raw Text:", responseText);
      return { success: false, error: 'Menü okunamadı, lütfen daha net fotoğraf yükleyin.' };
    }

    if (!parsed || !Array.isArray(parsed.categories)) {
      console.error('OCR response does not match expected schema:', parsed);
      console.log("OCR Raw Text:", responseText);
      return { success: false, error: 'Menü okunamadı, lütfen daha net fotoğraf yükleyin.' };
    }

    // Merge duplicate categories/products and normalize prices to number | null
    const merged: { name: string; products: Map<string, any> }[] = [];

    for (const cat of parsed.categories) {
      if (!cat || !cat.name) continue;
      const catName = String(cat.name).trim();
      if (!catName) continue;

      let existingCat = merged.find((c) => c.name.toLowerCase() === catName.toLowerCase());
      if (!existingCat) {
        existingCat = { name: catName, products: new Map() };
        merged.push(existingCat);
      }

      const products = cat.products || [];
      for (const prod of products) {
        if (!prod || !prod.name) continue;
        const prodName = String(prod.name).trim();
        if (!prodName) continue;

        const prodNameLower = prodName.toLowerCase();
        const existingProd = existingCat.products.get(prodNameLower);

        let priceVal: number | null = null;
        if (prod.price !== undefined && prod.price !== null && prod.price !== '') {
          const cleanPrice = String(prod.price).replace(/[^\d.,]/g, '').replace(',', '.');
          priceVal = parseFloat(cleanPrice);
          if (isNaN(priceVal)) {
            priceVal = null;
          }
        }

        if (existingProd) {
          if (existingProd.price === null && priceVal !== null) {
            existingProd.price = priceVal;
          }
          if (!existingProd.description && prod.description) {
            existingProd.description = prod.description;
          }
        } else {
          existingCat.products.set(prodNameLower, {
            name: prodName,
            price: priceVal,
            description: prod.description || '',
          });
        }
      }
    }

    const mergedCategories = merged.map((c) => ({
      name: c.name,
      products: Array.from(c.products.values()),
    }));

    return { success: true, data: { categories: mergedCategories } };
  } catch (err: any) {
    console.error('parseMenuFromPhotosAction error:', err);
    return { success: false, error: err.message || 'Fotoğraflar işlenirken yapay zeka hatası oluştu.' };
  }
}

/**
 * Saves easy menu categories and products.
 */
export async function saveEasyMenuAction(
  businessId: string,
  categories: {
    name: string;
    products: {
      name: string;
      price: number | null;
      description: string;
    }[];
  }[],
  menuId?: string | null
) {
  const owner = await verifyBusinessOwnership(businessId);
  if (!owner) return { success: false, error: 'Yetkisiz erişim.' };

  try {
    for (const group of categories) {
      if (!group.name.trim()) continue;

      let category = await prisma.category.findFirst({
        where: {
          businessId,
          menuId: menuId || null,
          name: group.name.trim()
        }
      });

      if (!category) {
        const count = await prisma.category.count({ where: { businessId } });
        category = await prisma.category.create({
          data: {
            businessId,
            menuId: menuId || null,
            name: group.name.trim(),
            sortOrder: count,
          }
        });
      }

      for (const prod of group.products) {
        if (!prod.name.trim()) continue;

        const existingProd = await prisma.product.findFirst({
          where: {
            categoryId: category.id,
            name: prod.name.trim()
          }
        });

        if (!existingProd) {
          const count = await prisma.product.count({ where: { categoryId: category.id } });
          await prisma.product.create({
            data: {
              categoryId: category.id,
              name: prod.name.trim(),
              price: prod.price || 0,
              description: prod.description || '',
              isActive: true,
              sortOrder: count,
            }
          });
        }
      }
    }

    revalidatePath('/dashboard/menu');
    return { success: true };
  } catch (error: any) {
    console.error('saveEasyMenuAction error:', error);
    return { success: false, error: error.message || 'Kaydetme işlemi sırasında hata oluştu.' };
  }
}
