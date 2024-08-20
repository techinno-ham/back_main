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
async uploadFile(bucketName: string, Id: string, objectName: string, fileContent: Buffer): Promise<void> {
  const objectKey = `${Id}/${objectName}`;
  
  try {
    await this.s3.putObject({
      Bucket: bucketName,
      Key: objectKey,
      Body: fileContent,
    }).promise();
    this.logger.log(`File ${objectName} uploaded successfully to ${bucketName}/${objectKey}`);
  } catch (error) {
    this.logger.error(`Error uploading file ${objectName} to ${bucketName}/${objectKey}`, error.stack);
    throw error;
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
