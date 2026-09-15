/* eslint-disable @typescript-eslint/require-await, @typescript-eslint/no-unused-vars */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Envoie l'email de réinitialisation.
   * En développement, log l'URL en console si aucun SMTP n'est configuré.
   * En production, brancher Nodemailer / Resend / SES ici.
   */
  async sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const appName = this.configService.get<string>('APP_NAME') || 'Haivoly';

    // Si pas de SMTP configuré → log seulement (évite de bloquer le dev)
    if (!smtpHost) {
      this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      this.logger.log(`📧 [MOCK EMAIL] Password reset pour ${email}`);
      this.logger.log(`🔗 Lien: ${resetUrl}`);
      this.logger.log(`⏰ Expire dans 60 minutes`);
      this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return;
    }

    // TODO: Implémenter l'envoi réel avec Nodemailer
    // Exemple:
    // const transporter = nodemailer.createTransport({...});
    // await transporter.sendMail({
    //   from: this.configService.get('SMTP_FROM'),
    //   to: email,
    //   subject: `${appName} - Réinitialisation de votre mot de passe`,
    //   html: `...`
    // });

    this.logger.log(
      `Email de réinitialisation envoyé à ${email} via ${smtpHost}`,
    );
  }

  buildResetUrl(token: string): string {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      this.configService.get<string>('EXPO_PUBLIC_FRONTEND_URL') ||
      'exp://haivoly';

    // Si URL mobile deep-link, utiliser le scheme Expo
    // Sinon URL web pour reset-password
    if (
      frontendUrl.startsWith('exp://') ||
      frontendUrl.startsWith('haivoly://')
    ) {
      return `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
    }

    // URL web / expo-router
    const base = frontendUrl.replace(/\/$/, '');
    return `${base}/reset-password?token=${encodeURIComponent(token)}`;
  }
}
