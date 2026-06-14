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

    const buffer = Buffer.from(await file.arrayBuffer());
    const originalName = file.name;
    const extension = path.extname(originalName);
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${extension}`;
    
    // Ensure public/uploads exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    // Write file
    const filePath = path.join(uploadDir, uniqueName);
    await fs.writeFile(filePath, buffer);

    const relativePath = `/uploads/${uniqueName}`;
    return NextResponse.json({ url: relativePath });
  } catch (err) {
    console.error('File upload error:', err);
    return NextResponse.json({ error: 'Dosya yükleme hatası oluştu.' }, { status: 500 });
  }
}
