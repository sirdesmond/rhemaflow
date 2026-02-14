import { useEffect, useCallback } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { NOTIFICATION_MESSAGES } from "../constants/notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function requestPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/**
 * Parse a time string like "08:00" into hours and minutes.
 */
function parseTime(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(":").map(Number);
  return { hour: h || 8, minute: m || 0 };
}

/**
 * Schedule a daily local notification at the given time.
 * Cancels any existing scheduled notifications first.
 */
export async function scheduleDailyNotification(time: string): Promise<boolean> {
  const granted = await requestPermission();
  if (!granted) return false;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const { hour, minute } = parseTime(time);
  const randomMsg =
    NOTIFICATION_MESSAGES[
      Math.floor(Math.random() * NOTIFICATION_MESSAGES.length)
    ];

  await Notifications.scheduleNotificationAsync({
    content: {
      title: randomMsg.title,
      body: randomMsg.body,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  return true;
}

/**
 * Cancel all scheduled notifications.
 */
export async function cancelNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Hook to set up notification listeners.
 */
export function useNotifications() {
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        // Could track analytics here in the future
      }
    );

    return () => subscription.remove();
  }, []);

  const schedule = useCallback(async (time: string) => {
    return scheduleDailyNotification(time);
  }, []);

  const cancel = useCallback(async () => {
    return cancelNotifications();
  }, []);

  return { schedule, cancel };
}
