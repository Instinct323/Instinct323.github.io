export interface IdleScheduleOptions {
  timeout: number;
}

/** Schedules a callback during browser idle time, falling back to setTimeout. */
export function runWhenIdle(
  callback: () => void,
  options: Partial<IdleScheduleOptions> = {},
): void {
  const timeout = options.timeout ?? 1000;
  const scheduleTimeout = window.setTimeout.bind(window);

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, { timeout });
    return;
  }

  scheduleTimeout(callback, timeout);
}
