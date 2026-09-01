import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface UploadResult {
  url: string;
  key: string;
  bucket: string;
  folder?: string;
}

/** Maps 'type' string from the upload endpoint to an R2 folder path */
export const ASSET_FOLDER_MAP: Record<string, string> = {
  product: 'products',
  category: 'categories',
  marketing: 'marketing',
};

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);

  // Two distinct S3 clients side-by-side
  private readonly r2Client: S3Client;
  private readonly supabaseS3Client: S3Client;

  // Cloudflare R2 bucket details
  private readonly r2BucketName: string;
  private readonly r2AccountId: string;
  private readonly r2PublicDomain: string;

  // Supabase Storage bucket names
  private readonly customerVaultBucket: string = 'customer-vault';
  private readonly userProfilesBucket: string = 'user-profiles';

  constructor(private readonly configService: ConfigService) {
    // ── 1. Initialize Cloudflare R2 S3 Client (Public Product Media) ───────────
    this.r2AccountId =
      this.configService.get<string>('r2.accountId') ||
      this.configService.get<string>('R2_ACCOUNT_ID') ||
      '54a76a340b60f196d22a7e8918460a78';

    this.r2BucketName =
      this.configService.get<string>('r2.bucketName') ||
      this.configService.get<string>('R2_BUCKET_NAME') ||
      'ecommerce-product-images';

    const r2AccessKeyId =
      this.configService.get<string>('r2.accessKeyId') ||
      this.configService.get<string>('R2_ACCESS_KEY_ID') ||
      '';

    const r2SecretAccessKey =
      this.configService.get<string>('r2.secretAccessKey') ||
      this.configService.get<string>('R2_SECRET_ACCESS_KEY') ||
      '';

    const rawPublicDomain =
      this.configService.get<string>('r2.publicDomain') ||
      this.configService.get<string>('R2_PUBLIC_DOMAIN');

    // Use the relative proxy in development/self-hosted; use a true CDN URL in production if provided
    if (
      !rawPublicDomain ||
      rawPublicDomain.includes('pub-ecommerce-product-images.r2.dev') ||
      rawPublicDomain.includes('.r2.cloudflarestorage.com') ||
      rawPublicDomain.includes('localhost')
    ) {
      this.r2PublicDomain = '/api/v1/shop/media';
    } else {
      this.r2PublicDomain = rawPublicDomain;
    }

    this.r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${this.r2AccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: r2AccessKeyId || 'dummy_r2_key',
        secretAccessKey: r2SecretAccessKey || 'dummy_r2_secret',
      },
    });

    // ── 2. Initialize Supabase Storage S3 Client (Private Invoices & Files) ───
    const rawSupabaseUrl =
      this.configService.get<string>('supabase.url') ||
      this.configService.get<string>('SUPABASE_URL') ||
      'https://dwcqddafnxerhoredcmw.supabase.co';

    const supabaseEndpoint = `${rawSupabaseUrl.replace(/\/$/, '')}/storage/v1/s3`;

    const supabaseAccessKeyId =
      this.configService.get<string>('SUPABASE_STORAGE_ACCESS_KEY_ID') ||
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ||
      '';

    const supabaseSecretAccessKey =
      this.configService.get<string>('SUPABASE_STORAGE_SECRET_ACCESS_KEY') ||
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ||
      '';

    const supabaseRegion =
      this.configService.get<string>('SUPABASE_STORAGE_REGION') || 'eu-central-1';

    this.supabaseS3Client = new S3Client({
      region: supabaseRegion,
      endpoint: supabaseEndpoint,
      credentials: {
        accessKeyId: supabaseAccessKeyId || 'dummy_supabase_key',
        secretAccessKey: supabaseSecretAccessKey || 'dummy_supabase_secret',
      },
      forcePathStyle: true, // Required for Supabase S3-compatible endpoint
    });

    this.logger.log(
      `StorageService initialized — R2 Bucket: ${this.r2BucketName} | Supabase Bucket: ${this.customerVaultBucket}`,
    );
  }

  // ── Lifecycle Hook: Verify R2 Bucket Exists on Startup ─────────────────────
  async onModuleInit(): Promise<void> {
    await this.ensureR2BucketExists();
  }

  /**
   * Verifies the Cloudflare R2 bucket 'ecommerce-product-images' exists.
   * Creates it if it doesn't, then seeds placeholder .keep files so
   * the three folder paths (products/, categories/, marketing/) appear
   * in the Cloudflare R2 dashboard immediately.
   *
   * NOTE: R2 / S3 has NO real folder concept — a "folder" only becomes
   * visible once at least one object with that prefix key has been uploaded.
   */
  async ensureR2BucketExists(): Promise<void> {
    // 1. Ensure the bucket itself exists
    try {
      await this.r2Client.send(new HeadBucketCommand({ Bucket: this.r2BucketName }));
      this.logger.log(`✅ Cloudflare R2 bucket '${this.r2BucketName}' verified.`);
    } catch (err: any) {
      if (err?.name === 'NotFound' || err?.$metadata?.httpStatusCode === 404) {
        this.logger.warn(`R2 bucket '${this.r2BucketName}' not found — creating now...`);
        try {
          await this.r2Client.send(new CreateBucketCommand({ Bucket: this.r2BucketName }));
          this.logger.log(`✅ Created Cloudflare R2 bucket '${this.r2BucketName}'.`);
        } catch (createErr: any) {
          this.logger.error(`Failed to create R2 bucket: ${createErr.message}`, createErr.stack);
          return; // Cannot seed folders if bucket creation failed
        }
      } else {
        this.logger.warn(`Could not verify R2 bucket (network/credentials issue): ${err.message}`);
        return;
      }
    }

    // 2. Seed placeholder .keep objects so folders are visible in R2 dashboard
    //    R2/S3 has no real directory concept — an object with key 'products/.keep'
    //    is what makes the 'products/' folder show up in the UI.
    const folders = ['products', 'categories', 'marketing'];
    for (const folder of folders) {
      const keepKey = `${folder}/.keep`;
      try {
        // Check if placeholder already exists — avoid re-uploading every restart
        await this.r2Client.send(
          new HeadObjectCommand({ Bucket: this.r2BucketName, Key: keepKey }),
        );
        // If no error thrown, file exists — skip
      } catch {
        // File doesn't exist — upload the tiny placeholder
        try {
          await this.r2Client.send(
            new PutObjectCommand({
              Bucket: this.r2BucketName,
              Key: keepKey,
              Body: Buffer.from(''),
              ContentType: 'application/octet-stream',
              Metadata: { purpose: 'folder-placeholder', folder },
            }),
          );
          this.logger.log(`📁 Created R2 folder placeholder: ${folder}/`);
        } catch (putErr: any) {
          this.logger.warn(`Could not seed R2 folder '${folder}/': ${putErr.message}`);
        }
      }
    }

    this.logger.log(`✅ R2 folders ready: products/ | categories/ | marketing/`);
  }

  /**
   * Resolves the R2 folder path based on upload type string.
   * - 'product'   → 'products/'
   * - 'category'  → 'categories/'
   * - 'marketing' → 'marketing/'
   * Falls back to 'products/' for unknown types.
   */
  resolveFolder(type: string = 'product'): string {
    return ASSET_FOLDER_MAP[type.toLowerCase()] || 'products';
  }

  /**
   * Upload a public asset to Cloudflare R2 with folder routing.
   * Routes by 'type': product → products/, category → categories/, marketing → marketing/
   */
  async uploadPublicAsset(
    file: Express.Multer.File | { buffer: Buffer; originalname: string; mimetype?: string },
    type: 'product' | 'category' | 'marketing' = 'product',
  ): Promise<UploadResult> {
    const folder = this.resolveFolder(type);
    return this.uploadPublicProductImage(file, folder);
  }

  /**
   * Core R2 upload — uploads directly to a specific folder in Cloudflare R2.
   * Completely bypasses Cloudflare egress/bandwidth fees.
   */
  async uploadPublicProductImage(
    file: Express.Multer.File | { buffer: Buffer; originalname: string; mimetype?: string },
    folder: string = 'products',
  ): Promise<UploadResult> {
    const ext = file.originalname?.split('.').pop()?.toLowerCase() || 'jpg';
    const cleanFileName =
      file.originalname
        ?.replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 30) || 'image';

    const key = `${folder}/${Date.now()}-${cleanFileName}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const contentType = file.mimetype || 'image/jpeg';

    const command = new PutObjectCommand({
      Bucket: this.r2BucketName,
      Key: key,
      Body: file.buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    });

    try {
      await this.r2Client.send(command);
    } catch (err: any) {
      this.logger.error(`Cloudflare R2 upload failed: ${err.message}`, err.stack);
      throw new Error(`Failed to upload to Cloudflare R2: ${err.message}`);
    }

    // Build the public URL — either through relative API proxy or external CDN
    let publicUrl: string;
    const cleanKey = key.replace(/^\//, '');
    if (this.r2PublicDomain.startsWith('/')) {
      publicUrl = `${this.r2PublicDomain.replace(/\/$/, '')}/${cleanKey}`;
    } else {
      const baseUrl = this.r2PublicDomain.replace(/\/$/, '');
      publicUrl = baseUrl.startsWith('http')
        ? `${baseUrl}/${cleanKey}`
        : `https://${baseUrl}/${cleanKey}`;
    }

    this.logger.log(`Uploaded asset to R2 [${folder}/]: ${publicUrl}`);
    return { url: publicUrl, key, bucket: this.r2BucketName, folder };
  }

  /**
   * Upload a private customer invoice PDF to Supabase Storage (RLS protected).
   * Path format: customer-vault/invoices/{userId}/{orderId}.pdf
   * RLS policy: auth.uid()::text must match the {userId} path segment.
   */
  async uploadPrivateInvoice(
    fileBuffer: Buffer,
    userId: string,
    orderId: string,
    customFilename?: string,
  ): Promise<{ path: string; key: string; bucket: string }> {
    const filename = customFilename || `invoice-${orderId}.pdf`;
    // Folder structure mirrors RLS: invoices/{userId}/{filename}
    const key = `invoices/${userId}/${filename}`;

    const command = new PutObjectCommand({
      Bucket: this.customerVaultBucket,
      Key: key,
      Body: fileBuffer,
      ContentType: 'application/pdf',
      Metadata: {
        userId,
        orderId,
        uploadedAt: new Date().toISOString(),
      },
    });

    try {
      await this.supabaseS3Client.send(command);
    } catch (err: any) {
      this.logger.error(`Supabase Storage invoice upload failed: ${err.message}`, err.stack);
      throw new Error(`Failed to upload invoice to Supabase Storage: ${err.message}`);
    }

    const internalPath = `${this.customerVaultBucket}/${key}`;
    this.logger.log(`Uploaded private invoice: ${internalPath}`);

    return {
      path: internalPath,
      key,
      bucket: this.customerVaultBucket,
    };
  }

  /**
   * Upload a user profile avatar to Supabase Storage.
   * Path: user-profiles/avatars/{userId}/{filename}
   * RLS allows the owning user to upload/delete.
   */
  async uploadUserAvatar(
    fileBuffer: Buffer,
    userId: string,
    originalname: string,
    mimetype: string,
  ): Promise<{ url: string; key: string }> {
    const ext = originalname.split('.').pop()?.toLowerCase() || 'jpg';
    const key = `avatars/${userId}/avatar-${Date.now()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.userProfilesBucket,
      Key: key,
      Body: fileBuffer,
      ContentType: mimetype || 'image/jpeg',
      CacheControl: 'public, max-age=86400',
    });

    try {
      await this.supabaseS3Client.send(command);
    } catch (err: any) {
      this.logger.error(`Supabase avatar upload failed: ${err.message}`, err.stack);
      throw new Error(`Failed to upload avatar: ${err.message}`);
    }

    const rawSupabaseUrl = this.configService.get<string>('SUPABASE_URL') || '';
    const publicUrl = `${rawSupabaseUrl}/storage/v1/object/public/${this.userProfilesBucket}/${key}`;

    this.logger.log(`Uploaded avatar: ${publicUrl}`);
    return { url: publicUrl, key };
  }

  /**
   * Generate a secure time-limited presigned URL for private invoice downloads.
   * Default: 5-minute expiry. Guards against unauthorized URL sharing.
   */
  async getPresignedInvoiceUrl(key: string, expiresInSeconds = 300): Promise<string> {
    // Accept key with or without 'invoices/' prefix
    const normalizedKey = key.startsWith('invoices/') ? key : `invoices/${key}`;
    const command = new GetObjectCommand({
      Bucket: this.customerVaultBucket,
      Key: normalizedKey,
    });

    return getSignedUrl(this.supabaseS3Client, command, {
      expiresIn: expiresInSeconds,
    });
  }

  /**
   * Stream a public media object directly from Cloudflare R2.
   * Used by GET /shop/media/:folder/:file proxy endpoint.
   */
  async getR2Object(key: string): Promise<{ body: any; contentType?: string; contentLength?: number }> {
    const command = new GetObjectCommand({
      Bucket: this.r2BucketName,
      Key: key,
    });

    const response = await this.r2Client.send(command);
    return {
      body: response.Body,
      contentType: response.ContentType,
      contentLength: response.ContentLength,
    };
  }

  /** Expose bucket names for use in controllers / services */
  getR2BucketName(): string {
    return this.r2BucketName;
  }

  getCustomerVaultBucket(): string {
    return this.customerVaultBucket;
  }
}
