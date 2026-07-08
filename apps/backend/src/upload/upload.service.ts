import { Injectable, NotFoundException } from '@nestjs/common';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../prisma.service';

@Injectable()
export class UploadService {
  constructor(private readonly prisma: PrismaService) {}

  async saveDocument(file: Express.Multer.File, companyId: string, type: string, validUntil: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    const uploadDir = join(process.cwd(), 'uploads', 'documents');
    await mkdir(uploadDir, { recursive: true });

    const ext = file.originalname.split('.').pop();
    const fileName = `${companyId}_${type}_${Date.now()}.${ext}`;
    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, file.buffer);

    const fileUrl = `/uploads/documents/${fileName}`;

    const doc = await this.prisma.companyDocument.create({
      data: {
        companyId,
        type,
        fileUrl,
        originalName: file.originalname,
        validUntil: validUntil ? new Date(validUntil) : null,
      },
    });

    const updateData: Record<string, any> = {};
    if (type === 'PCMSO') {
      updateData.pcmsoDocumentUrl = fileUrl;
      updateData.pcmsoValidUntil = new Date(validUntil);
    }
    if (type === 'PPRA') {
      updateData.ppraDocumentUrl = fileUrl;
      updateData.ppraValidUntil = new Date(validUntil);
    }
    // Ao enviar documento, colocar empresa em EM_ANALISE se estava CADASTRO_INCOMPLETO
    // A aprovação final para LIBERADA deve ser feita manualmente pelo admin
    if (Object.keys(updateData).length > 0) {
      const current = await this.prisma.company.findUnique({ where: { id: companyId }, select: { status: true } });
      if (current?.status === 'CADASTRO_INCOMPLETO') {
        updateData.status = 'EM_ANALISE';
      }
      await this.prisma.company.update({
        where: { id: companyId },
        data: updateData,
      });
    }

    return doc;
  }

  async uploadFile(file: Express.Multer.File) {
    const uploadDir = join(process.cwd(), 'uploads', 'files');
    await mkdir(uploadDir, { recursive: true });

    const ext = file.originalname.split('.').pop();
    const fileName = `file_${Date.now()}.${ext}`;
    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, file.buffer);

    return { fileUrl: `/uploads/files/${fileName}` };
  }

  async listDocuments(companyId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    return this.prisma.companyDocument.findMany({
      where: { companyId },
      orderBy: { uploadedAt: 'desc' },
    });
  }
}
