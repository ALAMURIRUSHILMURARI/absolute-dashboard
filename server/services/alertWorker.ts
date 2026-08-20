import { db } from './db.js';
import { emailService } from './email.js';
import { v4 as uuidv4 } from 'uuid';
import { NotificationItem } from '../models/types.js';

class ScheduleAlertWorker {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  public start(intervalMs = 30000) {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`⏰ [ScheduleAlertWorker] Started background alert monitor (polling every ${intervalMs / 1000}s)`);

    // Run first check immediately, then on interval
    this.checkUpcomingSchedules();
    this.timer = setInterval(() => this.checkUpcomingSchedules(), intervalMs);
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    console.log('⏰ [ScheduleAlertWorker] Stopped background alert monitor');
  }

  public async checkUpcomingSchedules() {
    try {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      // Filter uncompleted schedules for today or upcoming with pending email alert
      const pendingSchedules = db.schedules.filter(
        s => !s.isCompleted && !s.emailAlertSent
      );

      for (const schedule of pendingSchedules) {
        // Parse event datetime
        const [hours, minutes] = schedule.startTime.split(':').map(Number);
        const eventDate = new Date(`${schedule.date}T${schedule.startTime}:00`);

        if (isNaN(eventDate.getTime())) continue;

        const diffMs = eventDate.getTime() - now.getTime();
        const diffMinutes = Math.round(diffMs / (60 * 1000));

        // Trigger alert if event starts within 30 minutes (between 0 and 32 minutes ahead)
        // or if reminder is specifically 30_min / 15_min / 1_hour
        let triggerAlert = false;
        let reminderThreshold = 30; // default 30 mins

        if (schedule.reminder === '15_min') reminderThreshold = 15;
        else if (schedule.reminder === '1_hour') reminderThreshold = 60;
        else if (schedule.reminder === '1_day') reminderThreshold = 1440;
        else reminderThreshold = 30; // default 30 mins prior

        if (diffMinutes > 0 && diffMinutes <= reminderThreshold) {
          triggerAlert = true;
        }

        if (triggerAlert) {
          const user = db.users.find(u => u.id === schedule.userId);
          const targetEmail =
            user?.preferences?.alertEmail || user?.email || 'mail4murari27@gmail.com';

          console.log(
            `🔔 [ScheduleAlertWorker] Triggering ${schedule.priority} priority alert for "${schedule.title}" (${diffMinutes}m remaining) to ${targetEmail}`
          );

          // 1. Send priority-colored email alert with dynamic countdown
          await emailService.sendScheduleAlert(targetEmail, schedule);

          // 2. Mark schedule as alerted so we don't repeat
          schedule.emailAlertSent = true;
          schedule.emailAlertSentAt = new Date().toISOString();

          // 3. Create in-app notification
          const notif: NotificationItem = {
            id: uuidv4(),
            userId: schedule.userId,
            title: `[${schedule.priority}] Event in ${diffMinutes}m: ${schedule.title}`,
            message: `Mail alert sent to ${targetEmail}. Event starts at ${schedule.startTime} (${schedule.location || 'No location'}).`,
            type: 'SCHEDULE_TODAY',
            read: false,
            link: '/schedule',
            createdAt: new Date().toISOString(),
          };
          db.notifications.push(notif);

          db.save();
        }
      }
    } catch (err) {
      console.error('❌ [ScheduleAlertWorker] Error in alert check:', err);
    }
  }
}

export const alertWorker = new ScheduleAlertWorker();
