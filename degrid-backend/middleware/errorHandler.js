export const notFound = (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
};

// Express recognises error handlers by their four parameters
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  // Malformed JSON body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON body' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'Request body too large' });
  }
  console.error(`${req.method} ${req.originalUrl} failed:`, err);
  // Never send internal error details to the client
  res.status(500).json({ success: false, message: 'Internal Server Error' });
};
