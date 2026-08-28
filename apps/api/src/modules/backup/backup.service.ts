import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class BackupService {
  private supabaseAdmin;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.supabaseAdmin = createClient(
      this.configService.get<string>('SUPABASE_URL') || '',
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || '',
      { auth: { persistSession: false } }
    );
  }

  async triggerBackup() {
    try {
      // 1. Query all tables in public schema
      const tables = await this.prisma.$queryRaw<{ table_name: string }[]>`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          AND table_name NOT IN ('_prisma_migrations')
      `;

      const backupData: Record<string, any[]> = {};

      // 2. Fetch rows from each table
      for (const { table_name } of tables) {
        const rows = await this.prisma.$queryRawUnsafe(`SELECT * FROM public."${table_name}"`);
        backupData[table_name] = rows as any[];
      }

      // 3. Ensure "backups" private storage bucket exists
      const { data: buckets, error: listError } = await this.supabaseAdmin.storage.listBuckets();
      if (listError) throw listError;
      
      const bucketExists = buckets?.some(b => b.name === 'backups');
      if (!bucketExists) {
        const { error: createError } = await this.supabaseAdmin.storage.createBucket('backups', {
          public: false,
          fileSizeLimit: 52428800 // 50MB
        });
        if (createError) throw createError;
      }

      // 4. Upload JSON backup file
      const filename = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      const buffer = Buffer.from(JSON.stringify(backupData, null, 2));

      const { error: uploadError } = await this.supabaseAdmin.storage
        .from('backups')
        .upload(filename, buffer, {
          contentType: 'application/json',
          upsert: true
        });

      if (uploadError) throw uploadError;

      return {
        message: 'Database backup successfully created and uploaded to secure storage.',
        filename,
        sizeBytes: buffer.length,
      };
    } catch (err) {
      console.error('Backup creation failed:', err);
      throw new InternalServerErrorException(`Backup failed: ${err.message}`);
    }
  }

  async restoreFromBackup(filename: string) {
    try {
      // 1. Download backup file from secure storage
      const { data, error: downloadError } = await this.supabaseAdmin.storage
        .from('backups')
        .download(filename);

      if (downloadError) throw downloadError;

      const jsonStr = await data.text();
      const backupData = JSON.parse(jsonStr) as Record<string, any[]>;

      // 2. Perform restoration in a single transaction
      await this.prisma.$transaction(async (tx) => {
        // Disable foreign keys and triggers temporarily for restoring without constraint conflicts
        await tx.$executeRaw`SET session_replication_role = 'replica';`;

        try {
          for (const [tableName, rows] of Object.entries(backupData)) {
            // Clean table first
            await tx.$executeRawUnsafe(`TRUNCATE TABLE public."${tableName}" CASCADE;`);

            if (!rows || rows.length === 0) continue;

            // Restore rows
            for (const row of rows) {
              const keys = Object.keys(row);
              const values = Object.values(row);

              const columns = keys.map(k => `"${k}"`).join(', ');
              const placeholders = keys.map((_, idx) => `$${idx + 1}`).join(', ');

              await tx.$executeRawUnsafe(
                `INSERT INTO public."${tableName}" (${columns}) VALUES (${placeholders})`,
                ...values
              );
            }
          }
        } finally {
          // Re-enable triggers and foreign keys
          await tx.$executeRaw`SET session_replication_role = 'origin';`;
        }
      });

      return {
        message: 'Database successfully restored to the snapshot.',
        filename,
      };
    } catch (err) {
      console.error('Database restore failed:', err);
      throw new InternalServerErrorException(`Restore failed: ${err.message}`);
    }
  }

  async listBackups() {
    try {
      const { data, error } = await this.supabaseAdmin.storage
        .from('backups')
        .list('', {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('List backups failed:', err);
      throw new InternalServerErrorException(`Failed to retrieve backups: ${err.message}`);
    }
  }
}
