import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
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
      const payload = (await this.jwtService.verify(
        token,
      )) ;
      if (!payload) {
        return null;
      }
      return payload;
    } catch (error) {
      return null;
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
    return {
      collection: decoded?.sub.botId,
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

    return this._toCamelCase(foundBotConfig);
  }
}
