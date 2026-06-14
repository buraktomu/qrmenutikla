import { OpenAI } from 'openai';

// Initialize OpenAI client only if API key is provided
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Helper for simulating artificial network delay during mock execution
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generates a mouth-watering description for a product.
 */
export async function generateProductDescription(
  productName: string,
  category: string
): Promise<string> {
  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Sen profesyonel bir yemek gurmesi ve metin yazarısın. Verilen ürün adı ve kategorisine göre iştah açıcı, modern ve kısa (en fazla 2 cümle) bir menü ürün açıklaması yaz. Türkçe yaz.',
          },
          {
            role: 'user',
            content: `Ürün Adı: ${productName}, Kategori: ${category}`,
          },
        ],
        max_tokens: 150,
      });
      return response.choices[0]?.message?.content?.trim() || '';
    } catch (error) {
      console.error('OpenAI Error:', error);
    }
  }

  // Smart Mock Fallback
  await sleep(1000);
  const nameLower = productName.toLowerCase();
  
  if (nameLower.includes('kahve') || nameLower.includes('latte') || nameLower.includes('cappuccino') || nameLower.includes('espresso')) {
    return `Özenle seçilmiş nitelikli kahve çekirdeklerinin taze kavrulup demlenmesiyle elde edilen, yumuşak içimli ve yoğun aromalı güne başlama lezzeti.`;
  }
  if (nameLower.includes('burger') || nameLower.includes('köfte')) {
    return `El yapımı sulu köftesi, taze brioche ekmeği ve özel ev yapımı sosumuzla harmanlanmış gurme lezzet deneyimi.`;
  }
  if (nameLower.includes('tatlı') || nameLower.includes('sufle') || nameLower.includes('waffle') || nameLower.includes('pasta')) {
    return `Taze ve kaliteli malzemelerle hazırlanan, çikolatanın ve meyvelerin enfes uyumuyla tatlı krizlerinizi şölene dönüştürecek özel tarifimiz.`;
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
  location: string
): Promise<string> {
  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Sen bir SEO uzmanısın. Belirtilen restoran/kafe adı ve lokasyon için Google aramalarda öne çıkacak, çekici ve anahtar kelime odaklı bir meta açıklaması yaz (maksimum 160 karakter). Türkçe yaz.',
          },
          {
            role: 'user',
            content: `İşletme Adı: ${businessName}, Lokasyon: ${location}`,
          },
        ],
        max_tokens: 100,
      });
      return response.choices[0]?.message?.content?.trim() || '';
    } catch (error) {
      console.error('OpenAI Error:', error);
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
  description: string
): Promise<{ calories: number; protein: number; carbs: number; fat: number }> {
  const defaultReturn = { calories: 250, protein: 8, carbs: 30, fat: 10 };

  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'Sen bir diyetisyen ve beslenme uzmanısın. Verilen yiyecek/içecek adına ve açıklamasına dayanarak tahmini kalori, protein (gram), karbonhidrat (gram) ve yağ (gram) miktarlarını hesapla. Çıktıyı kesinlikle şu JSON formatında ver: {"calories": sayı, "protein": sayı, "carbs": sayı, "fat": sayı}',
          },
          {
            role: 'user',
            content: `Ürün Adı: ${productName}, Açıklama: ${description}`,
          },
        ],
        max_tokens: 150,
      });
      
      const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
      return {
        calories: Number(parsed.calories) || defaultReturn.calories,
        protein: Number(parsed.protein) || defaultReturn.protein,
        carbs: Number(parsed.carbs) || defaultReturn.carbs,
        fat: Number(parsed.fat) || defaultReturn.fat,
      };
    } catch (error) {
      console.error('OpenAI Error:', error);
    }
  }

  await sleep(1200);
  const nameLower = productName.toLowerCase();
  
  if (nameLower.includes('latte') || nameLower.includes('kahve')) {
    return { calories: 150, protein: 7, carbs: 12, fat: 5 };
  }
  if (nameLower.includes('burger')) {
    return { calories: 680, protein: 35, carbs: 55, fat: 28 };
  }
  if (nameLower.includes('sufle') || nameLower.includes('tatlı')) {
    return { calories: 420, protein: 6, carbs: 50, fat: 18 };
  }
  if (nameLower.includes('salata')) {
    return { calories: 280, protein: 12, carbs: 10, fat: 20 };
  }
  if (nameLower.includes('pizza')) {
    return { calories: 850, protein: 30, carbs: 95, fat: 24 };
  }

  return defaultReturn;
}

/**
 * Suggests the best fit menu category.
 */
export async function suggestProductCategory(productName: string): Promise<string> {
  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Sen restoran menü düzenleyicisisin. Ürün adına bakarak en uygun kategoriyi öner. Sadece kategori ismini tek kelime veya kelime öbeği olarak ver. Örn: "Sıcak Kahveler", "Burgerler", "Ara Sıcaklar".',
          },
          {
            role: 'user',
            content: `Ürün Adı: ${productName}`,
          },
        ],
        max_tokens: 50,
      });
      return response.choices[0]?.message?.content?.trim() || '';
    } catch (error) {
      console.error('OpenAI Error:', error);
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
  discountPercent: number
): Promise<string> {
  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Sen bir reklam metni yazarı ve pazarlama uzmanısın. Belirtilen ürün ve indirim oranı için sosyal medyada paylaşılabilecek, ilgi çekici, emojili ve harekete geçirici kısa bir kampanya metni yaz. Türkçe yaz.',
          },
          {
            role: 'user',
            content: `Ürün: ${productName}, İndirim Oranı: %${discountPercent}`,
          },
        ],
        max_tokens: 150,
      });
      return response.choices[0]?.message?.content?.trim() || '';
    } catch (error) {
      console.error('OpenAI Error:', error);
    }
  }

  await sleep(1000);
  return `🔥 Damak çatlatan lezzetimiz *${productName}* şimdi %${discountPercent} indirimle sizi bekliyor! 😋 Bu eşsiz fırsatı kaçırmamak için masanızdaki QR kodu okutun ve anında siparişinizi verin! 📲✨`;
}
