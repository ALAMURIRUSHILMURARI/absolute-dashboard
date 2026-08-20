import { Router, Response } from 'express';
import { db } from '../services/db.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/v1/notifications
router.get('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const notifs = db.notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const unreadCount = notifs.filter(n => !n.read).length;

    return res.json({
      notifications: notifs,
      unreadCount,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch notifications' });
  }
});

// PATCH /api/v1/notifications/:id/read
router.patch('/:id/read', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const notif = db.notifications.find(n => n.id === id && n.userId === userId);
    if (!notif) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    notif.read = true;
    db.save();

    return res.json({ notification: notif });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update notification' });
  }
});

// POST /api/v1/notifications/read-all
router.post('/read-all', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    for (const n of db.notifications) {
      if (n.userId === userId) {
        n.read = true;
      }
    }
    db.save();

    return res.json({ message: 'All notifications marked as read' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to mark all as read' });
  }
});

export default router;
