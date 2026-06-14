export type PlanFeature = {
  text: string;
  included: boolean;
};

export type PricingPlan = {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  popular?: boolean;
  features: PlanFeature[];
  limits: {
    maxCategories: number;
    maxProducts: number;
  };
};

export const PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Başlangıç',
    price: 199,
    period: 'Ay',
    description: 'Yeni açılan veya küçük ölçekli kafeler için ideal temel paket.',
    features: [
      { text: '1 Aktif QR Menü', included: true },
      { text: 'En Fazla 5 Kategori', included: true },
      { text: 'Kategori Başına 15 Ürün', included: true },
      { text: 'Modern Cafe & Minimal Temaları', included: true },
      { text: 'AI Menü Asistanı', included: false },
      { text: 'WhatsApp Sipariş Sistemi', included: false },
      { text: 'Kalori & Besin Bilgisi Gösterimi', included: false },
      { text: '7/24 Standart Destek', included: true },
    ],
    limits: {
      maxCategories: 5,
      maxProducts: 15,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 399,
    period: 'Ay',
    description: 'Büyümeyi hedefleyen ve dijitalleşmek isteyen popüler işletmeler.',
    popular: true,
    features: [
      { text: '3 Aktif QR Menü', included: true },
      { text: 'En Fazla 15 Kategori', included: true },
      { text: 'Kategori Başına 50 Ürün', included: true },
      { text: '7 Farklı Tema Desteği', included: true },
      { text: 'AI Menü Asistanı (Kısmi)', included: true },
      { text: 'WhatsApp Sipariş Sistemi', included: true },
      { text: 'Kalori & Besin Bilgisi Gösterimi', included: true },
      { text: 'Öncelikli Destek', included: true },
    ],
    limits: {
      maxCategories: 15,
      maxProducts: 50,
    },
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 699,
    period: 'Ay',
    description: 'Sınırsız güç ve AI özellikleriyle fark yaratmak isteyen restoranlar.',
    features: [
      { text: 'Sınırsız QR Menü', included: true },
      { text: 'Sınırsız Kategori', included: true },
      { text: 'Sınırsız Ürün', included: true },
      { text: '10 Profesyonel Temanın Tümü', included: true },
      { text: 'Tam AI Menü Asistanı (Tüm Özellikler)', included: true },
      { text: 'WhatsApp Sipariş Sistemi (Gelişmiş)', included: true },
      { text: 'Kalori & Besin Bilgisi Gösterimi', included: true },
      { text: '7/24 Birebir Müşteri Temsilcisi', included: true },
    ],
    limits: {
      maxCategories: 999,
      maxProducts: 999,
    },
  },
];
