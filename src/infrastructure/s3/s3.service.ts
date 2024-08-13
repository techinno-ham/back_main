import { Injectable, Logger } from '@nestjs/common';
import * as AWS from 'aws-sdk';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3: AWS.S3;

  constructor() {
    this.s3 = new AWS.S3({
      endpoint: 'http://84.46.250.91:9000',  // Replace with your MinIO or S3 endpoint
      accessKeyId: 'admin',  // Replace with your access key
      secretAccessKey: 'admin123',  // Replace with your secret key
      s3ForcePathStyle: true, // Needed for MinIO or non-AWS S3
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

  async uploadFile(bucketName: string, objectName: string, filePath: string): Promise<void> {
    try {
      const fileContent = require('fs').readFileSync(filePath);
      await this.s3.putObject({
        Bucket: bucketName,
        Key: objectName,
        Body: fileContent,
      }).promise();
      this.logger.log(`File ${objectName} uploaded successfully to ${bucketName}`);
    } catch (error) {
      this.logger.error(`Error uploading file ${objectName} to ${bucketName}`, error.stack);
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
}
