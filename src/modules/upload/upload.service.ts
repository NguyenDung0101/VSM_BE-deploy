import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';

export type FileType = 'avatars' | 'events' | 'news' | 'hero' | 'gallery' | 'story';

@Injectable()
export class UploadService {
  private supabaseUrl: string;
  private supabaseKey: string;
  private serviceRoleKey: string;
  private storageClient;
  
  constructor(private configService: ConfigService) {
    this.supabaseUrl = this.configService.get<string>('SUPABASE_URL') || '';
    this.supabaseKey = this.configService.get<string>('SUPABASE_KEY') || '';
    this.serviceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    // Khởi tạo Supabase client với service role key để bypass RLS
    this.storageClient = createClient(
      this.supabaseUrl,
      this.serviceRoleKey || this.supabaseKey, // Sử dụng service role key nếu có
      {
        auth: {
          persistSession: false,
        }
      }
    ).storage;
  }

  async saveFile(file: Express.Multer.File, type: FileType): Promise<string> {
    try {
      console.log('Supabase URL:', this.supabaseUrl);
      console.log('File type:', type);
      console.log('Bucket:', this.getBucketForType(type));
      
      const bucket = this.getBucketForType(type);
      const ext = extname(file.originalname);
      const uniqueFilename = `${type}_${Date.now()}-${uuidv4().substring(0, 8)}${ext}`;
      
      console.log('Attempting to upload:', uniqueFilename);
      
      // Upload file to Supabase storage
      const { data, error } = await this.storageClient
        .from(bucket)
        .upload(uniqueFilename, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
          upsert: false,
        });
  
      if (error) {
        console.error('Supabase upload error details:', error);
        throw new Error(`Failed to upload file to Supabase: ${error.message}`);
      }
  
      console.log('Upload successful, data:', data);
  
      // Get public URL of the uploaded file
      const { data: urlData } = this.storageClient
        .from(bucket)
        .getPublicUrl(uniqueFilename);
  
      console.log('Public URL:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Parse the URL to extract the path
      const url = new URL(fileUrl);
      // The path should be something like /storage/v1/object/public/bucket/filename
      const pathSegments = url.pathname.split('/');
      
      // Extract bucket and filename - this may need adjustment based on your actual URL structure
      const bucket = pathSegments[pathSegments.length - 2];
      const filename = pathSegments[pathSegments.length - 1];
      
      if (!bucket || !filename) {
        throw new Error('Invalid file URL format');
      }

      // Delete the file from Supabase storage
      const { error } = await this.storageClient
        .from(bucket)
        .remove([filename]);

      if (error) {
        throw new Error(`Failed to delete file from Supabase: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      // If the URL parsing fails or deletion fails, we can log but not throw
      // This prevents errors when dealing with legacy URLs or testing
    }
  }
  
  private getBucketForType(type: FileType): string {
    switch (type) {
      case 'avatars':
        return 'avatars';
      case 'events':
        return 'events';
      case 'news':
        return 'news';
      case 'hero':
        return 'hero';
      case 'gallery':
        return 'gallery';
      case 'story':
        return 'story';
      default:
        return 'default';
    }
  }
}