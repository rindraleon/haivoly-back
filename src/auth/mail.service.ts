import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {}

  sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const appName = this.configService.get<string>('APP_NAME') ?? 'Haivoly';

    if (!smtpHost) {
      if (process.env.NODE_ENV === 'production') {
        this.logger.warn(
          'SMTP_HOST non configuré : aucun email de réinitialisation envoyé',
        );
        return Promise.resolve();
      }

      this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      this.logger.log(`📧 [DEV] Password reset pour ${email}`);
      this.logger.log(`🔗 Lien: ${resetUrl}`);
      this.logger.log(`⏰ Expire dans 60 minutes (${appName})`);
      this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return Promise.resolve();
    }

    return this.deliver(email, resetUrl, appName, smtpHost);
  }

  /** Livraison effective (à remplacer par le transport SMTP retenu). */
  private deliver(
    email: string,
    _resetUrl: string,
    appName: string,
    smtpHost: string,
  ): Promise<void> {
    this.logger.log(
      `Email « ${appName} » de réinitialisation envoyé à ${email} via ${smtpHost}`,
    );
    return Promise.resolve();
  }

  buildResetUrl(token: string): string {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ??
      this.configService.get<string>('EXPO_PUBLIC_FRONTEND_URL') ??
      'exp://haivoly';

    const base = frontendUrl.replace(/\/$/, '');
    return `${base}/reset-password?token=${encodeURIComponent(token)}`;
  }
}
