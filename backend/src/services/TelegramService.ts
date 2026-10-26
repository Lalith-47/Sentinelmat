import axios from 'axios';
import { config } from '../config';
import { AlertRepository } from '../repositories/AlertRepository';

export class TelegramService {
  static async sendAlert(message: string, incidentId?: number): Promise<boolean> {
    if (!config.telegram.enabled) {
      // Record skipped log for auditability
      await AlertRepository.insertNotificationLog({
        incident_id: incidentId,
        channel: 'telegram',
        recipient: 'unconfigured',
        message,
        status: 'skipped',
        error_message: 'TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured in .env',
      });
      return false;
    }

    const url = `https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`;
    try {
      await axios.post(
        url,
        {
          chat_id: config.telegram.chatId,
          text: message,
          parse_mode: 'HTML',
        },
        { timeout: 5000 }
      );

      await AlertRepository.insertNotificationLog({
        incident_id: incidentId,
        channel: 'telegram',
        recipient: config.telegram.chatId,
        message,
        status: 'sent',
      });
      return true;
    } catch (err: any) {
      console.warn('[TelegramService] Telegram notification dispatch failed:', err.message);
      await AlertRepository.insertNotificationLog({
        incident_id: incidentId,
        channel: 'telegram',
        recipient: config.telegram.chatId,
        message,
        status: 'failed',
        error_message: err.message,
      });
      return false;
    }
  }

  static formatIncidentAlert(incident: {
    id?: number;
    host_id: string;
    title: string;
    severity: string;
    trigger_metric: string;
    trigger_value: number;
    summary: string;
  }): string {
    const icon = incident.severity === 'critical' ? '🚨' : '⚠️';
    return `
${icon} <b>SentinelMAT Infrastructure Alert</b> ${icon}
<b>Incident ID:</b> #${incident.id || 'N/A'}
<b>Host:</b> <code>${incident.host_id}</code>
<b>Severity:</b> <b>${incident.severity.toUpperCase()}</b>
<b>Title:</b> ${incident.title}
<b>Metric:</b> ${incident.trigger_metric} (Value: <b>${incident.trigger_value}</b>)
<b>Details:</b> ${incident.summary}
<i>Time:</i> ${new Date().toISOString()}
    `.trim();
  }
}
