import { Controller, Get, HttpException, Post,Headers, HttpStatus, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthPayloadDto, UserCreateReq, UserForgetPassReq, UserLoginReq, UserResetPassReq, UserUpdateReq } from './dtos/auth.dto';
import { Body, Req, Res, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common/decorators';
import { Response } from 'express';
import { Request } from 'express';
import { LocalGuard } from './guards/local.guard';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from './guards/jwt.guard';
import { RefreshTokenGuard } from './guards/refresh.guard';
import { GoogleOauthGuard } from './guards/google-oauth.guard';
import { User } from '../decorators/user.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { S3Service } from 'src/infrastructure/s3/s3.service';
import * as iconv from 'iconv-lite';


@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(
    private readonly authServices: AuthService,
    private readonly s3Service: S3Service,
  ) {}



  @Post('login')
  async login(@Body() authPayloadDto: AuthPayloadDto) {

    const { email } = authPayloadDto;

    try {
      this.logger.log(`Login attempt by user: ${email}`);
      
      const user = await this.authServices.validateUser(authPayloadDto);
      if (!user) {
        this.logger.warn(`Invalid login attempt by user, Email not found: ${email}`);
        throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
      }

      this.logger.log(`User ${email} logged in successfully`);
      return await this.authServices.login(user);
    } catch (error) {
      this.logger.error(`Unexpected error during login for user: ${email}`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }



  @Post('register')
  async signUpUser(@Body() userCreatDTO: UserCreateReq) {
    this.logger.log(`User registration attempt with email: ${userCreatDTO.email}`);
    try {
      const existingUser = await this.authServices.findeByEmail(userCreatDTO.email);

      if (existingUser) {
        this.logger.warn(`Registration failed: Email ${userCreatDTO.email} already registered`);
        throw new HttpException('Email already registered', 401);
      }

      const userCreated = await this.authServices.createUserWithSubscription(userCreatDTO);
    
      return userCreated;
    } catch (error) {
      this.logger.error(`Unexpected error during registration for email: ${userCreatDTO.email}`, error);
      if (error instanceof HttpException) {
        throw error; 
      }
      throw new HttpException('Internal Server Error', 500);
    }
  }


  @Get('auth-check')
  @UseGuards(JwtAuthGuard)
  async status(@Req() req: Request){
    return req.user
  };

  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  async refresh(@Req() req: any) {
    try {
      const user = req?.user;

      this.logger.log(`Token refresh attempt for user ID: ${user.id}`);

      const newAccessToken = await this.authServices.generateNewAccessToken(user);

      return { accessToken: newAccessToken };
    } catch (error) {

      this.logger.error(`Error during token refresh for user ID: ${req?.user?.id || 'unknown'}`, error.stack);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('update-user')
   @UseGuards(JwtAuthGuard) 
  async updateUser(
    @Req() req: Request,
    @User() user: any,
    @Body() updateData: UserUpdateReq
  ) {
    try {
      const userId = user.user_id;

      this.logger.log(`Update attempt for user ID: ${userId}`);

      const updatedUser = await this.authServices.updateUser(userId, updateData);

      return updatedUser;
    } catch (error) {

      this.logger.error(`Error updating user ID: ${user?.user_id || 'unknown'}`, error.stack);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
@Post('update-user/profileImage')
@UseGuards(JwtAuthGuard) 
@UseInterceptors(
  FilesInterceptor('image', 7),
)
async updateUserProfileImage(
  @UploadedFiles() image: any,
  @Req() req: Request,
  @User() user: any,  ) {
try {
  let newUrlIamge:string;
  const userId = user.user_id; 
  this.logger.log(`Profile image update attempt for user ID: ${userId}`);
  if(image.length){
    const bucketName = 'user-resources'; // The top-level bucket
    const fileUrlPrefix = process.env.S3_HOST|| 'http://localhost:12000';
    await this.s3Service.ensureBucketExists(bucketName);
    const originalName = iconv.decode(Buffer.from(image[0].originalname, 'binary'), 'utf8');
    await this.s3Service.uploadFile(bucketName, userId, originalName, image[0].buffer);
    this.logger.log(`Profile image uploaded successfully for user ID: ${userId}`);
    newUrlIamge=`${fileUrlPrefix}/${bucketName}/${userId}/${originalName}`
  }
  const updateData={
    photoUrl:newUrlIamge
  }
 const updatedUser = await this.authServices.updateUserImage(userId, updateData);
 return updatedUser;
} catch (error) {

  this.logger.error(`Error updating profile image for user ID: ${user?.user_id || 'unknown'}`, error);

  if (error instanceof HttpException) {
    throw error;
  }

  throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
}
}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {
    // Initiates the Google OAuth2 login flow
  }

  @Get('google/callback')
  @UseGuards(GoogleOauthGuard)
  async googleAuthCallback(@Req() req:any, @Res() res: Response) {
    const FRONTEND_URL =process.env.FRONT_URL;
    try {
      this.logger.log('OAuth callback received for user:', req.user?.id || 'unknown');
      const token = await this.authServices.oAuthLogin(req.user);
      
      const redirectUrl = `${FRONTEND_URL}/oauth?token=${token.jwt}`;
      this.logger.log(`Redirecting to: ${redirectUrl}`);

      res.redirect(redirectUrl);
    
    } catch (err) {
      // Log unexpected errors
      this.logger.error('Error processing OAuth callback', err.stack);

      // Send error response
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        success: false,
        message: 'An error occurred during authentication.',
      });
    }
  }


}
