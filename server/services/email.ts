import nodemailer from 'nodemailer';
import { Schedule, SchedulePriority, User } from '../models/types.js';
import { db } from './db.js';

export interface PriorityTheme {
  primary: string;
  gradient: string;
  glow: string;
  pillBg: string;
  pillText: string;
  pillBorder: string;
  tag: string;
  accentBorder: string;
}

export interface CountdownInfo {
  diffMinutes: number;
  badgeText: string;
  pillTitle: string;
  pillDetail: string;
  subjectPrefix: string;
}

export function calculateRealtimeCountdown(dateStr: string, timeStr: string): CountdownInfo {
  const now = new Date();
  const targetDate = new Date(`${dateStr}T${timeStr}:00`);

  if (isNaN(targetDate.getTime())) {
    return {
      diffMinutes: 30,
      badgeText: 'SCHEDULED EVENT',
      pillTitle: '⏰ Schedule Notification',
      pillDetail: `This event is scheduled for ${dateStr} at ${timeStr}.`,
      subjectPrefix: 'Upcoming Event',
    };
  }

  const diffMs = targetDate.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / (60 * 1000));

  if (diffMinutes <= 0) {
    return {
      diffMinutes,
      badgeText: 'EVENT LIVE / TODAY',
      pillTitle: '🔴 Live / Happening Today',
      pillDetail: `This event was scheduled for today (${dateStr}) at ${timeStr} and is currently in progress or past its start time.`,
      subjectPrefix: 'Live / Happening Today',
    };
  }

  if (diffMinutes < 60) {
    return {
      diffMinutes,
      badgeText: `STARTS IN ${diffMinutes} MIN${diffMinutes === 1 ? '' : 'S'}`,
      pillTitle: `⏰ Starting in ${diffMinutes} Minute${diffMinutes === 1 ? '' : 's'}`,
      pillDetail: `This event is scheduled to begin at ${timeStr} today (${dateStr}) — starting in approximately ${diffMinutes} minutes.`,
      subjectPrefix: `In ${diffMinutes} mins`,
    };
  }

  if (diffMinutes < 1440) {
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    const timePhrase =
      mins > 0
        ? `${hours} hr${hours > 1 ? 's' : ''} ${mins} min${mins > 1 ? 's' : ''}`
        : `${hours} hour${hours > 1 ? 's' : ''}`;
    return {
      diffMinutes,
      badgeText: `STARTS IN ${hours} HOUR${hours > 1 ? 'S' : ''}${mins > 0 ? ` ${mins}M` : ''}`,
      pillTitle: `⏰ Starting in ~${hours} Hour${hours > 1 ? 's' : ''}${mins > 0 ? ` ${mins} mins` : ''}`,
      pillDetail: `This event is scheduled to begin at ${timeStr} on ${dateStr} — starting in ${timePhrase} (${diffMinutes} mins from now).`,
      subjectPrefix: `In ~${hours} hours`,
    };
  }

  // More than 1 day (1440+ mins)
  const days = Math.floor(diffMinutes / 1440);
  const remHours = Math.floor((diffMinutes % 1440) / 60);
  const timePhrase = days === 1 ? '1 day' : `${days} days`;
  const totalHours = Math.round(diffMinutes / 60);

  return {
    diffMinutes,
    badgeText: `STARTS IN ${days} DAY${days > 1 ? 'S' : ''}${remHours > 0 ? ` ${remHours}H` : ''}`,
    pillTitle: `📅 Starting in ${timePhrase}${remHours > 0 ? ` and ${remHours} hours` : ''}`,
    pillDetail: `This event is scheduled for ${dateStr} at ${timeStr} — starting in approx. ${timePhrase} (~${totalHours} hours from now).`,
    subjectPrefix: `In ${timePhrase}`,
  };
}

export function getPriorityTheme(priority: SchedulePriority): PriorityTheme {
  switch (priority) {
    case 'Urgent':
      return {
        primary: '#E05A47',
        gradient: 'linear-gradient(135deg, #E05A47 0%, #8A2616 100%)',
        glow: 'rgba(224, 90, 71, 0.35)',
        pillBg: '#381611',
        pillText: '#FFA092',
        pillBorder: '#E05A47',
        tag: '🔥 URGENT PRIORITY ALERT',
        accentBorder: '#E05A47',
      };
    case 'High':
      return {
        primary: '#D36B4E',
        gradient: 'linear-gradient(135deg, #D36B4E 0%, #7A3522 100%)',
        glow: 'rgba(211, 107, 78, 0.35)',
        pillBg: '#2E1C18',
        pillText: '#E27B5E',
        pillBorder: '#D36B4E',
        tag: '⚡ HIGH PRIORITY ALERT',
        accentBorder: '#D36B4E',
      };
    case 'Medium':
      return {
        primary: '#F59E0B',
        gradient: 'linear-gradient(135deg, #F59E0B 0%, #854D0E 100%)',
        glow: 'rgba(245, 158, 11, 0.35)',
        pillBg: '#2E2210',
        pillText: '#FBBF24',
        pillBorder: '#F59E0B',
        tag: '⏳ MEDIUM PRIORITY REMINDER',
        accentBorder: '#F59E0B',
      };
    case 'Low':
    default:
      return {
        primary: '#3AB4B9',
        gradient: 'linear-gradient(135deg, #3AB4B9 0%, #155E75 100%)',
        glow: 'rgba(58, 180, 185, 0.35)',
        pillBg: '#112325',
        pillText: '#4FC5CA',
        pillBorder: '#3AB4B9',
        tag: '✨ UPCOMING EVENT',
        accentBorder: '#3AB4B9',
      };
  }
}

export function generateScheduleEmailHtml(
  schedule: {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    location?: string;
    description?: string;
    priority: SchedulePriority;
    category: string;
  },
  recipientEmail: string,
  overrideCountdown?: CountdownInfo
): { subject: string; html: string; countdown: CountdownInfo } {
  const theme = getPriorityTheme(schedule.priority);
  const countdown = overrideCountdown || calculateRealtimeCountdown(schedule.date, schedule.startTime);

  const subject = `[${schedule.priority.toUpperCase()}] ${countdown.subjectPrefix}: "${schedule.title}"`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FAF6F0;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0A0A0A; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #121212; border: 1px solid rgba(250, 246, 240, 0.12); border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.8);">
          
          <!-- Top Priority Banner -->
          <tr>
            <td style="background: ${theme.gradient}; padding: 22px 30px; text-align: left;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #FAF6F0; opacity: 0.95;">
                      ${theme.tag}
                    </div>
                    <div style="font-size: 20px; font-weight: 900; letter-spacing: 1px; color: #FFFFFF; margin-top: 4px; font-family: Georgia, serif;">
                      ABSOLUTE COMMAND CENTER
                    </div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.3); color: #FFFFFF; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; padding: 7px 14px; border-radius: 12px; font-family: monospace;">
                      ${countdown.badgeText}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Area -->
          <tr>
            <td style="padding: 32px 30px;">
              <!-- Greeting & Countdown Notice -->
              <div style="font-size: 13px; color: #A49690; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700;">
                Real-Time Schedule Notification
              </div>

              <!-- Event Title -->
              <h1 style="font-size: 28px; font-weight: 800; color: #FAF6F0; margin: 10px 0 16px 0; font-family: Georgia, serif; line-height: 1.2;">
                ${schedule.title}
              </h1>

              <!-- Priority Callout Pill Box (Dynamic Real-Time Countdown) -->
              <div style="background-color: ${theme.pillBg}; border: 1px solid ${theme.pillBorder}; border-left: 5px solid ${theme.primary}; border-radius: 16px; padding: 16px 20px; margin-bottom: 24px;">
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td>
                      <div style="font-size: 12px; font-weight: 800; color: ${theme.pillText}; text-transform: uppercase; letter-spacing: 1px;">
                        ${countdown.pillTitle}
                      </div>
                      <div style="font-size: 14px; color: #FAF6F0; margin-top: 5px; font-weight: 500; line-height: 1.4;">
                        ${countdown.pillDetail}
                      </div>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Details Grid -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #1D1B1A; border: 1px solid rgba(250, 246, 240, 0.08); border-radius: 18px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid rgba(250, 246, 240, 0.06);">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="35%" style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #A49690; font-weight: 700;">Date</td>
                        <td style="font-size: 14px; color: #FAF6F0; font-weight: 700; font-family: monospace;">${schedule.date}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid rgba(250, 246, 240, 0.06);">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="35%" style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #A49690; font-weight: 700;">Time Window</td>
                        <td style="font-size: 14px; color: #FAF6F0; font-weight: 700; font-family: monospace;">${schedule.startTime} – ${schedule.endTime}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid rgba(250, 246, 240, 0.06);">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="35%" style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #A49690; font-weight: 700;">Priority Level</td>
                        <td>
                          <span style="display: inline-block; background-color: ${theme.pillBg}; color: ${theme.pillText}; border: 1px solid ${theme.pillBorder}; font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 8px; text-transform: uppercase;">
                            ${schedule.priority}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid rgba(250, 246, 240, 0.06);">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="35%" style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #A49690; font-weight: 700;">Category</td>
                        <td style="font-size: 14px; color: #FAF6F0; font-weight: 600;">${schedule.category}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ${
                  schedule.location
                    ? `
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid rgba(250, 246, 240, 0.06);">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="35%" style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #A49690; font-weight: 700;">Location / Link</td>
                        <td style="font-size: 14px; color: ${theme.primary}; font-weight: 700;">${schedule.location}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                `
                    : ''
                }
                ${
                  schedule.description
                    ? `
                <tr>
                  <td style="padding: 16px 20px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="35%" style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #A49690; font-weight: 700;">Description</td>
                        <td style="font-size: 13px; color: #A49690; line-height: 1.4;">${schedule.description}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                `
                    : ''
                }
              </table>

              <!-- Call to action button -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 28px;">
                <tr>
                  <td align="center">
                    <a href="http://localhost:5173/schedule" target="_blank" style="display: inline-block; background-color: ${theme.primary}; color: #FAF6F0; text-decoration: none; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; padding: 16px 36px; border-radius: 16px; box-shadow: 0 10px 25px ${theme.glow};">
                      Open in Command Center &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0A0A0A; border-top: 1px solid rgba(250, 246, 240, 0.08); padding: 22px 30px; text-align: center;">
              <p style="font-size: 11px; color: #A49690; margin: 0 0 6px 0;">
                Delivered automatically to <strong style="color: #FAF6F0;">${recipientEmail}</strong> for your scheduled event.
              </p>
              <p style="font-size: 10px; color: rgba(164, 150, 144, 0.6); margin: 0; text-transform: uppercase; letter-spacing: 1px;">
                ABSOLUTE Personal Command Center &bull; Live Alert Dispatcher
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { subject, html, countdown };
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  public isConfigured = false;
  public configuredSender = '';

  constructor() {
    this.initTransporter();
  }

  public initTransporter() {
    const userWithSmtp = db.users.find(u => u.preferences?.smtpUser && u.preferences?.smtpPass);
    const host = userWithSmtp?.preferences?.smtpHost || process.env.SMTP_HOST;
    const port = userWithSmtp?.preferences?.smtpPort || parseInt(process.env.SMTP_PORT || '465', 10);
    const user = userWithSmtp?.preferences?.smtpUser || process.env.SMTP_USER;
    const pass = userWithSmtp?.preferences?.smtpPass || process.env.SMTP_PASS;

    if (user && pass) {
      if (!host || host.includes('gmail')) {
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: user.trim(), pass: pass.trim() },
        });
      } else {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user: user.trim(), pass: pass.trim() },
        });
      }
      this.isConfigured = true;
      this.configuredSender = user.trim();
      console.log(`📧 [EmailService] Live SMTP connected for ${user} (Host: ${host || 'Gmail Service'})`);
    } else {
      this.transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
      this.isConfigured = false;
      this.configuredSender = '';
      console.log('📧 [EmailService] Simulated transport active.');
    }
  }

  public async setCustomSmtp(config: { host?: string; port?: number; user?: string; pass?: string }): Promise<{ success: boolean; error?: string }> {
    try {
      if (!config.user || !config.pass) {
        throw new Error('Gmail/SMTP Username and Password are required');
      }

      let transport: nodemailer.Transporter;
      if (!config.host || config.host.includes('gmail')) {
        transport = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: config.user.trim(), pass: config.pass.trim() },
        });
      } else {
        transport = nodemailer.createTransport({
          host: config.host.trim(),
          port: config.port || 465,
          secure: (config.port || 465) === 465,
          auth: { user: config.user.trim(), pass: config.pass.trim() },
        });
      }

      await transport.verify();

      this.transporter = transport;
      this.isConfigured = true;
      this.configuredSender = config.user.trim();

      console.log(`✅ [EmailService] SMTP Connection verified for ${config.user}`);
      return { success: true };
    } catch (err: any) {
      console.error('❌ [EmailService] SMTP Verification failed:', err.message);
      return { success: false, error: err.message || 'SMTP Authentication failed.' };
    }
  }

  /**
   * Send a real-time schedule alert email with dynamically calculated countdown
   */
  public async sendScheduleAlert(
    recipientEmail: string,
    schedule: Schedule
  ): Promise<{ success: boolean; subject?: string; messageId?: string; isLiveDelivered?: boolean; error?: string }> {
    try {
      const targetEmail = recipientEmail || 'mail4murari27@gmail.com';
      const { subject, html, countdown } = generateScheduleEmailHtml(schedule, targetEmail);

      const fromAddress = this.isConfigured
        ? `"ABSOLUTE Command Center" <${this.configuredSender}>`
        : process.env.SMTP_FROM || '"ABSOLUTE Command Center" <mail4murari27@gmail.com>';

      if (this.transporter) {
        const info = await this.transporter.sendMail({
          from: fromAddress,
          to: targetEmail,
          subject,
          html,
        });

        console.log(
          `🚀 [EmailService] Dispatched alert to ${targetEmail} for "${schedule.title}" [${countdown.badgeText}] (Live: ${this.isConfigured})`
        );

        return {
          success: true,
          subject,
          messageId: info.messageId,
          isLiveDelivered: this.isConfigured,
        };
      }

      return { success: true, subject, isLiveDelivered: false };
    } catch (err: any) {
      console.error('❌ [EmailService] Failed to send email alert:', err);
      return { success: false, error: err.message || 'Failed to send email' };
    }
  }

  /**
   * Send a test email for any priority to verify the styling
   */
  public async sendTestEmail(
    recipientEmail: string,
    priority: SchedulePriority = 'Urgent'
  ): Promise<{ success: boolean; subject: string; isLiveDelivered?: boolean; error?: string }> {
    const targetEmail = recipientEmail || 'mail4murari27@gmail.com';

    const testSchedule: Schedule = {
      id: 'test_alert_' + Date.now(),
      userId: 'test_user',
      title:
        priority === 'Urgent'
          ? '🔥 Critical Assessment Sprint'
          : priority === 'High'
          ? 'BNP Paribas Exam Assessment'
          : priority === 'Medium'
          ? 'Team Architecture Sync'
          : 'Weekly Planning & Tasks',
      date: new Date().toISOString().split('T')[0],
      startTime: new Date(Date.now() + 30 * 60000).toTimeString().slice(0, 5),
      endTime: new Date(Date.now() + 90 * 60000).toTimeString().slice(0, 5),
      location: 'Google Meet / Online Assessment Portal',
      description: `Test alert verifying priority-wise color scheme (${priority}) delivered 30 minutes prior to event start.`,
      priority,
      category: 'Exam',
      reminder: '30_min',
      recurring: 'None',
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { subject, html } = generateScheduleEmailHtml(testSchedule, targetEmail);
    const fromAddress = this.isConfigured
      ? `"ABSOLUTE Command Center" <${this.configuredSender}>`
      : process.env.SMTP_FROM || '"ABSOLUTE Command Center" <mail4murari27@gmail.com>';

    try {
      if (this.transporter) {
        await this.transporter.sendMail({
          from: fromAddress,
          to: targetEmail,
          subject,
          html,
        });

        console.log(`🚀 [EmailService] Test email (${priority}) dispatched to ${targetEmail} (Live: ${this.isConfigured})`);
        return { success: true, subject, isLiveDelivered: this.isConfigured };
      }
      return { success: true, subject, isLiveDelivered: false };
    } catch (err: any) {
      return { success: false, subject, error: err.message, isLiveDelivered: false };
    }
  }
}

export const emailService = new EmailService();
