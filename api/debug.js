module.exports = async (req, res) => {
  return res.status(200).json({
    BLOB_READ_WRITE_TOKEN_PRESENT: !!process.env.BLOB_READ_WRITE_TOKEN,
    POSTGRES_URL_PRESENT: !!process.env.POSTGRES_URL,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV
  });
};
