import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';

interface payloadJWT {
  userId: string;
  botId: string;
  iat: number;
  exp: number;
  sub:any
}
@Injectable()
export class WidgetService {
  constructor(
    private readonly prismaService: PrismaService,
    private jwtService: JwtService,) {}
   
  private generateChecksum(botId: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(botId)
      .digest('hex')
      .slice(0, 8); // Shorter checksum for brevity
  }



  private decodeToken(token: string): { botId: string, isValid: boolean } {
    const secret = process.env.TOKEN_SECRET || 'defaultSecret';
    const decodedToken = Buffer.from(token, 'base64').toString('utf8');
    const [botId, checksum] = decodedToken.split('.');
    
    const expectedChecksum = this.generateChecksum(botId, secret);
    const isValid = expectedChecksum === checksum;
    
    return { botId, isValid };
  }
  private _toCamelCase(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((v) => this._toCamelCase(v));
    } else if (obj !== null && obj.constructor === Object) {
      return Object.keys(obj).reduce((result, key) => {
        const camelKey = key.replace(/_([a-z])/g, (_, char) =>
          char.toUpperCase(),
        );
        result[camelKey] = this._toCamelCase(obj[key]);
        return result;
      }, {} as any);
    }
    return obj;
  }

  async getCollectionNameService(token: string) {
    const decoded = this.decodeToken(token);

    if (!decoded.isValid || !decoded.botId) {
      throw new UnauthorizedException('Invalid or expired token.');
    }

    return {
      collection: decoded.botId,
    };
  }
  async generateWidgetTokenService({
    userId,
    botId,
  }: {
    userId: string;
    botId: string;
  }) {
    const payload = { userId, botId };

    const token = await jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: 81000,
    });

    return token;
  }
  async getBotConfigService({ botId }: { botId: string }) {
    console.log(botId)
    const foundBotConfig = await this.prismaService.bots.findFirst({
      where: {
        bot_id: botId,
      },
      select: {
        general_configs: true,
        model_configs: true,
        ui_configs: true,
        security_configs: true,
        status:true
      },
    });
    console.log(foundBotConfig)

    return this._toCamelCase(foundBotConfig);
  }
}
