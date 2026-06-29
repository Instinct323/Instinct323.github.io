export interface IdleScheduleOptions {
  timeout: number;
}

export const SHELL_BACKGROUND_TIMEOUT = 2000;

/** Schedules a callback during browser idle time, falling back to setTimeout. */
export function runWhenIdle(
  callback: () => void,
  options: Partial<IdleScheduleOptions> = {},
): void {
  const timeout = options.timeout ?? 1000;

  window.requestIdleCallback(() => {
    callback();
  }, { timeout });
}
