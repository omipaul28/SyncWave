const youtubedl = require('youtube-dl-exec');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

// Point fluent-ffmpeg at the static binary
ffmpeg.setFfmpegPath(ffmpegPath);

/**
 * Fetch video metadata without downloading the audio.
 * Returns { title, artist, album, duration, thumbnailUrl, genre }
 */
const getVideoInfo = async (url) => {
  const info = await youtubedl(url, {
    dumpSingleJson: true,
    noWarnings: true,
    noCheckCertificate: true,
    preferFreeFormats: true,
  });

  return {
    title: info.title || 'Unknown Title',
    artist: info.artist || info.uploader || info.channel || 'Unknown Artist',
    album: info.album || null,
    duration: Math.round(info.duration || 0),
    thumbnailUrl: info.thumbnail || null,
    genre: info.genre || null,
    description: info.description || '',
  };
};

/**
 * Download the best audio stream from a YouTube URL and convert it to
 * an MP3 Buffer (320 kbps) using yt-dlp + ffmpeg-static.
 *
 * @param {string} url  - YouTube URL
 * @param {Function} [onStatus] - callback(status: string)
 * @returns {Promise<Buffer>}
 */
const downloadAsMP3 = async (url, onStatus) => {
  const id = uuidv4();
  const tmpDir = os.tmpdir();
  // yt-dlp will append the real extension, so we use a %(ext)s template
  const tmpTemplate = path.join(tmpDir, `yt_${id}.%(ext)s`);
  const tmpMp3 = path.join(tmpDir, `yt_${id}.mp3`);

  try {
    onStatus?.('downloading');

    // Download best audio; yt-dlp + ffmpeg converts directly to mp3
    await youtubedl(url, {
      output: tmpTemplate,
      format: 'bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio/best',
      extractAudio: true,
      audioFormat: 'mp3',
      audioQuality: '0',                     // best VBR quality
      ffmpegLocation: path.dirname(ffmpegPath),
      noWarnings: true,
      noCheckCertificate: true,
    });

    onStatus?.('converting');

    // yt-dlp with --extract-audio --audio-format mp3 writes <template>.mp3
    // Verify the file exists
    if (!fs.existsSync(tmpMp3)) {
      // Fallback: look for any file matching our id in tmpdir
      const files = fs.readdirSync(tmpDir).filter((f) => f.startsWith(`yt_${id}`));
      if (files.length === 0) throw new Error('Downloaded file not found in temp directory');

      const srcPath = path.join(tmpDir, files[0]);
      // Convert whatever was downloaded to mp3 via fluent-ffmpeg
      await new Promise((resolve, reject) => {
        ffmpeg(srcPath)
          .audioCodec('libmp3lame')
          .audioBitrate(320)
          .format('mp3')
          .on('end', resolve)
          .on('error', reject)
          .save(tmpMp3);
      });
      fs.unlinkSync(srcPath);
    }

    const buffer = fs.readFileSync(tmpMp3);
    return buffer;
  } finally {
    // Cleanup all temp files for this id
    try {
      fs.readdirSync(tmpDir)
        .filter((f) => f.startsWith(`yt_${id}`))
        .forEach((f) => {
          try { fs.unlinkSync(path.join(tmpDir, f)); } catch {}
        });
    } catch {}
  }
};

/**
 * Fetch a thumbnail image from a URL and return a Buffer.
 * Falls back gracefully if the fetch fails.
 */
const fetchThumbnail = async (thumbnailUrl) => {
  if (!thumbnailUrl) return null;
  try {
    const res = await axios.get(thumbnailUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
    });
    return Buffer.from(res.data);
  } catch {
    return null;
  }
};

module.exports = { getVideoInfo, downloadAsMP3, fetchThumbnail };
