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

    // 1. Validate file extension and MIME type
    const originalName = file.name;
    const extension = path.extname(originalName).toLowerCase();
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/webp'];

    if (!allowedExtensions.includes(extension) || !allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Sadece PNG, JPG ve WEBP formatları desteklenmektedir.' },
        { status: 400 }
      );
    }

    // 2. Limit size to maximum 2MB (2 * 1024 * 1024 bytes)
    const maxSizeBytes = 2 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        { error: 'Dosya boyutu 2MB limitini aşamaz.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${extension}`;
    
    // Ensure public/uploads exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    
    // Try setting permission mode of the directory to 0o755 (owner rwx, group rx, public rx)
    try {
      await fs.chmod(uploadDir, 0o755);
    } catch (e) {
      // Ignore if OS does not support or if permission is denied
    }

    // Write file
    const filePath = path.join(uploadDir, uniqueName);
    await fs.writeFile(filePath, buffer);

    // Set written file permission to 0o644 (owner rw, group r, public r)
    try {
      await fs.chmod(filePath, 0o644);
    } catch (e) {
      // Ignore
    }

    // 3. Verify file exists post-upload
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
