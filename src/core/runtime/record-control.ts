const RECORD_CONTROL_SELECTOR = '[data-record-control]';
const RECORD_AUDIO_SELECTOR = '[data-record-audio]';
const RECORD_BUTTON_SELECTOR = '[data-record-button]';
const RECORD_STATUS_SELECTOR = '[data-record-status]';
const PROGRESS_SAVE_INTERVAL_MS = 5000;

interface RecordControlElements {
  control: HTMLElement;
  audio: HTMLAudioElement;
  source: HTMLSourceElement;
  button: HTMLButtonElement;
  status: HTMLElement;
}

interface RecordControlState {
  isPlaying?: boolean;
  statusText: string;
  ariaLabel?: string;
  disabled?: boolean;
}

function getRecordControlElements(root: ParentNode): RecordControlElements | null {
  const control = root.querySelector<HTMLElement>(RECORD_CONTROL_SELECTOR);
  if (!control) {
    return null;
  }

  const audio = control.querySelector<HTMLAudioElement>(RECORD_AUDIO_SELECTOR);
  const source = audio?.querySelector<HTMLSourceElement>('source');
  const button = control.querySelector<HTMLButtonElement>(RECORD_BUTTON_SELECTOR);
  const status = control.querySelector<HTMLElement>(RECORD_STATUS_SELECTOR);
  if (!audio || !source || !button || !status) {
    console.warn('Record control markup is incomplete.');
    return null;
  }

  return { control, audio, source, button, status };
}

function getStorageKey(source: HTMLSourceElement): string {
  return `site-record-control-current-time-v1:${source.src}`;
}

function readStoredTime(storageKey: string): number | null {
  try {
    const rawTime = window.sessionStorage.getItem(storageKey);
    if (rawTime === null) {
      return null;
    }

    const parsedTime = Number.parseFloat(rawTime);
    return Number.isFinite(parsedTime) && parsedTime >= 0 ? parsedTime : null;
  } catch (e) {
    console.warn('Record control sessionStorage read failed:', e);
    return null;
  }
}

function writeStoredTime(storageKey: string, time: number): void {
  if (!Number.isFinite(time) || time < 0) {
    return;
  }

  try {
    window.sessionStorage.setItem(storageKey, String(time));
  } catch (e) {
    console.warn('Record control sessionStorage write failed:', e);
  }
}

function clearStoredTime(storageKey: string): void {
  try {
    window.sessionStorage.removeItem(storageKey);
  } catch (e) {
    console.warn('Record control sessionStorage clear failed:', e);
  }
}

function isWithinAudioRange(time: number, duration: number): boolean {
  if (!Number.isFinite(time) || time < 0) {
    return false;
  }

  if (!Number.isFinite(duration)) {
    return true;
  }

  return time < duration;
}

function setControlState(
  elements: RecordControlElements,
  {
    isPlaying = false,
    statusText,
    ariaLabel = 'Play music',
    disabled = false,
  }: RecordControlState,
): void {
  const { control, button, status } = elements;
  const isActive = isPlaying && !disabled;

  if (isActive) {
    control.style.setProperty('--record-spin-state', 'running');
    control.style.setProperty('--record-arm-angle', '151deg');
    control.style.setProperty('--record-arm-delay', '0ms');
  } else {
    control.style.removeProperty('--record-spin-state');
    control.style.removeProperty('--record-arm-angle');
    control.style.removeProperty('--record-arm-delay');
  }
  button.disabled = disabled;
  button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  button.setAttribute('aria-label', ariaLabel);
  status.textContent = statusText;
}

function saveAudioProgress(audio: HTMLAudioElement, storageKey: string): void {
  if (audio.ended) {
    clearStoredTime(storageKey);
    return;
  }

  writeStoredTime(storageKey, audio.currentTime);
}

function restoreAudioProgress(elements: RecordControlElements, storageKey: string): void {
  const { audio } = elements;
  const storedTime = readStoredTime(storageKey);
  if (storedTime === null) {
    return;
  }

  if (!isWithinAudioRange(storedTime, audio.duration)) {
    clearStoredTime(storageKey);
    return;
  }

  try {
    audio.currentTime = storedTime;
  } catch (e) {
    console.warn('Record control restore failed:', e);
    setControlState(elements, {
      statusText: 'Music saved position unavailable',
    });
  }
}

function canPlayConfiguredSource(audio: HTMLAudioElement, source: HTMLSourceElement): boolean {
  return source.type !== '' && audio.canPlayType(source.type) !== '';
}

async function playAudio(elements: RecordControlElements): Promise<void> {
  try {
    await elements.audio.play();
  } catch (e) {
    console.warn('Record control playback failed:', e);
    setControlState(elements, {
      statusText: 'Music playback blocked. Try again.',
    });
  }
}

export function initRecordControl(root: ParentNode = document): void {
  const elements = getRecordControlElements(root);
  if (!elements || elements.control.dataset.recordInitialized === 'true') {
    return;
  }
  elements.control.dataset.recordInitialized = 'true';

  const { audio, source, button } = elements;
  const storageKey = getStorageKey(source);
  if (!canPlayConfiguredSource(audio, source)) {
    setControlState(elements, {
      statusText: 'Music unavailable: unsupported format',
      ariaLabel: 'Music unavailable: unsupported format',
      disabled: true,
    });
    return;
  }

  setControlState(elements, {
    statusText: 'Music paused',
  });

  let lastProgressSaveTime = 0;

  button.addEventListener('click', () => {
    if (audio.paused) {
      void playAudio(elements);
      return;
    }

    audio.pause();
  });

  audio.addEventListener('loadedmetadata', () => restoreAudioProgress(elements, storageKey));
  if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
    restoreAudioProgress(elements, storageKey);
  }

  audio.addEventListener('play', () => {
    setControlState(elements, {
      isPlaying: true,
      statusText: 'Music playing',
      ariaLabel: 'Pause music',
    });
  });

  audio.addEventListener('pause', () => {
    saveAudioProgress(audio, storageKey);
    setControlState(elements, {
      statusText: audio.ended ? 'Music ended' : 'Music paused',
    });
  });

  audio.addEventListener('ended', () => {
    clearStoredTime(storageKey);
    setControlState(elements, {
      statusText: 'Music ended',
      ariaLabel: 'Play music from start',
    });
  });

  audio.addEventListener('timeupdate', () => {
    const now = Date.now();
    if (now - lastProgressSaveTime < PROGRESS_SAVE_INTERVAL_MS) {
      return;
    }

    lastProgressSaveTime = now;
    saveAudioProgress(audio, storageKey);
  });

  audio.addEventListener('error', () => {
    setControlState(elements, {
      statusText: 'Music failed to load',
    });
  });

  window.addEventListener('pagehide', () => saveAudioProgress(audio, storageKey));
}
