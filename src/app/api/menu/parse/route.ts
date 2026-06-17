import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAIConfig, callVisionAI, supportsVision } from '@/lib/openai';
import fs from 'fs/promises';
import path from 'path';

// Helper to merge and deduplicate categories and products
function mergeCategories(categories: any[]): any[] {
  const merged: { name: string; products: Map<string, any> }[] = [];

  for (const cat of categories) {
    if (!cat || !cat.name) continue;
    const catName = String(cat.name).trim();
    if (!catName) continue;

    // Find existing category (case-insensitive check)
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

  // Convert Map back to array
  return merged.map((c) => ({
    name: c.name,
    products: Array.from(c.products.values()),
  }));
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Yetkisiz erişim. Oturum açmalısınız.' });
    }

    const { businessId, imageUrls } = await req.json();

    if (!businessId) {
      return NextResponse.json({ success: false, error: 'İşletme kimliği eksik.' });
    }

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return NextResponse.json({ success: false, error: 'Lütfen en az bir menü fotoğrafı yükleyin.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { businesses: true },
    });

    const business = user?.businesses.find((b) => b.id === businessId);
    if (!business && user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Yetkisiz erişim. Bu işletmeyi düzenleyemezsiniz.' });
    }

    const config = await getAIConfig(businessId);
    if (!config || !config.apiKey) {
      return NextResponse.json({
        success: false,
        error: 'AI API anahtarı tanımlı değil.'
      });
    }

    if (!supportsVision(config.provider, config.model)) {
      return NextResponse.json({
        success: false,
        error: 'Seçili AI modeli görsel okuma desteklemiyor.'
      });
    }

    const imagesData: { mimeType: string; base64: string }[] = [];
    let imageBuffer: Buffer | null = null;

    for (const imgUrl of imageUrls) {
      if (!imgUrl) continue;
      try {
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
      } catch (fileErr) {
        console.error(`Error reading image file on disk: ${imgUrl}`, fileErr);
        return NextResponse.json({
          success: false,
          error: 'Menü fotoğrafları sunucuda okunamadı. Lütfen tekrar yüklemeyi deneyin.'
        });
      }
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
      return NextResponse.json({
        success: false,
        error: `Yapay zeka analiz hatası: ${aiCallErr.message || 'Sağlayıcı ile bağlantı kurulamadı.'}`
      });
    }

    console.log("OCR provider:", provider);
    console.log("OCR model:", model);
    console.log("OCR raw response:", JSON.stringify(rawResponse, null, 2));
    
    if (!responseText || !responseText.trim()) {
      console.error(`OCR Error: AI text content is empty. Provider: ${provider}, Model: ${model}`);
      return NextResponse.json({
        success: false,
        error: 'AI yanıt verdi ancak metin içeriği boş geldi. Model veya provider ayarını kontrol edin.'
      });
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
      return NextResponse.json({
        success: false,
        error: 'Menü okunamadı, lütfen daha net fotoğraf yükleyin.'
      });
    }

    if (!parsed || !Array.isArray(parsed.categories)) {
      console.error('OCR response does not match expected schema:', parsed);
      console.log("OCR Raw Text:", responseText);
      return NextResponse.json({
        success: false,
        error: 'Menü okunamadı, lütfen daha net fotoğraf yükleyin.'
      });
    }

    // Merge duplicate categories/products and normalize prices to number | null
    const mergedCategories = mergeCategories(parsed.categories);

    return NextResponse.json({
      success: true,
      categories: mergedCategories
    });
  } catch (err: any) {
    console.error('OCR route global error:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Beklenmedik bir sunucu hatası oluştu.'
    });
  }
}
