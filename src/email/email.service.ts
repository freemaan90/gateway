// email/email.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendPasswordResetEmail({
    to,
    token,
    tenantName,
    tenantLogo,
    primaryColor = '#000000',
  }: {
    to: string;
    token: string;
    tenantName: string;
    tenantLogo: string | null;
    primaryColor?: string;
  }) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset?token=${token}`;
    const html = this.buildResetTemplate({
      tenantName,
      tenantLogo,
      primaryColor,
      resetUrl,
    });

    try {
      await this.transporter.sendMail({
        from: `"${tenantName} Soporte" <${process.env.SMTP_USER}>`,
        to,
        subject: `Recuperación de contraseña - ${tenantName}`,
        html,
      });
    } catch (error) {
      console.error('Error enviando email:', error);
      throw new InternalServerErrorException('No se pudo enviar el email');
    }
  }

  private buildResetTemplate({
    tenantName,
    tenantLogo,
    primaryColor,
    resetUrl,
  }: {
    tenantName: string;
    tenantLogo: string | null;
    primaryColor: string;
    resetUrl: string;
  }) {
    return `
      <div style="font-family: Arial, sans-serif; background: #f7f7f7; padding: 40px;">
        <div style="max-width: 480px; margin: auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">

          <div style="text-align: center; margin-bottom: 24px;">
            <img src="${tenantLogo}" alt="${tenantName}" style="height: 60px; object-fit: contain;" />
          </div>

          <h2 style="color: ${primaryColor}; text-align: center; margin-bottom: 16px;">
            Recuperación de contraseña
          </h2>

          <p style="font-size: 15px; color: #444;">
            Recibimos una solicitud para restablecer tu contraseña en <strong>${tenantName}</strong>.
          </p>

          <p style="font-size: 15px; color: #444;">
            Hacé clic en el siguiente botón para continuar:
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" 
               style="background: ${primaryColor}; color: #fff; padding: 14px 22px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
              Restablecer contraseña
            </a>
          </div>

          <p style="font-size: 14px; color: #666;">
            Si no solicitaste este cambio, podés ignorar este mensaje.
          </p>

          <p style="font-size: 12px; color: #aaa; margin-top: 32px; text-align: center;">
            © ${new Date().getFullYear()} ${tenantName}. Todos los derechos reservados.
          </p>
        </div>
      </div>
    `;
  }
}
