import { useState, useEffect, useCallback } from 'react';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('Notification' in window);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') return null;

    try {
      const notification = new Notification(title, {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        ...options
      });

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  }, [isSupported, permission]);

  const scheduleReminder = useCallback((
    title: string,
    body: string,
    delayMs: number
  ) => {
    if (!isSupported || permission !== 'granted') return null;

    const timeoutId = setTimeout(() => {
      sendNotification(title, { body });
    }, delayMs);

    return timeoutId;
  }, [isSupported, permission, sendNotification]);

  return {
    isSupported,
    permission,
    requestPermission,
    sendNotification,
    scheduleReminder
  };
}

// Payment reminder utilities
export function getNextPaymentReminder(): Date {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  // Remind 3 days before the 1st
  nextMonth.setDate(-2);
  return nextMonth;
}

export function formatReminderTime(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
}
