import { Controller, Post, Body, UseGuards, Delete, Param, HttpException, HttpStatus, Patch, Get, Query } from '@nestjs/common';
import { FormsService } from './froms.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { User } from '../decorators/user.decorator';
import { CreatedContactDto, CreatedInitFormDto } from './dtos/forms.dto';

@Controller({
    path: 'forms',
    version: '1',
  })
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Post('/create')
  @UseGuards(JwtAuthGuard)
  async createForms(
    @Body() createFormDto: CreatedInitFormDto,
    @User() user?: any,
) {
    return this.formsService.createInitForm(createFormDto);
  };

  @Patch('/update/:form_id')
  @UseGuards(JwtAuthGuard)
  async updateForm(
    @Param('form_id') formId: string,
    @Body() updateData: any,
    @User() user: any
  ){
    try {
      const updatedForm = await this.formsService.updateForm(formId, updateData, user.user_id);
  
      if (!updatedForm) {
        throw new HttpException('Form not found or not authorized', HttpStatus.NOT_FOUND);
      }
  
      return updatedForm;
    } catch (error) {
      console.error('Error updating form:', error);
      throw new HttpException('Failed to update the form. Please try again later.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete('/delete/:form_id')
  @UseGuards(JwtAuthGuard)
  async deleteForm(@Param('form_id') formId: string, @User() user: any){
    try {
        const result = await this.formsService.deleteForm(formId, user.user_id);
  
        if (result) {
          return { message: 'form deleted successfully' };
        } else {
          throw new HttpException('Form not found or not authorized', HttpStatus.NOT_FOUND);
        }
        
      } catch (error) {
        throw new HttpException('Failed to delete Form. Please try again later.', HttpStatus.INTERNAL_SERVER_ERROR);
      }
  };



  @Patch('/inactive/:form_id')
  @UseGuards(JwtAuthGuard)
  async inactiveForm(
    @Param('form_id') formId: string,
    @User() user: any
  ) {
    try {
      const result = await this.formsService.inactivateForm(formId, user.user_id);

      if (result) {
        return { message: 'Form inactivated successfully' };
      } else {
        throw new HttpException('Form not found or not authorized', HttpStatus.NOT_FOUND);
      }
    } catch (error) {
      throw new HttpException(
        'Failed to inactivate the form. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  };


  @Patch('/active/:form_id')
  @UseGuards(JwtAuthGuard)
  async activateForm(
    @Param('form_id') formId: string,
    @User() user: any
  ) {
    try {
      const result = await this.formsService.activateForm(formId, user.user_id);

      if (result) {
        return { message: 'Form activated successfully' };
      } else {
        throw new HttpException('Form not found or not authorized', HttpStatus.NOT_FOUND);
      }
    } catch (error) {
      throw new HttpException(
        'Failed to activate the form. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  };


  @Get('/:form_id')
  @UseGuards(JwtAuthGuard)
  async getFormById(
    @Param('form_id') formId: string,
    @User() user: any
  ) {
    try {
      const form = await this.formsService.getFormById(formId, user.user_id);

      if (!form) {
        throw new HttpException('Form not found or not authorized', HttpStatus.NOT_FOUND);
      }

      return form;
    } catch (error) {
      throw new HttpException(
        'Failed to fetch the form. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  };

  @Post('/contact')
  async createContact(
    @Body() contactData: CreatedContactDto,
  ) {
    try {
      const newContact = await this.formsService.createContact(contactData);
      return { message: 'Contact created successfully', data: newContact };
    } catch (error) {
      console.error('Error creating contact:', error);
      throw new HttpException('Failed to create contact. Please try again later.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  };

  @Get('/contacts/:bot_id')
  @UseGuards(JwtAuthGuard)
  async getContactsByBotId(
    @Param('bot_id') botId: string,
    @User() user: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string, // Single search parameter
  ) {
    try {
      const { contacts, total } = await this.formsService.getContactsByBotIdWithPagination(
        botId,
        user.user_id,
        page,
        limit,
        search 
      );
  
      return { data: contacts, total, page, limit };
    } catch (error) {
      console.error('Error fetching contacts by bot ID with pagination and search:', error);
      throw new HttpException('Failed to fetch contacts. Please try again later.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

@Delete('/contacts/:contact_id')
@UseGuards(JwtAuthGuard)
async deleteContact(
  @Param('contact_id') contactId: string,
  @User() user: any
) {
  try {
    const result = await this.formsService.deleteContact(contactId, user.user_id);
    if (result) {
      return { message: 'Contact deleted successfully' };
    } else {
      throw new HttpException('Contact not found or not authorized', HttpStatus.NOT_FOUND);
    }
  } catch (error) {
    console.error('Error deleting contact:', error);
    throw new HttpException('Failed to delete contact. Please try again later.', HttpStatus.INTERNAL_SERVER_ERROR);
  }
};


@Patch('/contacts/:contact_id')
@UseGuards(JwtAuthGuard)
async updateContact(
  @Param('contact_id') contactId: string,
  @Body() updateData: { name?: string; phone?: string; email?: string }, // You can add more fields as necessary
  @User() user: any
) {
  try {
    const updatedContact = await this.formsService.updateContact(contactId, updateData, user.user_id);
    
    if (updatedContact) {
      return { message: 'Contact updated successfully', data: updatedContact };
    } else {
      throw new HttpException('Contact not found or not authorized', HttpStatus.NOT_FOUND);
    }
  } catch (error) {
    console.error('Error updating contact:', error);
    throw new HttpException('Failed to update contact. Please try again later.', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}



@Get('/contacts/form/:form_id')
@UseGuards(JwtAuthGuard)
async getContactsByFormId(
  @Param('form_id') formId: string,
  @Query('page') page: number = 1,  
  @Query('limit') limit: number = 10,  
  @User() user: any
) {
  try {
    const contacts = await this.formsService.getContactsByFormIdWithPagination(formId, user.user_id, page, limit);
    return { data: contacts };
  } catch (error) {
    console.error('Error fetching contacts by form ID with pagination:', error);
    throw new HttpException('Failed to fetch contacts. Please try again later.', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}



};