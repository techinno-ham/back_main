import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AppLoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    
    const { ip, method, originalUrl: url, query, body } = request;
    const userAgent = request.get('user-agent') || '';
    const startTime = Date.now();

    // Capture response body using a buffer
    const oldWrite = response.write;
    const oldEnd = response.end;
    const chunks: Buffer[] = [];

    // Override response.write to capture chunks
    response.write = (chunk: any, ...args: any[]) => {
      if (chunk && (typeof chunk === 'string' || Buffer.isBuffer(chunk))) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      return oldWrite.apply(response, [chunk, ...args]);
    };

    // Override response.end to capture the final chunk and log details
    //@ts-ignore
    response.end = (chunk: any, ...args: any[]) => {
      if (chunk && (typeof chunk === 'string' || Buffer.isBuffer(chunk))) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      
      const responseBody = Buffer.concat(chunks).toString('utf8');
      const contentLength = response.get('content-length') || '0';
      const { statusCode } = response;

      // Duration of the request
      const duration = Date.now() - startTime;

      // Log the request and response details
      // this.logger.log(
      //   `Method: ${method}, URL: ${url}, Status: ${statusCode}, Duration: ${duration}ms, Content-Length: ${contentLength}, Query: ${JSON.stringify(
      //     query
      //   )}, Request Body: ${JSON.stringify(body)}, Response Body: ${responseBody}, User-Agent: ${userAgent}, IP: ${ip}`
      // );
      this.logger.log(
        `Method: ${method}, URL: ${url}, Status: ${statusCode}, Duration: ${duration}ms, Content-Length: ${contentLength}, Query: ${JSON.stringify(
          query
        )}, User-Agent: ${userAgent}, IP: ${ip}`
      );

      // Ensure old end behavior is preserved
      oldEnd.apply(response, [chunk, ...args]);
    };

    next();
  }
}
