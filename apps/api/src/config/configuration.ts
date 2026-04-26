export default () => ({
  port: parseInt(process.env.PORT || '3001', 10),
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    jwtSecret: process.env.SUPABASE_JWT_SECRET,
  },
  database: {
    url: process.env.SUPABASE_DATABASE_URL,
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  }
});
