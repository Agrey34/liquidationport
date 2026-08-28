export default () => ({
  port: parseInt(process.env.PORT || '4000', 10),
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
  },
  r2: {
    accountId: process.env.R2_ACCOUNT_ID || '54a76a340b60f196d22a7e8918460a78',
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName: process.env.R2_BUCKET_NAME || 'ecommerce-product-images',
    publicDomain: process.env.R2_PUBLIC_DOMAIN,
  },
  supabaseStorage: {
    accessKeyId: process.env.SUPABASE_STORAGE_ACCESS_KEY_ID || process.env.SUPABASE_ANON_KEY,
    secretAccessKey: process.env.SUPABASE_STORAGE_SECRET_ACCESS_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
    region: process.env.SUPABASE_STORAGE_REGION || 'eu-central-1',
  },
});
