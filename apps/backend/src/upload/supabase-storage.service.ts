import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as fs from 'fs';

@Injectable()
export class SupabaseStorageService {
  private client: SupabaseClient;

  constructor(private config: ConfigService) {
    const url = this.config.get<string>('SUPABASE_URL');
    const key = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured',
      );
    }
    this.client = createClient(url, key);
  }

  private getExtension(mimetype: string): string {
    const map: Record<string, string> = {
      'application/pdf': 'pdf',
      'image/jpeg': 'jpg',
      'image/png': 'png',
    };
    return map[mimetype] || 'bin';
  }

  async uploadDocument(
    file: Express.Multer.File,
    companyId: string,
    type: string,
  ): Promise<{ fileUrl: string; fileName: string }> {
    const fileName = `${randomUUID()}.pdf`;
    const path = `documents/${companyId}/${type}/${fileName}`;

    const { error } = await this.client.storage
      .from('company-documents')
      .upload(path, file.buffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (error)
      throw new BadRequestException(`Erro ao fazer upload: ${error.message}`);

    const { data } = this.client.storage
      .from('company-documents')
      .getPublicUrl(path);
    return { fileUrl: data.publicUrl, fileName };
  }

  async uploadFile(
    file: Express.Multer.File,
  ): Promise<{ fileUrl: string; fileName: string }> {
    const extension = this.getExtension(file.mimetype);
    const fileName = `${randomUUID()}.${extension}`;
    const path = `uploads/${fileName}`;

    const { error } = await this.client.storage
      .from('patient-files')
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error)
      throw new BadRequestException(`Erro ao fazer upload: ${error.message}`);

    const { data } = this.client.storage
      .from('patient-files')
      .getPublicUrl(path);
    return { fileUrl: data.publicUrl, fileName };
  }

  async uploadAsoPdf(
    filePath: string,
    asoId: string,
  ): Promise<{ fileUrl: string; fileName: string }> {
    const fileName = `aso-${asoId}.pdf`;
    const path = `aso/${fileName}`;
    const fileBuffer = fs.readFileSync(filePath);

    const { error } = await this.client.storage
      .from('aso-documents')
      .upload(path, fileBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (error)
      throw new BadRequestException(`Erro ao fazer upload do ASO: ${error.message}`);

    const { data } = this.client.storage
      .from('aso-documents')
      .getPublicUrl(path);
    return { fileUrl: data.publicUrl, fileName };
  }

  async downloadFile(folder: string, fileName: string): Promise<Buffer> {
    const path = `${folder}/${fileName}`;
    const bucket = folder.startsWith('documents/')
      ? 'company-documents'
      : 'patient-files';

    const { data, error } = await this.client.storage
      .from(bucket)
      .download(path);

    if (error || !data)
      throw new NotFoundException('Arquivo não encontrado no storage');

    return Buffer.from(await data.arrayBuffer());
  }

  async downloadAsoFile(fileName: string): Promise<Buffer> {
    const path = `aso/${fileName}`;
    const { data, error } = await this.client.storage
      .from('aso-documents')
      .download(path);

    if (error || !data)
      throw new NotFoundException('ASO não encontrado no storage');

    return Buffer.from(await data.arrayBuffer());
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const url = new URL(fileUrl);
      const pathParts = url.pathname.split('/storage/v1/object/public/');
      if (pathParts.length < 2) return;

      const [bucket, ...pathSegments] = pathParts[1].split('/');
      const path = pathSegments.join('/');

      await this.client.storage.from(bucket).remove([path]);
    } catch {
      // Ignore deletion errors
    }
  }
}
