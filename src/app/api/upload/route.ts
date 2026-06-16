import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Dosya seçilmedi.' }, { status: 400 });
    }

    const originalName = file.name;
    const extension = path.extname(originalName).toLowerCase();
    
    // Allowed formats
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
    const imageMimeTypes = ['image/png', 'image/jpeg', 'image/webp'];
    
    const videoExtensions = ['.mp4', '.webm', '.mov'];
    const videoMimeTypes = ['video/mp4', 'video/webm', 'video/quicktime'];

    let fileType: 'image' | 'video' | null = null;

    if (imageExtensions.includes(extension) && imageMimeTypes.includes(file.type)) {
      fileType = 'image';
    } else if (videoExtensions.includes(extension) && videoMimeTypes.includes(file.type)) {
      fileType = 'video';
    }

    if (!fileType) {
      return NextResponse.json(
        { error: 'Desteklenmeyen dosya formatı. (Desteklenenler: PNG, JPG, WEBP, MP4, WEBM, MOV)' },
        { status: 400 }
      );
    }

    // Size limits: Images 2MB, Videos 50MB
    const maxImageSize = 2 * 1024 * 1024; // 2MB
    const maxVideoSize = 50 * 1024 * 1024; // 50MB

    if (fileType === 'image' && file.size > maxImageSize) {
      return NextResponse.json(
        { error: 'Görsel boyutu 2MB limitini aşamaz.' },
        { status: 400 }
      );
    }

    if (fileType === 'video' && file.size > maxVideoSize) {
      return NextResponse.json(
        { error: 'Video boyutu 50MB limitini aşamaz.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${extension}`;
    
    // Ensure public/uploads exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    
    try {
      await fs.chmod(uploadDir, 0o755);
    } catch (e) {
      // Ignore
    }

    // Write file
    const filePath = path.join(uploadDir, uniqueName);
    await fs.writeFile(filePath, buffer);

    try {
      await fs.chmod(filePath, 0o644);
    } catch (e) {
      // Ignore
    }

    // Verify file exists
    try {
      const stats = await fs.stat(filePath);
      if (!stats.isFile() || stats.size === 0) {
        throw new Error('Dosya doğrulanamadı.');
      }
    } catch (e) {
      console.error('File write verification failed:', e);
      return NextResponse.json({ error: 'Dosya kaydetme doğrulaması başarısız oldu.' }, { status: 500 });
    }

    const relativePath = `/uploads/${uniqueName}`;
    return NextResponse.json({ url: relativePath });
  } catch (err) {
    console.error('File upload error:', err);
    return NextResponse.json({ error: 'Dosya yükleme hatası oluştu.' }, { status: 500 });
  }
}
