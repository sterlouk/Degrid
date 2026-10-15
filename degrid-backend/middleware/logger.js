import morgan from 'morgan';

/** Request logging: concise in development, Apache combined format in production, silent in tests. */
export const getLogger = () => {
  const env = process.env.NODE_ENV || 'development';
  if (env === 'test') return (req, res, next) => next();
  return morgan(env === 'production' ? 'combined' : 'dev');
};
