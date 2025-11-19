import morgan from 'morgan';

/**
 * Request logger middleware using Morgan
 * Logs HTTP requests with different formats based on environment
 */

/**
 * Development logger with detailed output
 */
export const devLogger = morgan('dev');

/**
 * Production logger with combined format
 */
export const prodLogger = morgan('combined');

/**
 * Custom token for response time in ms
 */
morgan.token('response-time-ms', (req, res) => {
  if (!req._startAt || !res._startAt) {
    return '-';
  }
  
  const ms = (res._startAt[0] - req._startAt[0]) * 1e3 +
    (res._startAt[1] - req._startAt[1]) * 1e-6;
  
  return ms.toFixed(3);
});

/**
 * Custom logger format
 */
export const customLogger = morgan((tokens, req, res) => {
  return [
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens['response-time'](req, res), 'ms',
    '-',
    tokens.res(req, res, 'content-length'), 'bytes',
  ].join(' ');
});

/**
 * Get appropriate logger based on environment
 * @returns {Function} Morgan middleware
 */
export const getLogger = () => {
  const env = process.env.NODE_ENV || 'development';
  
  if (env === 'production') {
    return prodLogger;
  }
  
  return devLogger;
};

/**
 * Simple request logger middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const simpleLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`
    );
  });
  
  next();
};
