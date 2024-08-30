import { Injectable, Logger } from '@nestjs/common';
import * as AWS from 'aws-sdk';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3: AWS.S3;

  constructor() {
    this.s3 = new AWS.S3({
      endpoint: process.env.S3_HOST,  
      accessKeyId:process.env.S3_USER,  
      secretAccessKey: process.env.S3_PASSWORD,  
      s3ForcePathStyle: true, 
      signatureVersion: 'v4',
    });
  }

  async listObjectsWithPrefix(bucketName: string, prefix: string): Promise<AWS.S3.ListObjectsV2Output> {
    try {
      const params = {
        Bucket: bucketName,
        Prefix: prefix,
      };
      const data = await this.s3.listObjectsV2(params).promise();
      return data;
    } catch (error) {
      this.logger.error(`Error listing objects with prefix ${prefix} in bucket ${bucketName}`, error.stack);
      throw error;
    }
  }

  async createBucket(bucketName: string): Promise<void> {
    try {
      await this.s3.createBucket({ Bucket: bucketName }).promise();
      this.logger.log(`Bucket ${bucketName} created successfully`);
    } catch (error) {
      this.logger.error(`Error creating bucket ${bucketName}`, error.stack);
      throw error;
    }
  }
  async ensureBucketExists(bucketName: string): Promise<void> {
    try {
      // Check if the bucket exists
      await this.s3.headBucket({ Bucket: bucketName }).promise();
      this.logger.log(`Bucket ${bucketName} already exists.`);
    } catch (error) {
      if (error.code === 'NotFound') {
        // Bucket does not exist, so create it
        await this.createBucket(bucketName);
      } else {
        // Handle other potential errors
        this.logger.error(`Error checking bucket ${bucketName}`, error.stack);
        throw error;
      }
    }
  }
  async fileExists(bucketName: string, key: string): Promise<boolean> {
    try {
      await this.s3.headObject({ Bucket: bucketName, Key: key }).promise();
      return true; // File exists
    } catch (error) {
      if (error.code === 'NotFound') {
        return false; // File does not exist
      }
      this.logger.error(`Error checking file ${key} in bucket ${bucketName}`, error.stack);
      throw error; // Rethrow the error for further handling
    }
  }
async uploadFile(bucketName: string, Id: string, objectName: string, fileContent: Buffer): Promise<void> {
  const objectKey = `${Id}/${objectName}`;
  const contentType = this.getContentType(objectName);
  
  try {
    await this.s3.putObject({
      Bucket: bucketName,
      Key: objectKey,
      Body: fileContent,
      ContentType: contentType 
    }).promise();
    this.logger.log(`File ${objectName} uploaded successfully to ${bucketName}/${objectKey}`);
  } catch (error) {
    this.logger.error(`Error uploading file ${objectName} to ${bucketName}/${objectKey}`, error.stack);
    throw error;
  }
}
private getContentType(fileName: string): string {
  const extension = fileName.split('.').pop().toLowerCase();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'svg':
      return 'image/svg+xml';
    case 'gif':
      return 'image/gif';
    case 'js': // Add this case for JavaScript files
      return 'application/javascript';
      case 'css':
        return 'text/css'; // Correct MIME type for CSS files
    default:
      return 'application/octet-stream'; // Default to binary stream if unknown
  }
}
  async downloadFile(bucketName: string, objectName: string, downloadPath: string): Promise<void> {
    try {
      const data = await this.s3.getObject({
        Bucket: bucketName,
        Key: objectName,
      }).promise();
      require('fs').writeFileSync(downloadPath, data.Body);
      this.logger.log(`File ${objectName} downloaded successfully from ${bucketName}`);
    } catch (error) {
      this.logger.error(`Error downloading file ${objectName} from ${bucketName}`, error.stack);
      throw error;
    }
  }

  async deleteFile(bucketName: string, key: string): Promise<void> {
    try {
      await this.s3.deleteObject({
        Bucket: bucketName,
        Key: key,
      }).promise();
      this.logger.log(`File ${key} deleted successfully from ${bucketName}`);
    } catch (error) {
      this.logger.error(`Error deleting file ${key} from ${bucketName}`, error.stack);
      throw error;
    }
  }
}
