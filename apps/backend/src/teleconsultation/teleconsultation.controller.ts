import { BadRequestException, Body, ConflictException, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../prisma.service';
import { QueueGateway } from '../queue/queue.gateway';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/teleconsultation')
@Roles('DOCTOR')
export class TeleconsultationController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueGateway: QueueGateway,
  ) {}

  @Post('create-room')
  async createRoom(@Req() req: Request, @Body() body: { examRequestId: string; doctorId?: string }) {
    const user = (req as any).user as { role?: string; profileId?: string | null } | undefined;
    const doctorId = user?.role === 'DOCTOR' && user.profileId ? user.profileId : null;

    if (!body.examRequestId || !doctorId) {
      throw new BadRequestException('Nao foi possivel identificar o medico autenticado.');
    }

    const doctor = await this.prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) {
      throw new BadRequestException('Medico nao encontrado. Verifique se o perfil medico esta correto.');
    }

    const examRequest = await this.prisma.examRequest.findUnique({
      where: { id: body.examRequestId },
      include: { invite: true },
    });
    if (!examRequest) throw new BadRequestException('Solicitacao de exame nao encontrada.');

    if (!['AGUARDANDO_COLETA', 'EM_ATENDIMENTO_MEDICO'].includes(examRequest.status)) {
      await this.prisma.examTimelineEvent.create({
        data: {
          inviteId: examRequest.inviteId ?? null,
          examRequestId: body.examRequestId,
          eventType: 'TELECONSULTA_BLOQUEADA',
          metadata: JSON.stringify({
            reason: examRequest.status === 'CONCLUIDO' ? 'EXAM_CONCLUIDO' : 'EXAM_INDISPONIVEL',
            status: examRequest.status,
            doctorId,
          }),
        },
      });
      throw new ConflictException({
        error: 'TELECONSULTATION_BLOCKED',
        code: examRequest.status === 'CONCLUIDO' ? 'EXAM_CONCLUIDO' : 'EXAM_INDISPONIVEL',
        message:
          examRequest.status === 'CONCLUIDO'
            ? 'Não é possível iniciar teleconsulta: atendimento já concluído.'
            : 'Não é possível iniciar teleconsulta para este status de atendimento.',
        examRequestId: body.examRequestId,
      });
    }

    const existingRoom = await this.prisma.teleconsultation.findFirst({
      where: { requestId: body.examRequestId },
    });

    if (existingRoom) {
      const videoSessionId = this.withEmbeddedJitsiConfig(existingRoom.videoSessionId);
      const hostRoomUrl = this.withEmbeddedJitsiConfig(existingRoom.hostRoomUrl);
      const roomForReturn =
        videoSessionId !== existingRoom.videoSessionId || hostRoomUrl !== existingRoom.hostRoomUrl
          ? await this.prisma.teleconsultation.update({
              where: { id: existingRoom.id },
              data: { videoSessionId, hostRoomUrl },
            })
          : existingRoom;

      if (examRequest.status !== 'EM_ATENDIMENTO_MEDICO') {
        await this.prisma.examRequest.update({
          where: { id: body.examRequestId },
          data: { status: 'EM_ATENDIMENTO_MEDICO' },
        });
      }

      if (examRequest.inviteId) {
        const existingEvent = await this.prisma.examTimelineEvent.findFirst({
          where: {
            examRequestId: body.examRequestId,
            eventType: 'TELECONSULTA_INICIADA',
          },
        });

        if (!existingEvent) {
          await this.prisma.examTimelineEvent.create({
            data: {
              inviteId: examRequest.inviteId,
              examRequestId: body.examRequestId,
              eventType: 'TELECONSULTA_INICIADA',
              metadata: JSON.stringify({ doctorId, roomId: existingRoom.id }),
            },
          });
        }
      }

      this.emitTeleconsultationStarted(body.examRequestId, roomForReturn);
      return { success: true, data: roomForReturn };
    }

    const uniqueHash = Math.random().toString(36).substring(2, 10);
    const roomName = `SaudeSeg-Consulta-${body.examRequestId.slice(0, 8)}-${uniqueHash}`;
    const videoSessionId = this.withEmbeddedJitsiConfig(`https://meet.jit.si/${roomName}`);
    const hostRoomUrl = videoSessionId;

    const teleconsultation = await this.prisma.teleconsultation.create({
      data: {
        requestId: body.examRequestId,
        doctorId,
        videoSessionId,
        hostRoomUrl,
        startedAt: new Date(),
      },
    });

    await this.prisma.examRequest.update({
      where: { id: body.examRequestId },
      data: { status: 'EM_ATENDIMENTO_MEDICO' },
    });

    if (examRequest.inviteId) {
      await this.prisma.examTimelineEvent.create({
        data: {
          inviteId: examRequest.inviteId,
          examRequestId: body.examRequestId,
          eventType: 'TELECONSULTA_INICIADA',
          metadata: JSON.stringify({ doctorId, roomId: teleconsultation.id }),
        },
      });
    }

    this.emitTeleconsultationStarted(body.examRequestId, teleconsultation);

    return { success: true, data: teleconsultation };
  }

  private emitTeleconsultationStarted(
    examRequestId: string,
    teleconsultation: { id: string; videoSessionId: string | null; hostRoomUrl: string | null; startedAt: Date },
  ) {
    this.queueGateway.emitProcessUpdate(examRequestId, 'teleconsulta_iniciada', {
      examRequestId,
      teleconsultationId: teleconsultation.id,
      linkSala: teleconsultation.videoSessionId,
      hostRoomUrl: teleconsultation.hostRoomUrl,
      startedAt: teleconsultation.startedAt.toISOString(),
    });
  }

  private withEmbeddedJitsiConfig(url: string | null) {
    if (!url) return null;
    const [base, hash = ''] = url.split('#');
    const params = new URLSearchParams(hash);
    params.set('config.prejoinPageEnabled', 'false');
    params.set('config.disableDeepLinking', 'true');
    params.set('interfaceConfig.MOBILE_APP_PROMO', 'false');
    return `${base}#${params.toString()}`;
  }
}
