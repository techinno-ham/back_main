import { Controller, Post, Body, UseGuards, Delete, Param, HttpException, HttpStatus } from '@nestjs/common';
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
  }



}