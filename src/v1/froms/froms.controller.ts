import { Controller, Post, Body, UseGuards, Delete, Param, HttpException, HttpStatus, Patch, Get } from '@nestjs/common';
import { FormsService } from './froms.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { User } from '../decorators/user.decorator';
import { CreatedInitFormDto } from './dtos/forms.dto';

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
  }






}