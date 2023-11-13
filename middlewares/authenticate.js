const authenticate = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (apiKey !== process.env.API_KEY) {
    return res.status(403).json({ error: 'Invalid API Key' });
  }

  next();
};

module.exports = authenticate;
