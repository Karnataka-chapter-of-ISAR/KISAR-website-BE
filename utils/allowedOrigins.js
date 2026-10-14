// Read per call: ES imports are hoisted above dotenv.config() in app.js, so the
// env var isn't populated yet when this module loads.
const DEFAULT_ORIGINS = 'http://localhost:5173,http://localhost:8080,https://kisar.netlify.app,https://kisaradmin.netlify.app,https://office.kisar.org.in';

export function getAllowedOrigins() {
  return (process.env.CORS_ORIGIN || DEFAULT_ORIGINS).split(',').map((origin) => origin.trim());
}
