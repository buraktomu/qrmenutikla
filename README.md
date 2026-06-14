# AI Destekli QR Menü Platformu (SaaS)

Bu proje; restoranlar, kafeler ve benzeri yiyecek-içecek işletmelerinin aylık abonelik modeliyle kendilerine ait dinamik ve akıllı QR menülerini kiralayıp yönetebilecekleri ticari kullanıma hazır, modern bir SaaS platformudur.

---

## 🛠️ Kullanılan Teknolojiler

*   **Framework:** Next.js 15 (App Router, React 19)
*   **Programlama Dili:** TypeScript
*   **Stil Kütüphanesi:** Tailwind CSS v4 (Yüksek performanslı CSS-in-JS altyapısı)
*   **Veritabanı ve ORM:** PostgreSQL (Ana hedef) / SQLite (Yerel geliştirme fallback), Prisma ORM
*   **Kimlik Doğrulama:** Auth.js v5 (NextAuth.js) - Güvenli Credentials provider ve bcrypt hashing
*   **Animasyonlar:** GSAP (GreenSock) & ScrollTrigger (SaaS landing page morphing animasyonu)
*   **Ödemeler:** Stripe API (Webhook desteği ve yerel ödeme simülasyonu ile birlikte)
*   **Yapay Zeka:** OpenAI API (GPT-4o-mini entegrasyonu ve akıllı Türkçe mock şablonları)
*   **Doğrulama:** Zod (Güvenli input validation)

---

## 🔑 Ortam Değişkenleri (.env)

Projenin çalışabilmesi için kök dizinde bir `.env` dosyası oluşturulmalı ve aşağıdaki değişkenler tanımlanmalıdır:

```env
# Veritabanı Bağlantısı (PostgreSQL)
# Geliştirme aşamasında SQLite kullanmak için: DATABASE_URL="file:./dev.db"
DATABASE_URL="postgresql://kullanici:sifre@localhost:5432/qrmenu_db?schema=public"

# NextAuth Yetkilendirme Ayarları
NEXTAUTH_SECRET="en_az_32_karakterli_rastgele_guvenli_anahtar"
NEXTAUTH_URL="http://localhost:3000"

# OpenAI API Anahtarı (Boş bırakılırsa yapay zeka özellikleri simülasyon modunda çalışır)
OPENAI_API_KEY="sk-proj-..."

# Stripe Entegrasyon Ayarları (Boş bırakılırsa ödeme simülatörü çalışır)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_STARTER="price_..."
STRIPE_PRICE_PRO="price_..."
STRIPE_PRICE_PREMIUM="price_..."
```

---

## 🚀 Yerel Kurulum ve Geliştirme

Projeyi bilgisayarınızda yerel olarak ayağa kaldırmak için aşağıdaki adımları sırasıyla uygulayın:

### 1. Bağımlılıkları Yükleyin
```bash
npm install --legacy-peer-deps
```
*(Next.js 16/15 sürümü ve bazı beta paketlerin uyumluluğu için `--legacy-peer-deps` kullanılması önerilir.)*

### 2. Veritabanı Şemasını Eşitleyin
Prisma şemasını veritabanına uygulayın:
```bash
npx prisma generate
npx prisma db push
```

### 3. Örnek/Demo Verileri Tohumlayın
Sistem planlarını, ortak görsel kütüphanesini ve test kullanıcısını oluşturun:
```bash
npx tsx prisma/seed.ts
```

### 4. Geliştirme Sunucusunu Başlatın
```bash
npm run dev
```
Uygulamaya tarayıcınızdan erişin: [http://localhost:3000](http://localhost:3000)

---

## 👤 Test Giriş Bilgileri (Demo Veriler)

Veritabanı tohumlandığında aşağıdaki hesaplar otomatik olarak oluşturulur:

### 1. İşletme Sahibi Hesabı (Bistro Cafe)
*   **E-Posta:** `owner@bistrocaf.com`
*   **Şifre:** `owner123`
*   **Erişim:** `/dashboard` panelinden kategorilerini, ürünlerini ve AI asistanını yönetebilir.
*   **Canlı QR Menü Bağlantısı:** `http://localhost:3000/menu/bistro-cafe`

### 2. Süper Admin Hesabı
*   **E-Posta:** `admin@qrmenu.com`
*   **Şifre:** `admin123`
*   **Erişim:** `/admin` panelinden tüm işletmeleri, MRR gelir istatistiklerini ve ortak resim kütüphanesini yönetebilir.

---

## 📦 Production Deployment ve Canlıya Alma

Platformu production ortamına taşırken aşağıdaki hususlara dikkat edilmelidir:

### 1. Veritabanı Değişimi (PostgreSQL)
Production ortamında PostgreSQL kullanmak için `prisma/schema.prisma` dosyasındaki provider ayarını `postgresql` olarak güncelleyin ve `.env` dosyasındaki `DATABASE_URL` değişkenine canlı PostgreSQL bağlantı satırını yazın.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2. Build ve Derleme Testi
Uygulamayı derleyin:
```bash
npm run build
```

### 3. Vercel ile Deployment (Önerilen)
1. Projenizi GitHub'a yükleyin.
2. Vercel dashboard üzerinden projeyi Next.js şablonuyla bağlayın.
3. Environment Variables (Ortam Değişkenleri) alanına `.env` dosyasındaki değişkenleri girin (özellikle `NEXTAUTH_SECRET` ve `NEXTAUTH_URL` canlı sunucu adresi olacak şekilde güncellenmelidir).
4. `Install Command` alanını `npm install --legacy-peer-deps` olarak yapılandırın.
5. Vercel deployment sırasında Prisma client'ın kurulması için `Build Command` alanına şunu ekleyin:
   ```bash
   npx prisma generate && next build
   ```

### 4. Linux VPS / PM2 ile Deployment
Eğer kendinize ait bir sanal sunucu (VPS) kullanıyorsanız:
1. Projeyi sunucuda klonlayın ve bağımlılıkları yükleyin.
2. `.env` dosyasını oluşturun.
3. Projeyi derleyin ve PM2 yardımıyla arka planda çalıştırın:
   ```bash
   npx prisma generate
   npx prisma db push
   npm run build
   pm2 start npm --name "qr-menu-saas" -- start
   ```
4. VPS önünde **Nginx** ters proxy yapılandırması kurarak port yönlendirmesi ve SSL sertifikası (Let's Encrypt) işlemlerini tamamlayın.
