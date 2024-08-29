import { Controller, Get, HttpException, Post, Headers, HttpStatus } from '@nestjs/common';
import {
  Body,
  Delete,
  Ip,
  Param,
  Query,
  Req,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common/decorators';
import { MyBotsService } from './bots.service';
import { BotCreate, BotUpdateDataSource, CreateConversationDto } from './dtos/mybots.dto';

import { User } from '../decorators/user.decorator';
import { ChatSessionId } from '../decorators/chatSession.decorator';
import { Request, Response } from 'express';

import { FilesInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { cwd } from 'process';
import { chownSync, copyFileSync, existsSync, mkdirSync, readdirSync, renameSync, rmdirSync, unlinkSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { error } from 'console';
import { S3Service } from 'src/infrastructure/s3/s3.service';
import * as iconv from 'iconv-lite';

@Controller({
  path: 'mybots',
  version: '1',
})
export class MyBotsController {
  constructor(
    private readonly mybotsServices: MyBotsService,
    private readonly s3Service: S3Service,
  ) {}



  @Post('/create')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('files', 7),
  )
  async createBots(
    @UploadedFiles() files: any,
    @Body() botsDTO: BotCreate,
    @User() user?: any,
  ) {
    if (typeof botsDTO.urls === 'string') {
      try {
        botsDTO.urls = JSON.parse(botsDTO.urls);
      } catch (err) {
        throw new error('Invalid JSON format for urls');
      }
    };

    if (typeof botsDTO.qANDa_input === 'string') {
      try {
        botsDTO.qANDa_input = JSON.parse(botsDTO.qANDa_input);
      } catch (err) {
        throw new error('Invalid JSON format for urls');
      }
    }

    const createdBot = await this.mybotsServices.cretaeBots(user?.user_id);
    const data = {
      ...botsDTO,
      bot_id: createdBot.bot_id,
    };

    if (files?.length) {
      
      const bucketName = 'data-sources'; // The top-level bucket
      const botId = createdBot.bot_id;
      const fileUrlPrefix = process.env.IMAGE_URL_PREFIX || 'http://localhost:12000';
      const fileId = uuidv4();  // Generate a UUID for each file
      await this.s3Service.ensureBucketExists(bucketName); 
  
      const filesInfo = await Promise.all(
        files.map(async (file) => {
          const originalName = iconv.decode(Buffer.from(file.originalname, 'binary'), 'utf8');
      
          await this.s3Service.uploadFile(bucketName, botId, originalName, file.buffer);
          
          return {
            link: `${fileUrlPrefix}/${bucketName}/${botId}/${originalName}`,
            size: file.size,
            name: originalName,
            id: fileId,
        
          };
        }),
      );

  
      data['files_info'] = filesInfo;
    }
  

    const createdDataSource = await this.mybotsServices.createDataSource(data);

    return createdDataSource;
  };




  @Get('/list')
  @UseGuards(JwtAuthGuard)
  async getAllBots(
    @Query('page') pageNumber?: number,
    @Query('itemsPerPage') itemsPerPage?: number,
    @Query('type') type?: string,
    @User() user?: any,
  ) {
    return await this.mybotsServices.getAllBots(
      pageNumber,
      itemsPerPage,
      type,
      user.user_id,
    );
  };

  @Get('/count')
  @UseGuards(JwtAuthGuard)
  async countBots(@User() user: any) {
    try {
      const count = await this.mybotsServices.countBots(user.user_id);
      return { count };
    } catch (error) {
      throw new HttpException('Failed to retrieve bot count', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  

  @Post("/dataSource/update/:bot_id")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('files', 7),
  )
  async updateDataSource(
    @UploadedFiles() files: any,
    @Body() botsDTO: BotUpdateDataSource,
    @User() user?: any,
    @Param('bot_id') botId?:string
    
  ){
    if (typeof botsDTO.urls === 'string') {
      try {
        botsDTO.urls = JSON.parse(botsDTO.urls);
      } catch (err) {
        throw new error('Invalid JSON format for urls');
      }
    };

    if (typeof botsDTO.qANDa_input === 'string') {
      try {
        botsDTO.qANDa_input = JSON.parse(botsDTO.qANDa_input);
      } catch (err) {
        throw new error('Invalid JSON format for urls');
      }
    };


    const { uploadedFile: uploadedFileStr, ...data } = botsDTO;
   
    const result = await this.mybotsServices.findeDataSource(botId,user.user_id);
    let files_info = result.files_info;
     data['files_info']=files_info;

    // step 1 (check file delted ):
    let uploadedFile = [];
       if (botsDTO.uploadedFile) {
          uploadedFile = JSON.parse(botsDTO.uploadedFile);
      }
      if(uploadedFile.length > 0){
        for (const file of uploadedFile) {
          const {name, remove } = file;
          
          // // Check if file needs to be removed
          if (remove === "true" || remove==true) {
            try {
              const bucketName = 'data-sources';
              const key=`${botId}/${name}`
              await this.s3Service.deleteFile(bucketName, key);
            } catch (error) {
              throw new HttpException(`Failed to delete file ${name}`, 500);
            }
          }
        };
        data['files_info'] = files_info.filter(file => {
          const uploaded = uploadedFile.find(upFile => upFile.name === file.name && upFile.id==file.id);
          return !(uploaded && (uploaded.remove == "true" || uploaded.remove == true));
        });

      }
 


        if (files?.length > 0) {
          const bucketName = 'data-sources'; // The top-level bucket
          const bot_Id =botId;
          const fileUrlPrefix = process.env.IMAGE_URL_PREFIX || 'http://localhost:12000';
          const fileId = uuidv4();  // Generate a UUID for each file
          await this.s3Service.ensureBucketExists(bucketName);


          const filesInfo = await Promise.all(
            files.map(async (file) => {
              const originalName = iconv.decode(Buffer.from(file.originalname, 'binary'), 'utf8');
              await this.s3Service.uploadFile(bucketName,bot_Id, originalName, file.buffer);
              
              return {
                link: `${fileUrlPrefix}/${bucketName}/${bot_Id}/${originalName}`,
                size: file.size,
                name: originalName,
                id: fileId,
            
              };
            }),
          );
    
          data['files_info'] = [...data['files_info'],...filesInfo]

        };
       
     
        const updatedDataSource=await this.mybotsServices.updateDataSource(data,result.datasource_id);
        await this.mybotsServices.incrementUpdateDataSource(botId,user.user_id);
        return updatedDataSource;

       
  }


  @Get('/dataSource/:bot_id')
  @UseGuards(JwtAuthGuard)
  async getDataSourceBot(@Param('bot_id') botId: string,@User() user: any){
    try {
      const result = await this.mybotsServices.findeDataSource(botId,user.user_id);
      if (!result) {
        throw new HttpException('DataSource not found ...', 404);
      }
      return result;
    } catch (error) {
      throw new HttpException('Failed to get your DataSource', 500);
    }

  }


  @Get('/configs/:bot_id')
  @UseGuards(JwtAuthGuard)
  async getCinfigsBot(@Param('bot_id') botId: string,@User() user: any){
    try {
      const result = await this.mybotsServices.findeConfigs(botId,user.user_id);
      if (!result) {
        throw new HttpException('configs not found ...', 404);
      }
      return result;
    } catch (error) {
      throw new HttpException('Failed to get your configs', 500);
    }

  };

  @Post('/configs/updateGeneral/:bot_id')
@UseGuards(JwtAuthGuard)
async updateGeneralConfig(
  @Param('bot_id') botId: string,
  @User() user: any,
  @Body() updateData: { name: string },
) {
  try {
    const result = await this.mybotsServices.updateGeneralConfig(botId, user.user_id, updateData);
    if (!result) {
      throw new HttpException('Update failed', 404);
    }
    return result;
  } catch (error) {
    throw new HttpException('Failed to update your configs', 500);
  }
};

@Post('/configs/updateModel/:bot_id')
@UseGuards(JwtAuthGuard)
async updateModelConfig(
  @Param('bot_id') botId: string,
  @User() user: any,
  @Body() updateData: { model_name: string,Temperature:number },
) {
  try {
    const result = await this.mybotsServices.updateModelConfig(botId, user.user_id, updateData);
    if (!result) {
      throw new HttpException('Update failed', 404);
    }
    return result;
  } catch (error) {
    throw new HttpException('Failed to update your configs', 500);
  }
};
@Post('/configs/updateUi/:bot_id')
@UseGuards(JwtAuthGuard)
@UseInterceptors(
  FilesInterceptor('image', 7),
)
async updateUiConfig(
  @UploadedFiles() image: any,
  @Param('bot_id') botId: string,
  @User() user: any,
  @Body() updateData:any,
) {
  if (typeof updateData.greet_msgs === 'string') {
    try {
      updateData.greet_msgs = JSON.parse(updateData.greet_msgs);
    } catch (err) {
      throw new error('Invalid JSON format for urls');
    }
  };


  if (typeof updateData.action_btns === 'string') {
    try {
      updateData.action_btns = JSON.parse(updateData.action_btns);
    } catch (err) {
      throw new error('Invalid JSON format for urls');
    }
  };


  if(image.length){
    console.log("hereee")
    const bucketName = 'bot-resources'; // The top-level bucket
    const bot_Id = botId
    const fileUrlPrefix = process.env.S3_HOST|| 'http://localhost:12000';
    await this.s3Service.ensureBucketExists(bucketName);
    const originalName = iconv.decode(Buffer.from(image[0].originalname, 'binary'), 'utf8');
    await this.s3Service.uploadFile(bucketName, bot_Id, originalName, image[0].buffer);
    updateData["bot_image"]=`${fileUrlPrefix}/${bucketName}/${bot_Id}/${originalName}`
  }
  try {
    const result = await this.mybotsServices.updateUiConfig(botId, user.user_id, updateData);
    console.log(result)
    if (!result) {
      throw new HttpException('Update failed', 404);
    }
    return result;
  } catch (error) {
    throw new HttpException('Failed to update your configs', 500);
  }
};

@Post('/configs/updateSecurity/:bot_id')
@UseGuards(JwtAuthGuard)
async updateSecurityConfig(
  @Param('bot_id') botId: string,
  @User() user: any,
  @Body() updateData:any,
) {
  try {
    const result = await this.mybotsServices.updateSecurityConfig(botId, user.user_id, updateData);
    if (!result) {
      throw new HttpException('Update failed', 404);
    }
    return result;
  } catch (error) {
    throw new HttpException('Failed to update your configs', 500);
  }
};


  @Post(':botId/conversations')
  async createConversation(
    @Param('botId') botId: string,
    @Body() createConversationDto: CreateConversationDto,
    @ChatSessionId() sessionId: string,
    @Ip() userIP,
    @Res() res: Response,
  ) {
    const widgetVersion = createConversationDto.widgetVersion;
    //const userLocation = await this.getUserLocation(userIP); // Function to fetch user location from IP

    let currentSessionId = sessionId;
    let createConversation: {
      sessionId: string;
      conversationId: string;
    };
    if (!currentSessionId) {
      currentSessionId = uuidv4();
      createConversation = await this.mybotsServices.createConversation({
        botId,
        widgetVersion,
        sessionId: currentSessionId,
        userIP,
      });
      const oneDayMaxAge = 24 * 60 * 60 * 1000;
      res.cookie('session_id', currentSessionId, { maxAge: oneDayMaxAge });
    }

    return res.json({ conversationId: createConversation?.conversationId });
  }

  //@UseGuards(JwtAuthGuard)
  @Get(':botId/conversations')
  async getBotConversations(@Param('botId') botId: string, @Query('filter') filter?: any ) {
    return this.mybotsServices.getConversations(botId,"",filter);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':botId/conversations/:conversationId')
  async getBotConversationById(
    @Param('botId') botId: string,
    @Param('conversationId') conversationId: string,
  ) {
    return this.mybotsServices.getConversations(botId, conversationId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('list/:bot_id')
  async getBot(@Param('bot_id') botId: string, @User() user: any) {
    try {
      const result = await this.mybotsServices.findeBot(botId, user.user_id);
      if (!result) {
        throw new HttpException('Bot not found', 404);
      }
      return result;
    } catch (error) {
      throw new HttpException('Failed to get your bot', 500);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/delete/:bot_id')
  async deleteBot(@Param('bot_id') botId: string, @User() user: any) {
    try {
      const result = await this.mybotsServices.deleteBot(botId, user.user_id);
      if (result) {
        return { message: 'Bot deleted successfully' };
      } else {
        throw new HttpException('Bot not found or not authorized', 404);
      }
    } catch (error) {
      throw new HttpException('Failed to delete bot', 500);
    }
  }
}
