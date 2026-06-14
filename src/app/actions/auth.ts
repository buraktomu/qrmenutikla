'use server';

import { z } from 'zod';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

const registerSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalıdır.'),
  email: z.string().email('Geçerli bir e-posta adresi giriniz.'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır.'),
  businessName: z.string().min(2, 'İşletme adı en az 2 karakter olmalıdır.'),
  slug: z
    .string()
    .min(3, 'Menü bağlantısı en az 3 karakter olmalıdır.')
    .regex(/^[a-z0-9-]+$/, 'Bağlantı sadece küçük harf, sayı ve tire (-) içerebilir.'),
});

export async function registerUser(prevState: any, formData: FormData) {
  // Apply Rate Limiting
  const rateLimitCheck = await rateLimit('register', 5, 5 * 60 * 1000); // Max 5 registrations per IP every 5 minutes
  if (!rateLimitCheck.success) {
    return {
      success: false,
      error: 'Çok fazla deneme yaptınız. Lütfen birkaç dakika sonra tekrar deneyin.',
    };
  }

  // Parse fields safely
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const businessName = formData.get('businessName') as string;
  const slug = formData.get('slug') as string;

  const validation = registerSchema.safeParse({
    name,
    email,
    password,
    businessName,
    slug,
  });

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0].message,
    };
  }

  try {
    // Check if email already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return {
        success: false,
        error: 'Bu e-posta adresi zaten kullanımda.',
      };
    }

    // Check if slug already exists
    const existingBusiness = await prisma.business.findUnique({
      where: { slug: slug.toLowerCase() },
    });

    if (existingBusiness) {
      return {
        success: false,
        error: 'Bu menü bağlantısı (URL) başka bir işletme tarafından alınmış.',
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Run transaction to create User, Business and default starter Subscription
    await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase().trim(),
          passwordHash: hashedPassword,
          role: 'BUSINESS_OWNER',
        },
      });

      const newBusiness = await tx.business.create({
        data: {
          ownerId: newUser.id,
          name: businessName,
          slug: slug.toLowerCase().trim(),
          themeId: 'modern-cafe',
          status: 'ACTIVE',
        },
      });

      // Assign Starter package subscription as PENDING (awaiting admin approval)
      await tx.subscription.create({
        data: {
          businessId: newBusiness.id,
          planId: 'starter',
          status: 'PENDING',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 Günlük trial
        },
      });
    });

    return {
      success: true,
      error: null,
    };
  } catch (err) {
    console.error('Registration transaction error:', err);
    return {
      success: false,
      error: 'Sistem hatası. Kayıt işlemi tamamlanamadı.',
    };
  }
}
