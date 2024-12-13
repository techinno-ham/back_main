import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@Injectable()
export class FormsService {

    constructor(
        private readonly prismaService: PrismaService,
      ) {}

      private generateRandomName(): string {
        const adjectives = [
          'UserFriendly',
          'Dynamic',
          'Interactive',
          'Smart',
          'Efficient',
          'Advanced',
          'Simple',
          'Responsive',
          'Custom',
          'Innovative',
        ];
        const nouns = [
          'Survey',
          'Feedback',
          'Application',
          'Request',
          'Form',
          'Registration',
          'Inquiry',
          'Report',
          'Order',
          'Poll',
        ];
    
        const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    
        return `${randomAdjective}${randomNoun}${Math.floor(Math.random() * 1000)}`; // Optional: Append a random number for uniqueness
      }

      async createInitForm(data: any) {

    const initConfigForm = {
        access_bot: "private",
        status_bot: "enable",
        rate_limit_msg: "20",
        rate_limit_time: "240",
        rate_limit_msg_show: "تعداد درخواست شما زیاد تر از استاندارد بات می باشد.",
      };

    try {
        const createdForm = await this.prismaService.forms.create({
          data: {
           bot_id:data.botId,
           status:"inactive",
           forms_name:this.generateRandomName(),
           configs:initConfigForm
          },
        });
  
        return createdForm;
      } catch (error) {
        console.log(error);
      }
    };

    async deleteForm(formId: string, userId: string): Promise<boolean> {
        try {
          const form = await this.prismaService.forms.findFirst({
            where: { forms_id:formId },
          });
          if (!form) {
            return false;
          }
    
          await this.prismaService.forms.delete({
            where: { forms_id: formId },
          });
    
          return true;
        } catch (error) {
          console.log(error);
          return false;
        }
      }

  
};