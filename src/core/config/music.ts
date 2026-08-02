import { validateMusicFileName } from '../validation/music-file-name';

export const MUSIC_VORBIS_MIME_TYPE = 'audio/ogg; codecs="vorbis"';

export interface MusicConfig {
  fileName: string;
  publicPath: string;
  mimeType: string;
}

export function resolveMusicConfig(value: unknown): MusicConfig {
  const fileName = validateMusicFileName(value);

  return {
    fileName,
    publicPath: `/music/${encodeURIComponent(fileName)}`,
    mimeType: MUSIC_VORBIS_MIME_TYPE,
  };
}
