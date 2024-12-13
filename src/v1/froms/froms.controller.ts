import { Controller, Post, Body, UseGuards } from '@nestjs/common';
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
  }

}