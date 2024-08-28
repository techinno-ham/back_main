import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { JwtService } from '@nestjs/jwt';

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
    private async _decodeWidgetTokenService(token: string) {
      try {
          const payload = await this.jwtService.verify(token);
          return payload;
      } catch (error) {
          throw new UnauthorizedException('Token verification failed.');
      }
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
    const decoded = await this._decodeWidgetTokenService(token);
    if (!decoded || !decoded.sub?.botId) {
        throw new UnauthorizedException('Invalid or expired token.');
    }

    return {
        collection: decoded.sub.botId,
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
