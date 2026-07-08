import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST ?? 'smtp.mailtrap.io',
        port: parseInt(process.env.MAIL_PORT ?? '2525'),
        auth: {
          user: process.env.MAIL_USER ?? '',
          pass: process.env.MAIL_PASS ?? '',
        },
      },
      defaults: { from: process.env.MAIL_FROM ?? '"SaúdeSeg+" <noreply@saudeseg.com>' },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
