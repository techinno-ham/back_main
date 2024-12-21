import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
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
      title: "عنوان",
      description: "توضیحات",
      name_active: true,
      name_placeholder: "مثال: نام خود را وارد کنید...",
      email_active: true,
      email_placeholder: "مثال: ایمیل خود را وارد کنید...",
      phone_active: true,
      phone_placeholder: "091211111111",
      message_end:"موفق امیز بود",
      message_url:""
  }

    try {
        const createdForm = await this.prismaService.forms.create({
          data: {
           bot_id:data.botId,
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
            where: {
              forms_id: formId,
              bot: {
                user_id: userId, 
              },
            },
            include: {
              bot: true, 
            },
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
      };


      async inactivateForm(formId: string, userId: string): Promise<boolean> {
        try {
          const form = await this.prismaService.forms.findFirst({
            where: {
              forms_id: formId,
              bot: {
                user_id: userId, 
              },
            },
            include: {
              bot: true, 
            },
          });
    
          if (!form) {
            return false;
          }
    
          await this.prismaService.forms.update({
            where: { forms_id: formId },
            data: { status: 'inactive' },
          });
    
          return true;
        } catch (error) {
          console.error('Error inactivating form:', error);
          return false;
        }
      };


      async activateForm(formId: string, userId: string): Promise<boolean> {
        try {
          const form = await this.prismaService.forms.findFirst({
            where: {
              forms_id: formId,
              bot: {
                user_id: userId,
              },
            },
            include: {
              bot: true, 
            },
          });
    
          if (!form) {
            return false;
          }
    
          await this.prismaService.forms.updateMany({
            where: {
              bot_id: form.bot_id,
            },
            data: { status: 'inactive' },
          });
    
          await this.prismaService.forms.update({
            where: { forms_id: formId },
            data: { status: 'active' },
          });
    
          return true;
        } catch (error) {
          console.error('Error activating form:', error);
          return false;
        }
      };


      async getFormById(formId: string, userId: string): Promise<any> {
        try {
          const form = await this.prismaService.forms.findFirst({
            where: {
              forms_id: formId,
              bot: {
                user_id: userId, 
              },
            }
          });
    
          return form || null; 
        } catch (error) {
          console.error('Error fetching form by ID:', error);
          throw error;
        }
      };


      async updateForm(formId: string, data: any, userId: string): Promise<any> {
        try {
          const form = await this.prismaService.forms.findFirst({
            where: {
              forms_id: formId,
              bot: { user_id: userId }, 
            },
          });
      
          if (!form) {
            return null; 
          }
      
          const updatedFields: any = {};
      
          if (data.forms_name !== undefined) updatedFields.forms_name = data.forms_name;
          if (data.showIf_human !== undefined) updatedFields.showIf_human = data.showIf_human;
          if (data.showIf_message !== undefined) updatedFields.showIf_message = data.showIf_message;
          if (data.showIf_message_number !== undefined) updatedFields.showIf_message_number = data.showIf_message_number;
          if (data.configs !== undefined) updatedFields.configs = data.configs;
      
          const updatedForm = await this.prismaService.forms.update({
            where: { forms_id: formId },
            data: updatedFields,
          });
      
          return updatedForm;
        } catch (error) {
          console.error('Error updating form:', error);
          throw error;
        }
      };
      async createContact(
        contactData: { name?: string; phone?: string; email?: string; form_id: string }
      ): Promise<any> {
        try {
          const form = await this.prismaService.forms.findFirst({
            where: {
              forms_id: contactData.form_id,
            },
          });
      
          if (!form) {
            throw new HttpException('Form not found or not authorized', HttpStatus.NOT_FOUND);
          }
      
          const newContact = await this.prismaService.contacts.create({
            data: {
              name: contactData.name ?? null,
              phone: contactData.phone ?? null,
              email: contactData.email ?? null,
              form_id: contactData.form_id,
              bot_id: form.bot_id,
            },
          });
      
          return newContact;
        } catch (error) {
          console.error('Error creating contact:', error);
          throw new Error('Failed to create contact');
        }
      };

      async getContactsByBotIdWithPagination(
        botId: string,
        userId: string,
        page: number,
        limit: number,
        search?: string 
      ): Promise<{ contacts: any[]; total: number }> {
        try {
          const bot = await this.prismaService.bots.findFirst({
            where: { bot_id: botId, user_id: userId },
          });
      
          if (!bot) {
            throw new HttpException('Bot not found or not authorized', HttpStatus.NOT_FOUND);
          }
      
          const where: any = { bot_id: botId };
      
          if (search) {
            where.OR = [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ];
          }
      
          const total = await this.prismaService.contacts.count({
            where,
          });
      
          // Fetch paginated results
          const contacts = await this.prismaService.contacts.findMany({
            where,
            skip: (page - 1) * limit,
            take: +limit,
            orderBy: { created_at: 'desc' },
          });
      
          return { contacts, total };
        } catch (error) {
          console.error('Error fetching paginated contacts:', error);
          throw error;
        }
      }

      async getContactsByFormIdWithPagination(
        formId: string,
        userId: string,
        page: number,
        limit: number
      ): Promise<any> {
        try {
          // Validate the form belongs to the user
          const form = await this.prismaService.forms.findFirst({
            where: { forms_id: formId, bot: { user_id: userId } },
            include: { bot: true },
          });
      
          if (!form) {
            throw new HttpException('Form not found or not authorized', HttpStatus.NOT_FOUND);
          }
      
          // Calculate skip and take based on the page and limit
          const skip = (page - 1) * limit;
          const take = limit;
      
          // Fetch contacts for the form with pagination
          const contacts = await this.prismaService.contacts.findMany({
            where: { form_id: formId },
            skip: skip,
            take: take,
            orderBy: { created_at: 'desc' }, // Optional: Order contacts by most recent
          });
      
          // Get the total number of contacts for pagination info
          const totalContacts = await this.prismaService.contacts.count({
            where: { form_id: formId },
          });
      
          // Return contacts along with pagination info
          return {
            data: contacts,
            pagination: {
              currentPage: page,
              totalPages: Math.ceil(totalContacts / limit),
              totalContacts: totalContacts,
              limit: limit,
            },
          };
        } catch (error) {
          console.error('Error fetching contacts by form ID with pagination:', error);
          throw error;
        }
      };

      async deleteContact(contactId: string, userId: string): Promise<boolean> {
        try {
          // Check if the contact belongs to the form associated with the user
          const contact = await this.prismaService.contacts.findFirst({
            where: {
              contact_id: contactId,
              form: {
                bot: {
                  user_id: userId, // Ensure the bot is associated with the user
                },
              },
            },
          });
      
          if (!contact) {
            return false; // Contact not found or user does not have permission
          }
      
          // Delete the contact
          await this.prismaService.contacts.delete({
            where: { contact_id: contactId },
          });
      
          return true;
        } catch (error) {
          console.error('Error deleting contact:', error);
          throw new HttpException('Failed to delete contact. Please try again later.', HttpStatus.INTERNAL_SERVER_ERROR);
        }
      };


      async updateContact(contactId: string, updateData: { name?: string; phone?: string; email?: string }, userId: string): Promise<any> {
        try {
          // Find the contact and ensure it belongs to the form associated with the user
          const contact = await this.prismaService.contacts.findFirst({
            where: {
              contact_id: contactId,
              form: {
                bot: {
                  user_id: userId, // Ensure the bot is associated with the user
                },
              },
            },
          });
      
          if (!contact) {
            return null; // Contact not found or user does not have permission
          }
      
          // Update the contact with the provided data
          const updatedContact = await this.prismaService.contacts.update({
            where: { contact_id: contactId },
            data: updateData,
          });
      
          return updatedContact;
        } catch (error) {
          console.error('Error updating contact:', error);
          throw new HttpException('Failed to update contact. Please try again later.', HttpStatus.INTERNAL_SERVER_ERROR);
        }
      }

  
};