import { Injectable, Logger } from '@nestjs/common';
import { S3Service } from '../s3/s3.service';
import { join } from 'path';
import { readFileSync } from 'fs';

@Injectable()
export class ChatbotAssetService {
  private readonly logger = new Logger(ChatbotAssetService.name);

  constructor(
    private readonly s3Service: S3Service,
  ) {}

  async uploadChatbotAsset(versionName: string) {
    const bucketName = 'widget';
    
    // Ensure the bucket exists
    await this.s3Service.ensureBucketExists(bucketName);
    
    // Check if the versionName prefix exists
    const prefixExists = await this.doesPrefixExist(bucketName, versionName);

    if (prefixExists) {
      this.logger.log(`Prefix ${versionName} already exists in bucket ${bucketName}.`);
    } else {
      this.logger.log(`Prefix ${versionName} does not exist in bucket ${bucketName}. Creating it now.`);
      await this.createPrefix(bucketName, versionName);
    }

    // Upload hamyarchat-embeded.js script
    await this.uploadFileIfNotExists(bucketName, versionName, 'hamyarchat-embeded.js');

    // Ensure sourceWidget folder exists and upload main.js and main.css
    const sourceWidgetPrefix = `${versionName}/sourceWidget`;
    await this.ensureSourceWidgetFolderExists(bucketName, sourceWidgetPrefix);
    await this.uploadFileIfNotExists(bucketName, sourceWidgetPrefix, 'main.js');
    await this.uploadFileIfNotExists(bucketName, sourceWidgetPrefix, 'main.css');


    
  }

  private async doesPrefixExist(bucketName: string, prefix: string): Promise<boolean> {
    try {
      const result = await this.s3Service.listObjectsWithPrefix(bucketName, `${prefix}/`);
      return result.Contents.length > 0;  // If there's any content, the prefix exists
    } catch (error) {
      this.logger.error(`Error checking prefix ${prefix} in bucket ${bucketName}`, error.stack);
      throw error;
    }
  }

  private async createPrefix(bucketName: string, prefix: string): Promise<void> {
    try {
      // Upload an empty object with a key ending in '/' to create a "folder"
      await this.s3Service.uploadFile(bucketName, '', `${prefix}/`, Buffer.alloc(0));
      this.logger.log(`Prefix ${prefix} created successfully in bucket ${bucketName}.`);
    } catch (error) {
      this.logger.error(`Error creating prefix ${prefix} in bucket ${bucketName}`, error.stack);
      throw error;
    }
  }

  private async uploadFileIfNotExists(bucketName: string, prefix: string, fileName: string): Promise<void> {
    const filePath = join(process.cwd(), 'chatbotAsset', prefix, fileName);
    const fileBuffer = readFileSync(filePath);
    const fileExists = await this.s3Service.fileExists(bucketName, `${prefix}/${fileName}`);

    if (!fileExists) {
      await this.s3Service.uploadFile(bucketName, '', `${prefix}/${fileName}`, fileBuffer);
      this.logger.log(`Uploaded ${fileName} to ${prefix}`);
    } else {
      this.logger.log(`${fileName} already exists in ${prefix}`);
    }
  }

  private async ensureSourceWidgetFolderExists(bucketName: string, sourceWidgetPrefix: string): Promise<void> {
    const sourceWidgetExists = await this.doesPrefixExist(bucketName, sourceWidgetPrefix);

    if (!sourceWidgetExists) {
      await this.createPrefix(bucketName, sourceWidgetPrefix);
    }
  }
}
