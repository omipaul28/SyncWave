const cloudinary = require('cloudinary').v2;
const configs = require('../config/cloudinary');
const { Readable } = require('stream');

let currentAccountIndex = 0;

/**
 * Returns the index of the next Cloudinary account to use for uploading,
 * advancing the round-robin counter.
 * @returns {number} account index
 */
const getNextAccountIndex = () => {
  if (!configs || configs.length === 0) return -1;
  const index = currentAccountIndex;
  currentAccountIndex = (currentAccountIndex + 1) % configs.length;
  return index;
};

/**
 * Upload a buffer to Cloudinary via a stream.
 * @param {Buffer} buffer - File buffer
 * @param {object} options - Cloudinary upload options
 * @param {number} accountIndex - Index of the Cloudinary config to use
 * @returns {Promise<object>} Cloudinary upload result
 */
const uploadStream = (buffer, options, accountIndex = -1) => {
  return new Promise((resolve, reject) => {
    // If a valid config exists, inject its credentials into the options
    const finalOptions = { ...options };
    if (accountIndex >= 0 && accountIndex < configs.length) {
      Object.assign(finalOptions, configs[accountIndex]);
    }

    const uploadStream = cloudinary.uploader.upload_stream(finalOptions, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

/**
 * Upload an audio file to Cloudinary.
 * @param {Buffer} buffer
 * @param {string} publicId
 * @param {number} accountIndex
 */
const uploadAudio = (buffer, publicId, accountIndex = -1) =>
  uploadStream(buffer, {
    resource_type: 'video', // Cloudinary uses 'video' for audio files
    folder: 'syncwave/audio',
    public_id: publicId,
    format: 'mp3',
  }, accountIndex);

/**
 * Upload a cover image to Cloudinary.
 * @param {Buffer} buffer
 * @param {string} publicId
 * @param {number} accountIndex
 */
const uploadImage = (buffer, publicId, accountIndex = -1) =>
  uploadStream(buffer, {
    resource_type: 'image',
    folder: 'syncwave/covers',
    public_id: publicId,
    transformation: [{ width: 500, height: 500, crop: 'fill', quality: 'auto' }],
  }, accountIndex);

/**
 * Delete a Cloudinary asset by public_id.
 * We try deleting from all configured accounts until successful.
 * @param {string} publicId
 * @param {'video'|'image'} resourceType
 */
const deleteAsset = async (publicId, resourceType = 'image') => {
  if (!configs || configs.length === 0) {
    return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  }

  for (const config of configs) {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        ...config
      });
      if (result.result === 'ok') return result;
    } catch (err) {
      // Ignore and try next account
    }
  }
  return { result: 'not found' };
};

/**
 * Fetch usage statistics for all configured Cloudinary accounts.
 */
const getCloudinaryStats = async () => {
  const stats = [];
  if (!configs || configs.length === 0) return stats;

  for (let i = 0; i < configs.length; i++) {
    try {
      const usage = await cloudinary.api.usage(configs[i]);
      stats.push({
        account: i + 1,
        cloudName: configs[i].cloud_name,
        plan: usage.plan,
        credits: usage.credits,
        storage: usage.storage,
        bandwidth: usage.bandwidth,
      });
    } catch (err) {
      stats.push({
        account: i + 1,
        cloudName: configs[i].cloud_name,
        error: err.message || 'Failed to fetch stats',
      });
    }
  }
  return stats;
};

module.exports = { getNextAccountIndex, uploadAudio, uploadImage, deleteAsset, getCloudinaryStats };
