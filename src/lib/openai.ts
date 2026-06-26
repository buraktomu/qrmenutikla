import { OpenAI } from 'openai';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/encryption';

export type AIConfig = {
  provider: 'openai' | 'gemini' | 'anthropic';
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Dynamically resolves the AI configuration for the platform or a specific merchant.
 */
export async function getAIConfig(businessId?: string): Promise<AIConfig | null> {
  try {
    const platform = await prisma.platformSetting.findUnique({
      where: { id: 'global' },
    });

    // Master Switch check
    if (platform && !platform.aiEnabled) {
      return null;
    }

    const aiModel = platform?.aiModel || 'gpt-4o-mini';
    const maxTokens = platform?.maxTokens || 500;
    const temperature = platform?.temperature ?? 0.7;

    let activeProvider: 'openai' | 'gemini' | 'anthropic' = 'openai';
    let resolvedKey: string | null = null;

    if (businessId) {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
      });
      if (business?.useOwnApiKey) {
        activeProvider = (business.customAiProvider as 'openai' | 'gemini' | 'anthropic') || 'openai';
        if (activeProvider === 'openai' && business.customOpenAiKey) {
          resolvedKey = decrypt(business.customOpenAiKey);
        } else if (activeProvider === 'gemini' && business.customGeminiKey) {
          resolvedKey = decrypt(business.customGeminiKey);
        } else if (activeProvider === 'anthropic' && business.customAnthropicKey) {
          resolvedKey = decrypt(business.customAnthropicKey);
        }
      }
    }

    if (!resolvedKey) {
      activeProvider = (platform?.aiProvider as 'openai' | 'gemini' | 'anthropic') || 'openai';
      if (activeProvider === 'openai' && platform?.openaiApiKey) {
        resolvedKey = decrypt(platform.openaiApiKey);
      } else if (activeProvider === 'gemini' && platform?.geminiApiKey) {
        resolvedKey = decrypt(platform.geminiApiKey);
      } else if (activeProvider === 'anthropic' && platform?.anthropicApiKey) {
        resolvedKey = decrypt(platform.anthropicApiKey);
      }
    }

    // Env Fallbacks
    if (!resolvedKey) {
      if (activeProvider === 'openai') {
        resolvedKey = process.env.OPENAI_API_KEY || null;
      } else if (activeProvider === 'gemini') {
        resolvedKey = process.env.GEMINI_API_KEY || null;
      } else if (activeProvider === 'anthropic') {
        resolvedKey = process.env.ANTHROPIC_API_KEY || null;
      }
    }

    if (!resolvedKey) {
      return null;
    }

    return {
      provider: activeProvider,
      apiKey: resolvedKey,
      model: aiModel,
      maxTokens,
      temperature,
    };
  } catch (error) {
    console.error('getAIConfig error:', error);
    return null;
  }
}

/**
 * Universal call method to target the selected AI provider.
 */
export async function callAI(
  systemPrompt: string,
  userPrompt: string,
  config: AIConfig,
  options?: { jsonMode?: boolean }
): Promise<string> {
  const { provider, apiKey, model, maxTokens, temperature } = config;

  if (provider === 'openai') {
    const openai = new OpenAI({ apiKey });
    const response = await openai.chat.completions.create({
      model: model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: maxTokens,
      temperature: temperature,
      ...(options?.jsonMode ? { response_format: { type: 'json_object' } } : {}),
    });
    return response.choices[0]?.message?.content?.trim() || '';
  }

  if (provider === 'gemini') {
    const geminiModel = model.startsWith('gemini') ? model : 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [
          {
            parts: [{ text: userPrompt }]
          }
        ],
        generationConfig: {
          temperature: temperature,
          maxOutputTokens: maxTokens,
          ...(options?.jsonMode ? { responseMimeType: 'application/json' } : {}),
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  }

  if (provider === 'anthropic') {
    const claudeModel = model.startsWith('claude') ? model : 'claude-3-5-sonnet-20241022';
    const url = 'https://api.anthropic.com/v1/messages';

    let finalSystemPrompt = systemPrompt;
    if (options?.jsonMode) {
      finalSystemPrompt += '\nKayıtları kesinlikle JSON formatında döndür. Markdown etiketleri (```json) kullanma, sadece ham JSON çıktısı ver.';
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: claudeModel,
        max_tokens: maxTokens,
        temperature: temperature,
        system: finalSystemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text?.trim() || '';
  }

  throw new Error('Unsupported AI provider');
}

/**
 * Connection tester function for admin and merchants settings.
 */
export async function testAiConnection(
  provider: 'openai' | 'gemini' | 'anthropic',
  apiKey: string,
  model: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    if (provider === 'openai') {
      const openai = new OpenAI({ apiKey });
      await openai.chat.completions.create({
        model: model || 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Ping' }],
        max_tokens: 5,
      });
    } else if (provider === 'gemini') {
      const geminiModel = model.startsWith('gemini') ? model : 'gemini-2.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Ping' }] }],
          generationConfig: { maxOutputTokens: 5 }
        })
      });
      if (!response.ok) {
        const errText = await response.text();
        return { success: false, error: `Gemini Hata: ${response.status} - ${errText}` };
      }
    } else if (provider === 'anthropic') {
      const claudeModel = model.startsWith('claude') ? model : 'claude-3-5-sonnet-20241022';
      const url = 'https://api.anthropic.com/v1/messages';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: claudeModel,
          max_tokens: 5,
          messages: [{ role: 'user', content: 'Ping' }]
        })
      });
      if (!response.ok) {
        const errText = await response.text();
        return { success: false, error: `Anthropic Hata: ${response.status} - ${errText}` };
      }
    } else {
      return { success: false, error: 'Bilinmeyen sağlayıcı.' };
    }
    return { success: true, error: null };
  } catch (err: any) {
    console.error('testAiConnection error:', err);
    return { success: false, error: err.message || 'Bağlantı testi sırasında bir hata oluştu.' };
  }
}

/**
 * Generates a mouth-watering description for a product.
 */
export async function generateProductDescription(
  productName: string,
  category: string,
  businessId?: string
): Promise<string> {
  const config = await getAIConfig(businessId);
  if (config) {
    try {
      const systemPrompt = 'Sen profesyonel bir yemek gurmesi ve metin yazarısın. Verilen ürün adı ve kategorisine göre iştah açıcı, modern ve kısa (en fazla 2 cümle) bir menü ürün açıklaması yaz. Türkçe yaz.';
      const userPrompt = `Ürün Adı: ${productName}, Kategori: ${category}`;
      return await callAI(systemPrompt, userPrompt, config);
    } catch (error) {
      console.error('generateProductDescription AI call error:', error);
    }
  }

  // Fallback
  await sleep(1000);
  const nameLower = productName.toLowerCase();
  
  if (nameLower.includes('kahve') || nameLower.includes('latte') || nameLower.includes('cappuccino') || nameLower.includes('espresso')) {
    return `Özenle seçilmiş nitelikli kahve çekirdeklerinin taze kavrulup demlenmesiyle elde edilen, yumuşak içimli ve yoğun aromalı güne başlama lezzeti.`;
  }
  if (nameLower.includes('burger') || nameLower.includes('köfte')) {
    return `El yapımı sulu köftesi, taze brioche ekmeği ve özel ev yapımı sosumuzla harmanlanmış gurme lezzet deneyimi.`;
  }
  if (nameLower.includes('tatlı') || nameLower.includes('sufle') || nameLower.includes('waffle') || nameLower.includes('pasta')) {
    return `Taze ve kaliteli malzemelerle hazırlanan, çikolatanın ve meyvelerin enfes uyumuyla tatlı krizlerinizi şölene dönizzerken özel tarifimiz.`;
  }
  if (nameLower.includes('salata') || nameLower.includes('sezar')) {
    return `Bahçemizden taze toplanmış çıtır yeşillikler, mevsim sebzeleri ve şefimizin özel zeytinyağlı sosuyla hazırlanan hafif ve besleyici bir alternatif.`;
  }
  if (nameLower.includes('pizza') || nameLower.includes('makarna')) {
    return `İtalyan esintili incecik el açması çıtır hamuru ve zengin bol malzemeleriyle fırından yeni çıkmış sıcak bir İtalyan klasiği.`;
  }

  return `Şeflerimizin özel tarifiyle taze malzemeler kullanılarak hazırlanan, damak hafızanızda yer edinecek eşsiz bir lezzet deneyimi.`;
}

/**
 * Generates an SEO friendly business description.
 */
export async function generateSeoDescription(
  businessName: string,
  location: string,
  businessId?: string
): Promise<string> {
  const config = await getAIConfig(businessId);
  if (config) {
    try {
      const systemPrompt = 'Sen bir SEO uzmanısın. Belirtilen restoran/kafe adı ve lokasyon için Google aramalarda öne çıkacak, çekici ve anahtar kelime odaklı bir meta açıklaması yaz (maksimum 160 karakter). Türkçe yaz.';
      const userPrompt = `İşletme Adı: ${businessName}, Lokasyon: ${location}`;
      return await callAI(systemPrompt, userPrompt, config);
    } catch (error) {
      console.error('generateSeoDescription AI call error:', error);
    }
  }

  await sleep(1000);
  return `${location} bölgesinin en gözde mekanı olan ${businessName}, enfes lezzetleri, samimi atmosferi ve modern konseptiyle sizleri bekliyor. Hemen QR menümüzü inceleyin!`;
}

/**
 * Predicts calories and macronutrients for a food/beverage item.
 */
export async function predictCaloriesAndMacros(
  productName: string,
  description: string,
  businessId?: string
): Promise<{ 
  calories: number; 
  protein: number; 
  carbs: number; 
  fat: number;
  ingredients: string;
  allergens: string;
  extraInfo: string;
  isCaloriesEstimated: boolean;
}> {
  const defaultReturn = { 
    calories: 250, 
    protein: 8, 
    carbs: 30, 
    fat: 10,
    ingredients: '',
    allergens: 'İşletmeden teyit edilmelidir',
    extraInfo: '',
    isCaloriesEstimated: true
  };

  const config = await getAIConfig(businessId);
  if (config) {
    try {
      const systemPrompt = `Sen bir diyetisyen, beslenme uzmanı ve gıda güvenliği uzmanısın.
Verilen yiyecek/içecek adına ve açıklamasına dayanarak tahmini kalori, protein (gram), karbonhidrat (gram), yağ (gram), içerik/bileşen bilgisi, alerjen bilgisi ve diğer bilgileri (örneğin glutensiz, vegan vb.) hesapla.

Aşağıdaki kurallara SIKICA UY:
1. Kalori tahmini ise isCaloriesEstimated alanını true yap.
2. İçerik/bileşen bilgisi (ingredients) yalnızca ürün adından/açıklamasından kesin anlaşılıyorsa yazılsın. Emin değilsen boş bırak veya sadece kesin olan gıdaları yaz.
3. Alerjenlerde (allergens) emin değilsen kesinlikle "İşletmeden teyit edilmelidir" notunu ekle.
4. Domuz/alkol bilgisi asla tahminle yazılmasın. "Domuz içermez" veya "alkol içermez" gibi kesin ifadeleri eğer ürünün açıklamasında yazmıyorsa asla uydurarak yazma. Emin değilsen boş bırak veya "Bilgi girilmedi" yaz.
5. Çıktıyı kesinlikle şu JSON formatında ver:
{
  "calories": sayı,
  "protein": sayı,
  "carbs": sayı,
  "fat": sayı,
  "ingredients": "içerik listesi veya boş string",
  "allergens": "alerjen bilgisi veya boş string",
  "extraInfo": "diğer bilgiler veya boş string",
  "isCaloriesEstimated": true/false
}`;
      const userPrompt = `Ürün Adı: ${productName}, Açıklama: ${description}`;
      const responseText = await callAI(systemPrompt, userPrompt, config, { jsonMode: true });
      
      const parsed = JSON.parse(responseText || '{}');
      return {
        calories: Number(parsed.calories) || defaultReturn.calories,
        protein: Number(parsed.protein) || defaultReturn.protein,
        carbs: Number(parsed.carbs) || defaultReturn.carbs,
        fat: Number(parsed.fat) || defaultReturn.fat,
        ingredients: parsed.ingredients || defaultReturn.ingredients,
        allergens: parsed.allergens || defaultReturn.allergens,
        extraInfo: parsed.extraInfo || defaultReturn.extraInfo,
        isCaloriesEstimated: parsed.isCaloriesEstimated !== undefined ? Boolean(parsed.isCaloriesEstimated) : defaultReturn.isCaloriesEstimated,
      };
    } catch (error) {
      console.error('predictCaloriesAndMacros AI call error:', error);
    }
  }

  await sleep(1200);
  const nameLower = productName.toLowerCase();
  
  if (nameLower.includes('latte') || nameLower.includes('kahve')) {
    return { ...defaultReturn, calories: 150, protein: 7, carbs: 12, fat: 5, ingredients: 'Espresso, Süt', allergens: 'Süt (Laktoz)' };
  }
  if (nameLower.includes('burger')) {
    return { ...defaultReturn, calories: 680, protein: 35, carbs: 55, fat: 28, ingredients: 'Dana köftesi, Burger ekmeği, Cheddar peyniri, Marul, Domates', allergens: 'Gluten, Süt (Laktoz)' };
  }
  if (nameLower.includes('sufle') || nameLower.includes('tatlı')) {
    return { ...defaultReturn, calories: 420, protein: 6, carbs: 50, fat: 18, ingredients: 'Çikolata, Un, Şeker, Yumurta, Tereyağı', allergens: 'Gluten, Yumurta, Süt (Laktoz)' };
  }
  if (nameLower.includes('salata')) {
    return { ...defaultReturn, calories: 280, protein: 12, carbs: 10, fat: 20, ingredients: 'Mevsim yeşillikleri, Zeytinyağı, Limon sosu', allergens: 'İşletmeden teyit edilmelidir' };
  }
  if (nameLower.includes('pizza')) {
    return { ...defaultReturn, calories: 850, protein: 30, carbs: 95, fat: 24, ingredients: 'Pizza hamuru, Mozzarella peyniri, Domates sosu', allergens: 'Gluten, Süt (Laktoz)' };
  }

  return defaultReturn;
}

/**
 * Suggests the best fit menu category.
 */
export async function suggestProductCategory(productName: string, businessId?: string): Promise<string> {
  const config = await getAIConfig(businessId);
  if (config) {
    try {
      const systemPrompt = 'Sen restoran menü düzenleyicisisin. Ürün adına bakarak en uygun kategoriyi öner. Sadece kategori ismini tek kelime veya kelime öbeği olarak ver. Örn: "Sıcak Kahveler", "Burgerler", "Ara Sıcaklar".';
      const userPrompt = `Ürün Adı: ${productName}`;
      return await callAI(systemPrompt, userPrompt, config);
    } catch (error) {
      console.error('suggestProductCategory AI call error:', error);
    }
  }

  await sleep(600);
  const nameLower = productName.toLowerCase();
  
  if (nameLower.includes('çay') || nameLower.includes('tea')) return 'Çaylar';
  if (nameLower.includes('latte') || nameLower.includes('kahve') || nameLower.includes('coffee') || nameLower.includes('espresso')) return 'Kahveler';
  if (nameLower.includes('kola') || nameLower.includes('fanta') || nameLower.includes('limonata') || nameLower.includes('meyve')) return 'Soğuk İçecekler';
  if (nameLower.includes('burger')) return 'Burgerler';
  if (nameLower.includes('pizza')) return 'Pizzalar';
  if (nameLower.includes('waffle') || nameLower.includes('sufle') || nameLower.includes('pasta') || nameLower.includes('kek')) return 'Tatlılar';
  if (nameLower.includes('tost') || nameLower.includes('sandviç')) return 'Sandviçler';
  if (nameLower.includes('sezar') || nameLower.includes('salata')) return 'Salatalar';
  
  return 'Ana Yemekler';
}

/**
 * Generates an interesting promo text.
 */
export async function generateCampaignText(
  productName: string,
  discountPercent: number,
  businessId?: string
): Promise<string> {
  const config = await getAIConfig(businessId);
  if (config) {
    try {
      const systemPrompt = 'Sen bir reklam metni yazarı ve pazarlama uzmanısın. Belirtilen ürün ve indirim oranı için sosyal medyada paylaşılabilecek, ilgi çekici, emojili ve harekete geçirici kısa bir kampanya metni yaz. Türkçe yaz.';
      const userPrompt = `Ürün: ${productName}, İndirim Oranı: %${discountPercent}`;
      return await callAI(systemPrompt, userPrompt, config);
    } catch (error) {
      console.error('generateCampaignText AI call error:', error);
    }
  }

  await sleep(1000);
  return `🔥 Damak çatlatan lezzetimiz *${productName}* şimdi %${discountPercent} indirimle sizi bekliyor! 😋 Bu eşsiz fırsatı kaçırmamak için masanızdaki QR kodu okutun ve anında siparişinizi verin! 📲✨`;
}

/**
 * Helper to check if the selected model supports vision capabilities.
 */
export function supportsVision(provider: string, model: string): boolean {
  if (!model) return false;
  const m = model.toLowerCase();
  if (provider === 'openai') {
    return m.includes('gpt-4o') || m.includes('gpt-4.1-mini') || m.includes('gpt-4o-mini');
  }
  if (provider === 'gemini') {
    return m.includes('gemini-1.5-pro') || m.includes('gemini-1.5-flash') || m.includes('gemini-2.5-flash') || m.includes('gemini-2.5-pro');
  }
  if (provider === 'anthropic') {
    return m.includes('claude-3-5-sonnet') || m.includes('claude-3.5-sonnet');
  }
  return false;
}

/**
 * Executes a vision API request against the selected AI provider.
 */
export async function callVisionAI(
  systemPrompt: string,
  userPrompt: string,
  images: { mimeType: string; base64: string }[],
  config: AIConfig
): Promise<{ text: string; rawResponse: any }> {
  const { provider, apiKey, model, maxTokens, temperature } = config;

  if (provider === 'openai') {
    const openai = new OpenAI({ apiKey });
    const contentParts: any[] = [{ type: 'text', text: userPrompt }];
    images.forEach((img) => {
      contentParts.push({
        type: 'image_url',
        image_url: {
          url: `data:${img.mimeType};base64,${img.base64}`,
          detail: 'high'
        }
      });
    });

    const response = await openai.chat.completions.create({
      model: model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: contentParts }
      ],
      max_tokens: maxTokens,
      temperature: temperature,
      response_format: { type: 'json_object' },
    });

    const text = response.choices?.[0]?.message?.content || '';
    return { text, rawResponse: response };
  }

  if (provider === 'gemini') {
    const geminiModel = model.startsWith('gemini') ? model : 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;

    const parts: any[] = [{ text: userPrompt }];
    images.forEach((img) => {
      parts.push({
        inlineData: {
          mimeType: img.mimeType,
          data: img.base64
        }
      });
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [
          {
            parts: parts
          }
        ],
        generationConfig: {
          temperature: temperature,
          maxOutputTokens: maxTokens,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini Vision API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") || '';
    return { text, rawResponse: data };
  }

  if (provider === 'anthropic') {
    const claudeModel = model.startsWith('claude') ? model : 'claude-3-5-sonnet-20241022';
    const url = 'https://api.anthropic.com/v1/messages';

    const contentParts: any[] = [{ type: 'text', text: userPrompt }];
    images.forEach((img) => {
      contentParts.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: img.mimeType,
          data: img.base64
        }
      });
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: claudeModel,
        max_tokens: maxTokens,
        temperature: temperature,
        system: systemPrompt + '\nKayıtları kesinlikle JSON formatında döndür. Markdown etiketleri (```json) kullanma, sadece ham JSON çıktısı ver.',
        messages: [
          { role: 'user', content: contentParts }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic Vision API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const text = data.content?.map((block: any) => block.text).join("") || '';
    return { text, rawResponse: data };
  }

  throw new Error('Unsupported AI provider');
}
