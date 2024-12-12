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
import { ChatSessionId } from '../decorators/chatSession.decorator';
import { v4 as uuidv4 } from 'uuid';
import { LiveService } from './live.service';

@Controller('live')
export class LiveController {
    private readonly logger = new Logger(LiveController.name);

    constructor(
        private readonly liveService: LiveService,
    ){}

    @Post('/request-chat')
    async requestLiveConversation(
      @Param('botId') botId: string,
      @ChatSessionId() sessionId: string, 
      @Ip() userIP: string,
      @Res() res: Response,
    ) {
      this.logger.log(`Creating conversation for bot ID: ${botId}, user IP: ${userIP}`);

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

    //SORT BY TIME
    @Get('/history')
    async fetchLiveConversationHistory(){}

    //CHECK IF CONV EXISTS FOR SECRITY
    @Post('/message/user')
    async receiveUserMessage(){}

    //CHECK IF CONV EXISTS FOR SECRITY
    @Post('/message/operator')
    async receiveOperatorMessage(){}

    //SORT BY TIME
    @Get('/messages/user')
    async fetchUserMessage(){}

    //SORT BY TIME
    @Get('/messages/operator')
    async fetchOperatorMessage(){}

    //FETCH CONVERSATION IDS THAT HAVE LIVE CHAT - SHOWING ACTIVE LIVE IN PANEL
    @Get('/conversation-ids')
    async fetchBotLiveConversations(){}
}

