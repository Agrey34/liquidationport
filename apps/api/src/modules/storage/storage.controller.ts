import {
  Controller,
  Get,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  Param,
  Res,
  BadRequestException,
  NotFoundException,
  UseGuards,
  Req,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService, ASSET_FOLDER_MAP } from './storage.service';
import { PrismaService } from '../../database/prisma.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { Request, Response } from 'express';
import { Readable } from 'stream';
import { UploadProductImageDto } from './dto/upload-product-image.dto';
import { UploadOrderInvoiceDto } from './dto/upload-order-invoice.dto';
import { IsOptional, IsString, IsIn } from 'class-validator';

/** DTO for type-routed public upload */
class UploadPublicAssetDto {
  @IsIn(['product', 'category', 'marketing'])
  type: 'product' | 'category' | 'marketing';

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  name?: string;
}

@Controller('shop')
export class StorageController {
  constructor(
    private readonly storageService: StorageService,
    private readonly prisma: PrismaService,
  ) {}

  // ────────────────────────────────────────────────────────────────────────────
  // POST /shop/admin/upload-public
  // Accepts a file + type ('product' | 'category' | 'marketing') and uploads
  // to the correct Cloudflare R2 folder. Returns absolute public URL.
  // ────────────────────────────────────────────────────────────────────────────
  @UseGuards(SupabaseAuthGuard)
  @Post('admin/upload-public')
  @UseInterceptors(FileInterceptor('image'))
  async uploadPublicAsset(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 15 * 1024 * 1024 })],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Body() body: UploadPublicAssetDto,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Uploaded file must be a valid image (JPEG, PNG, WebP, etc.)');
    }

    const validTypes = Object.keys(ASSET_FOLDER_MAP);
    const assetType = body.type || 'product';
    if (!validTypes.includes(assetType)) {
      throw new BadRequestException(
        `Invalid type '${assetType}'. Must be one of: ${validTypes.join(', ')}`,
      );
    }

    // Upload to Cloudflare R2 in the correct folder
    const uploadResult = await this.storageService.uploadPublicAsset(file, assetType);

    // Optionally attach image to an existing product
    if (body.productId && assetType === 'product') {
      const existing = await this.prisma.product.findUnique({
        where: { id: body.productId },
      });

      if (!existing) {
        throw new NotFoundException(`Product with ID ${body.productId} not found`);
      }

      await this.prisma.productMedia.create({
        data: {
          productId: body.productId,
          url: uploadResult.url,
          position: 0,
        },
      });
    }

    return {
      message: `Image uploaded to Cloudflare R2 successfully`,
      imageUrl: uploadResult.url,
      r2Key: uploadResult.key,
      folder: uploadResult.folder,
      bucket: uploadResult.bucket,
    };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // POST /shop/admin/product (legacy - kept for backward compatibility)
  // Receives an uploaded multipart image, uploads to Cloudflare R2 'products/'
  // ────────────────────────────────────────────────────────────────────────────
  @UseGuards(SupabaseAuthGuard)
  @Post('admin/product')
  @UseInterceptors(FileInterceptor('image'))
  async uploadProductImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 15 * 1024 * 1024 })],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Body() body: UploadProductImageDto,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Uploaded file must be a valid image');
    }

    // Upload to Cloudflare R2 'products/' folder
    const uploadResult = await this.storageService.uploadPublicProductImage(file, 'products');

    // Attach image to existing product if productId provided
    if (body.productId) {
      const existing = await this.prisma.product.findUnique({ where: { id: body.productId } });

      if (!existing) {
        throw new NotFoundException(`Product with ID ${body.productId} not found`);
      }

      const [, updatedProduct] = await this.prisma.$transaction(
        async (tx) => {
          const m = await tx.productMedia.create({
            data: { productId: body.productId!, url: uploadResult.url, position: 0 },
          });

          const p = await tx.product.update({
            where: { id: body.productId },
            data: { updatedAt: new Date() },
            include: { media: { orderBy: { position: 'asc' } }, category: true, variants: true },
          });

          return [m, p];
        },
        { maxWait: 15000, timeout: 20000 },
      );

      return {
        message: 'Product image uploaded to Cloudflare R2 and attached to product',
        imageUrl: uploadResult.url,
        r2Key: uploadResult.key,
        product: updatedProduct,
      };
    }

    // Create a new product draft if name + price provided
    if (body.name && body.price) {
      const rawPrice = parseFloat(body.price);
      const rawStock = body.stock ? parseInt(body.stock, 10) : 0;
      const slug = `${body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).substring(2, 8)}`;

      const newProduct = await this.prisma.$transaction(
        async (tx) => {
          return tx.product.create({
            data: {
              name: body.name!,
              slug,
              description: body.description || null,
              price: isNaN(rawPrice) ? 0 : rawPrice,
              stock: isNaN(rawStock) ? 0 : rawStock,
              categoryId: body.categoryId || null,
              media: { create: { url: uploadResult.url, position: 0 } },
            },
            include: { media: true, category: true, variants: true },
          });
        },
        { maxWait: 15000, timeout: 20000 },
      );

      return {
        message: 'Product created with Cloudflare R2 image',
        imageUrl: uploadResult.url,
        r2Key: uploadResult.key,
        product: newProduct,
      };
    }

    return {
      message: 'Image uploaded to Cloudflare R2 successfully',
      imageUrl: uploadResult.url,
      r2Key: uploadResult.key,
    };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // POST /shop/order/invoice
  // Receives/generates a PDF invoice and securely stores it in Supabase
  // Storage 'customer-vault' bucket at: invoices/{userId}/{orderId}.pdf
  // Protected by RLS: auth.uid()::text must match folder name.
  // ────────────────────────────────────────────────────────────────────────────
  @UseGuards(SupabaseAuthGuard)
  @Post('order/invoice')
  @UseInterceptors(FileInterceptor('file'))
  async uploadOrderInvoice(
    @Req() req: Request,
    @Body() body: UploadOrderInvoiceDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const { orderId } = body;
    if (!orderId) {
      throw new BadRequestException('orderId is required');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, user: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    const authenticatedUser = req['user'] as { sub?: string; id?: string } | undefined;
    const targetUserId =
      order.userId || body.userId || authenticatedUser?.sub || authenticatedUser?.id;

    if (!targetUserId) {
      throw new BadRequestException('Unable to resolve user ID for invoice path assignment');
    }

    let pdfBuffer: Buffer;

    if (file?.buffer) {
      pdfBuffer = file.buffer;
    } else if (body.invoiceBase64) {
      pdfBuffer = Buffer.from(body.invoiceBase64, 'base64');
    } else {
      const invoiceContent = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 85 >>\nstream\nBT\n/F1 24 Tf\n100 700 Td\n(INVOICE FOR ORDER ${order.id}) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000210 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n345\n%%EOF`;
      pdfBuffer = Buffer.from(invoiceContent, 'utf-8');
    }

    // Upload to Supabase Storage: customer-vault/invoices/{userId}/{orderId}.pdf
    const uploadResult = await this.storageService.uploadPrivateInvoice(
      pdfBuffer,
      targetUserId,
      orderId,
    );

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { updatedAt: new Date() },
      include: { items: true, user: true },
    });

    return {
      message: 'Invoice stored in Supabase Storage customer-vault with RLS protection',
      orderId: order.id,
      invoicePath: uploadResult.path,
      storageKey: uploadResult.key,
      bucket: uploadResult.bucket,
      order: updatedOrder,
    };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // GET /shop/media/:folder/:file
  // Streams any public product image from Cloudflare R2 with proper cache headers.
  // ────────────────────────────────────────────────────────────────────────────
  @Get('media/:folder/:file')
  async streamMediaFile(
    @Param('folder') folder: string,
    @Param('file') file: string,
    @Res() res: Response,
  ) {
    const key = `${folder}/${file}`;
    try {
      const obj = await this.storageService.getR2Object(key);
      res.setHeader('Content-Type', obj.contentType || 'image/jpeg');
      if (obj.contentLength) {
        res.setHeader('Content-Length', obj.contentLength);
      }
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Access-Control-Allow-Origin', '*');

      if (obj.body instanceof Readable) {
        obj.body.pipe(res);
      } else if (obj.body && typeof (obj.body as any).pipe === 'function') {
        (obj.body as any).pipe(res);
      } else if (obj.body && typeof (obj.body as any).transformToByteArray === 'function') {
        const byteArray = await (obj.body as any).transformToByteArray();
        res.end(Buffer.from(byteArray));
      } else {
        const stream = Readable.fromWeb(obj.body as any);
        stream.pipe(res);
      }
    } catch (err: any) {
      throw new NotFoundException(`Media file '${key}' not found in Cloudflare R2: ${err.message}`);
    }
  }
}
