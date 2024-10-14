import {
  Controller,
  Get,
  HttpException,
  Post,
  Headers,
  HttpStatus,
  Logger,
} from '@nestjs/common';
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
import {
  BotCreate,
  BotUpdateDataSource,
  CreateConversationDto,
} from './dtos/mybots.dto';

import { User } from '../decorators/user.decorator';
import { ChatSessionId } from '../decorators/chatSession.decorator';
import { Request, Response } from 'express';

import { FilesInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { cwd } from 'process';
import {
  chownSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  rmdirSync,
  unlinkSync,
} from 'fs';
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
  private readonly logger = new Logger(MyBotsController.name);
  constructor(
    private readonly mybotsServices: MyBotsService,
    private readonly s3Service: S3Service,
  ) {}

  @Post('/create')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 7))
  async createBots(
    @UploadedFiles() files: any,
    @Body() botsDTO: BotCreate,
    @User() user?: any,
  ) {
    this.logger.log(`Creating a bot for user: ${user?.user_id}`);
    if (typeof botsDTO.urls === 'string') {
      try {
        botsDTO.urls = JSON.parse(botsDTO.urls);
      } catch (err) {
        this.logger.error('Invalid JSON format for urls', err);
        throw new error('Invalid JSON format for urls');
      }
    }

    if (typeof botsDTO.qANDa_input === 'string') {
      try {
        botsDTO.qANDa_input = JSON.parse(botsDTO.qANDa_input);
      } catch (err) {
        this.logger.error('Invalid JSON format for qANDa_input', err);
        throw new HttpException(
          'Invalid JSON format for qANDa_input',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    try {
      const createdBot = await this.mybotsServices.cretaeBots(user?.user_id);
      const data = {
        ...botsDTO,
        bot_id: createdBot.bot_id,
      };

      this.logger.log(`Start uploading files for bot ID: ${createdBot.bot_id}`);

      if (files?.length) {
        const bucketName = 'data-sources'; // The top-level bucket
        const botId = createdBot.bot_id;
        const fileUrlPrefix =
          process.env.IMAGE_URL_PREFIX || 'http://localhost:12000';
        const fileId = uuidv4(); // Generate a UUID for each file
        await this.s3Service.ensureBucketExists(bucketName);

        const filesInfo = await Promise.all(
          files.map(async (file) => {
            const originalName = iconv.decode(
              Buffer.from(file.originalname, 'binary'),
              'utf8',
            );

            await this.s3Service.uploadFile(
              bucketName,
              botId,
              originalName,
              file.buffer,
            );
            this.logger.log(
              `Uploaded file ${originalName} for bot ID: ${botId}`,
            );

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

      const createdDataSource =
        await this.mybotsServices.createDataSource(data);
      this.logger.log(
        `Bot created successfully for user ID: ${user?.user_id}, bot ID: ${createdDataSource.bot_id}`,
      );

      return createdDataSource;
    } catch (error) {
      this.logger.error(
        `Error creating bot for user ID: ${user?.user_id || 'unknown'}`,
        error.stack,
      );

      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('/list')
  @UseGuards(JwtAuthGuard)
  async getAllBots(
    @Query('page') pageNumber?: number,
    @Query('itemsPerPage') itemsPerPage?: number,
    @Query('type') type?: string,
    @User() user?: any,
  ) {
    this.logger.log(
      `Fetching all bots for user ID: ${user?.user_id}, Page: ${pageNumber}, Items per page: ${itemsPerPage}, Type: ${type}`,
    );
    try {
      const bots = await this.mybotsServices.getAllBots(
        pageNumber,
        itemsPerPage,
        type,
        user?.user_id,
      );

      this.logger.log(
        `Successfully retrieved bots for user ID: ${user?.user_id}`,
      );
      return bots;
    } catch (error) {
      this.logger.error(
        `Error fetching bots for user ID: ${user?.user_id}`,
        error.stack,
      );

      throw new HttpException(
        'Error fetching bots',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('/count')
  @UseGuards(JwtAuthGuard)
  async countBots(@User() user: any) {
    this.logger.log(`Counting bots for user ID: ${user?.user_id}`);
    try {
 
      const count = await this.mybotsServices.countBots(user?.user_id);

      this.logger.log(`Successfully counted ${count} bots for user ID: ${user?.user_id}`);

      return { count };

    } catch (error) {
 
      this.logger.error(`Error counting bots for user ID: ${user?.user_id}`, error.stack);

      throw new HttpException(
        'Failed to retrieve bot count',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/dataSource/update/:bot_id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 7))
  async updateDataSource(
    @UploadedFiles() files: any,
    @Body() botsDTO: BotUpdateDataSource,
    @User() user?: any,
    @Param('bot_id') botId?: string,
  ) {
    this.logger.log(`Updating data source for bot ID: ${botId}, user ID: ${user?.user_id}`);
    if (typeof botsDTO.urls === 'string') {
      try {
        botsDTO.urls = JSON.parse(botsDTO.urls);
      } catch (err) {
        throw new error('Invalid JSON format for urls');
      }
    }

    if (typeof botsDTO.qANDa_input === 'string') {
      try {
        botsDTO.qANDa_input = JSON.parse(botsDTO.qANDa_input);
      } catch (err) {
        throw new error('Invalid JSON format for urls');
      }
    }

    const { uploadedFile: uploadedFileStr, ...data } = botsDTO;

    try{
    const result = await this.mybotsServices.findeDataSource(
      botId,
      user.user_id,
    );
    let files_info = result.files_info;
    data['files_info'] = files_info;

    // step 1 (check file delted ):
    let uploadedFile = [];
    if (botsDTO.uploadedFile) {
      uploadedFile = JSON.parse(botsDTO.uploadedFile);
    }
    if (uploadedFile.length > 0) {
      for (const file of uploadedFile) {
        const { name, remove } = file;

        // // Check if file needs to be removed
        if (remove === 'true' || remove == true) {
          try {
            const bucketName = 'data-sources';
            const key = `${botId}/${name}`;
            await this.s3Service.deleteFile(bucketName, key);
          } catch (error) {
            throw new HttpException(`Failed to delete file ${name}`, 500);
          }
        }
      }
      data['files_info'] = files_info.filter((file) => {
        const uploaded = uploadedFile.find(
          (upFile) => upFile.name === file.name && upFile.id == file.id,
        );
        return !(
          uploaded &&
          (uploaded.remove == 'true' || uploaded.remove == true)
        );
      });
    }

    if (files?.length > 0) {
      const bucketName = 'data-sources'; // The top-level bucket
      const bot_Id = botId;
      const fileUrlPrefix =
        process.env.IMAGE_URL_PREFIX || 'http://localhost:12000';
      const fileId = uuidv4(); // Generate a UUID for each file
      await this.s3Service.ensureBucketExists(bucketName);

      const filesInfo = await Promise.all(
        files.map(async (file) => {
          const originalName = iconv.decode(
            Buffer.from(file.originalname, 'binary'),
            'utf8',
          );
          await this.s3Service.uploadFile(
            bucketName,
            bot_Id,
            originalName,
            file.buffer,
          );

          return {
            link: `${fileUrlPrefix}/${bucketName}/${bot_Id}/${originalName}`,
            size: file.size,
            name: originalName,
            id: fileId,
          };
        }),
      );

      data['files_info'] = [...data['files_info'], ...filesInfo];
    }
    // change state odf bot to inprogress
    await this.mybotsServices.changeSatausBot(botId,"inProgress")

    const updatedDataSource = await this.mybotsServices.updateDataSource(
      botId,
      data,
      result.datasource_id,
    );
    await this.mybotsServices.incrementUpdateDataSource(botId, user.user_id);
    return updatedDataSource;
  }catch (error) {
    this.logger.error(`Error updating data source for bot ID: ${botId}`, error.stack);
    throw new HttpException('Failed to update data source', HttpStatus.INTERNAL_SERVER_ERROR);
  }
  }

  @Get('/dataSource/:bot_id')
  @UseGuards(JwtAuthGuard)
  async getDataSourceBot(@Param('bot_id') botId: string, @User() user: any) {
    this.logger.log(`Fetching data source for bot ID: ${botId}, user ID: ${user?.user_id}`);
    try {
      const result = await this.mybotsServices.findeDataSource(
        botId,
        user.user_id,
      );
      if (!result) {
        this.logger.warn(`Data source not found for bot ID: ${botId}, user ID: ${user?.user_id}`);
        throw new HttpException('DataSource not found', HttpStatus.NOT_FOUND);
      }
      return result;
    } catch (error) {
      // Log the error and throw an internal server error
      this.logger.error(`Failed to get data source for bot ID: ${botId}, user ID: ${user?.user_id}`, error.stack);
      throw new HttpException(`Failed to get datasource for bot ID: ${botId}, , user ID: ${user?.user_id}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('/configs/:bot_id')
  @UseGuards(JwtAuthGuard)
  async getBotConfig(@Param('bot_id') botId: string, @User() user: any) {
    this.logger.log(`Fetching configs for bot ID: ${botId}, user ID: ${user?.user_id}`);

    try {

      const result = await this.mybotsServices.findeConfigs(botId, user.user_id);
      if (!result) {
        this.logger.warn(`Configs not found for bot ID: ${botId}, user ID: ${user?.user_id}`);
        throw new HttpException('Configurations not found', HttpStatus.NOT_FOUND);
      }

      this.logger.log(`Successfully retrieved configs for bot ID: ${botId}, user ID: ${user?.user_id}`);
      return result;

    } catch (error) {
      this.logger.error(`Failed to retrieve configs for bot ID: ${botId}, user ID: ${user?.user_id}`, error.stack);
      throw new HttpException('Failed to retrieve bot configurations. Please try again later.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('/configs/updateGeneral/:bot_id')
  @UseGuards(JwtAuthGuard)
  async updateGeneralConfig(
    @Param('bot_id') botId: string,
    @User() user: any,
    @Body() updateData: { name: string },
  ) {
    this.logger.log(`Updating general config for bot ID: ${botId}, user ID: ${user?.user_id}`);

    try {
      // Attempt to update the general configuration
      const result = await this.mybotsServices.updateGeneralConfig(
        botId,
        user.user_id,
        updateData,
      );

      if (!result) {
        this.logger.warn(`Update failed for bot ID: ${botId}, user ID: ${user?.user_id}`);
        throw new HttpException('Update failed: Configuration not found', HttpStatus.NOT_FOUND);
      }

      this.logger.log(`Successfully updated general config for bot ID: ${botId}, user ID: ${user?.user_id}`);
      return result;

    } catch (error) {
      
      this.logger.error(`Failed to update general config for bot ID: ${botId}, user ID: ${user?.user_id}`, error.stack);
      throw new HttpException('Failed to update your configurations. Please try again later.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


  @Post('/configs/updateModel/:bot_id')
  @UseGuards(JwtAuthGuard)
  async updateModelConfig(
    @Param('bot_id') botId: string,
    @User() user: any,
    @Body() updateData: { model_name: string; Temperature: number },
  ) {
    this.logger.log(
      `Updating model config for bot ID: ${botId}, user ID: ${user?.user_id}. Model: ${updateData.model_name}, Temperature: ${updateData.Temperature}`,
    );

    try {

      const result = await this.mybotsServices.updateModelConfig(
        botId,
        user.user_id,
        updateData,
      );

      if (!result) {
        this.logger.warn(
          `Model config update failed for bot ID: ${botId}, user ID: ${user?.user_id}`,
        );
        throw new HttpException('Model configuration update failed: Configuration not found', HttpStatus.NOT_FOUND);
      }

      this.logger.log(
        `Successfully updated model config for bot ID: ${botId}, user ID: ${user?.user_id}. Model: ${updateData.model_name}, Temperature: ${updateData.Temperature}`,
      );
      return result;

    } catch (error) {

      this.logger.error(
        `Failed to update model config for bot ID: ${botId}, user ID: ${user?.user_id}. Error: ${error.message}`,
        error.stack,
      );
      throw new HttpException('Failed to update your model configuration. Please try again later.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  @Post('/configs/updateUi/:bot_id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('image', 7))
  async updateUiConfig(
    @UploadedFiles() image: any,
    @Param('bot_id') botId: string,
    @User() user: any,
    @Body() updateData: any,
  ) {
    this.logger.log(`Updating UI config for bot ID: ${botId}, user ID: ${user?.user_id}`);
    if (typeof updateData.greet_msgs === 'string') {
      try {
        updateData.greet_msgs = JSON.parse(updateData.greet_msgs);
      } catch (error) {
        this.logger.error('Invalid JSON format for greet_msgs', error);
        throw new HttpException('Invalid JSON format for greet_msgs', HttpStatus.BAD_REQUEST);
      }
    }

    if (typeof updateData.action_btns === 'string') {
      try {
        updateData.action_btns = JSON.parse(updateData.action_btns);
      } catch (err) {
        this.logger.error('Invalid JSON format for action_btns', err);
        throw new HttpException('Invalid JSON format for action_btns', HttpStatus.BAD_REQUEST);
      }
    }

    if (image?.length) {
      const bucketName = 'bot-resources'; // The top-level bucket
      const bot_Id = botId;
      const fileUrlPrefix = process.env.S3_HOST || 'http://localhost:12000';
      await this.s3Service.ensureBucketExists(bucketName);
      const originalName = iconv.decode(
        Buffer.from(image[0].originalname, 'binary'),
        'utf8',
      );
      await this.s3Service.uploadFile(
        bucketName,
        bot_Id,
        originalName,
        image[0].buffer,
      );
      updateData['bot_image'] =
        `${fileUrlPrefix}/${bucketName}/${bot_Id}/${originalName}`;
    }
    try {
      const result = await this.mybotsServices.updateUiConfig(
        botId,
        user.user_id,
        updateData,
      );
      if (!result) {
        this.logger.warn(`UI config update failed for bot ID: ${botId}`);
        throw new HttpException('UI configuration update failed: Configuration not found', HttpStatus.NOT_FOUND);
      }
      this.logger.log(`Successfully updated UI config for bot ID: ${botId}, user ID: ${user?.user_id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to update UI config for bot ID: ${botId}, user ID: ${user?.user_id}`, error.stack);
      throw new HttpException('Failed to update your UI configuration. Please try again later.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('/configs/updateSecurity/:bot_id')
  @UseGuards(JwtAuthGuard)
  async updateSecurityConfig(
    @Param('bot_id') botId: string,
    @User() user: any,
    @Body() updateData: any,
  ) {
    try {
      const result = await this.mybotsServices.updateSecurityConfig(
        botId,
        user.user_id,
        updateData,
      );
      if (!result) {
        throw new HttpException('Update failed', 404);
      }
      return result;
    } catch (error) {
      throw new HttpException('Failed to update your configs', 500);
    }
  }

  @Post(':botId/conversations')
  async createConversation(
    @Param('botId') botId: string,
    @ChatSessionId() sessionId: string, 
    @Ip() userIP: string,
    @Res() res: Response,
  ) {
    this.logger.log(`Creating conversation for bot ID: ${botId}, user IP: ${userIP}`);
    const widgetVersion = "v1.0.0";
  
    try {
      console.log(sessionId,"sessionId")
      if (!sessionId) {
        sessionId = uuidv4();  // Generate a new session ID
        const oneDayMaxAge = 7 * 24 * 60 * 60 * 1000;  // 1 day in milliseconds
        res.cookie('widget_session_id', sessionId, {
          maxAge: oneDayMaxAge,
          httpOnly: true,
          secure: true, 
        });
        this.logger.log(`New session ID created and set in cookie: ${sessionId}`);
      } else {
        this.logger.log(`Existing session ID found: ${sessionId}`);
      }
  
      // Create the conversation
      const createConversation = await this.mybotsServices.createConversation({
        botId,
        widgetVersion,
        sessionId: sessionId,
        userIP,
      });
  
      this.logger.log(`Conversation created successfully for bot ID: ${botId}, conversation ID: ${createConversation.conversationId}`);
      return res.json({ conversationId: createConversation.conversationId,sessionId:sessionId });
    } catch (error) {
      this.logger.error(`Error creating conversation for bot ID: ${botId}, user IP: ${userIP}`, error.stack);
      throw new HttpException('Failed to create conversation. Please try again later.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  //@UseGuards(JwtAuthGuard)
  @Get(':botId/conversations')
  async getBotConversations(
    @Param('botId') botId: string,
    @Query('filter') filter?: any,
  ) {
    this.logger.log(`Retrieving conversations for bot ID: ${botId} with filter: ${JSON.stringify(filter)}`);

    try {
      const conversations = await this.mybotsServices.getConversations(botId, '', filter);

      if (!conversations || conversations.length === 0) {
        this.logger.warn(`No conversations found for bot ID: ${botId}`);
        throw new HttpException('No conversations found', HttpStatus.NOT_FOUND);
      }

      this.logger.log(`Successfully retrieved ${conversations.length} conversations for bot ID: ${botId}`);
      return conversations;

    } catch (error) {
      this.logger.error(`Error retrieving conversations for bot ID: ${botId}`, error.stack);
      throw new HttpException('Failed to retrieve conversations. Please try again later.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


  @Get(':botId/conversations/session')
  async getConversationsBySessionId(
    @Param('botId') botId: string,
    @ChatSessionId() sessionId: string, 
  ) {
    this.logger.log(`Retrieving conversations for bot ID: ${botId}, session ID: ${sessionId}`);
  
    try {
      console.log(sessionId);
  
      if (!sessionId) {
        this.logger.warn(`No conversations found for bot ID: ${botId}, session ID: ${sessionId}`);
        return [];  // Return empty array instead of throwing exception
      }
    
      const conversations = await this.mybotsServices.getConversationsBySessionId(botId, sessionId);
      console.log(conversations);
  
      if (!conversations || conversations.length === 0) {
        this.logger.warn(`No conversations found for bot ID: ${botId}, session ID: ${sessionId}`);
        return [];  // Return empty array instead of throwing exception
      }
  
      this.logger.log(`Successfully retrieved ${conversations.length} conversations for bot ID: ${botId}, session ID: ${sessionId}`);
      return conversations;
  
    } catch (error) {
      this.logger.error(`Error retrieving conversations for bot ID: ${botId}, session ID: ${sessionId}`, error.stack);
      return [];  // Return empty array in case of any error
    }
  }
  

  @UseGuards(JwtAuthGuard)
  @Get(':botId/conversations/:conversationId')
  async getBotConversationById(
    @Param('botId') botId: string,
    @Param('conversationId') conversationId: string,
  ) {
    this.logger.log(`Retrieving conversation for bot ID: ${botId}, conversation ID: ${conversationId}`);

    try {
      const conversation = await this.mybotsServices.getConversations(botId, conversationId);

      if (!conversation) {
        this.logger.warn(`No conversation found for bot ID: ${botId}, conversation ID: ${conversationId}`);
        throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND);
      }

      this.logger.log(`Successfully retrieved conversation for bot ID: ${botId}, conversation ID: ${conversationId}`);
      return conversation;

    } catch (error) {
      this.logger.error(`Error retrieving conversation for bot ID: ${botId}, conversation ID: ${conversationId}`, error.stack);
      throw new HttpException('Failed to retrieve conversation. Please try again later.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('list/:bot_id')
  async getBot(@Param('bot_id') botId: string, @User() user: any) {
    this.logger.log(`Fetching bot with ID: ${botId} for user ID: ${user.user_id}`);

    try {
      const result = await this.mybotsServices.findeBot(botId, user.user_id);

      if (!result) {
        this.logger.warn(`Bot not found for ID: ${botId} and user ID: ${user.user_id}`);
        throw new HttpException('Bot not found', HttpStatus.NOT_FOUND);
      }

      this.logger.log(`Successfully retrieved bot for ID: ${botId}`);
      return result;

    } catch (error) {
      this.logger.error(`Error retrieving bot for ID: ${botId} and user ID: ${user.user_id}`, error.stack);
      throw new HttpException('Failed to get your bot. Please try again later.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/delete/:bot_id')
  async deleteBot(@Param('bot_id') botId: string, @User() user: any) {
    this.logger.log(`Attempting to delete bot with ID: ${botId} for user ID: ${user.user_id}`);

    try {
      const result = await this.mybotsServices.deleteBot(botId, user.user_id);

      if (result) {
        this.logger.log(`Successfully deleted bot with ID: ${botId}`);
        return { message: 'Bot deleted successfully' };
      } else {
        this.logger.warn(`Bot not found or not authorized for deletion: ${botId} by user ID: ${user.user_id}`);
        throw new HttpException('Bot not found or not authorized', HttpStatus.NOT_FOUND);
      }
      
    } catch (error) {
      this.logger.error(`Error deleting bot with ID: ${botId} for user ID: ${user.user_id}`, error.stack);
      throw new HttpException('Failed to delete bot. Please try again later.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
