const configs = [
  {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  },
  {
    cloud_name: process.env.CLOUDINARY_2_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_2_API_KEY,
    api_secret: process.env.CLOUDINARY_2_API_SECRET,
  },
  {
    cloud_name: process.env.CLOUDINARY_3_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_3_API_KEY,
    api_secret: process.env.CLOUDINARY_3_API_SECRET,
  }
].filter(c => c.cloud_name && c.api_key && c.api_secret);

module.exports = configs;
