import { Controller, Get, HttpException, Post,Headers, HttpStatus } from '@nestjs/common';
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
  constructor(
    private readonly authServices: AuthService,
    private readonly s3Service: S3Service,
  ) {}



  @Post('login')
  async login(@Body() authPayloadDto: AuthPayloadDto) {
    try {
      const user = await this.authServices.validateUser(authPayloadDto);
      return await this.authServices.login(user);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }



  @Post('register')
  async signUpUser(@Body() userCreatDTO: UserCreateReq) {
    try {
      const existingUser = await this.authServices.findeByEmail(userCreatDTO.email);

      if (existingUser) {
        throw new HttpException('Email already registered', 401);
      }

      const userCreated = await this.authServices.createUserWithSubscription(userCreatDTO);
    
      return userCreated;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // Re-throw the original HttpException
      }
      throw new HttpException('Internal Server Error', 500); // Throw a generic internal server error for other cases
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
    const user = req.user;
    const newAccessToken = await this.authServices.generateNewAccessToken(user);
    return { accessToken: newAccessToken };
  }

  @Post('update-user')
   @UseGuards(JwtAuthGuard) 
  async updateUser(
     @Req() req: Request,
     @User() user: any,  
     @Body() updateData: UserUpdateReq) {
  try {
    const userId = user.user_id; 
    const updatedUser = await this.authServices.updateUser(userId, updateData);
    return updatedUser;
  } catch (error) {
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
  if(image.length){
    const bucketName = 'user-resources'; // The top-level bucket
    const fileUrlPrefix = process.env.S3_HOST|| 'http://localhost:12000';
    await this.s3Service.ensureBucketExists(bucketName);
    const originalName = iconv.decode(Buffer.from(image[0].originalname, 'binary'), 'utf8');
    await this.s3Service.uploadFile(bucketName, userId, originalName, image[0].buffer);
    newUrlIamge=`${fileUrlPrefix}/${bucketName}/${userId}/${originalName}`
  }
  const updateData={
    photoUrl:newUrlIamge
  }
 const updatedUser = await this.authServices.updateUserImage(userId, updateData);
 return updatedUser;
} catch (error) {
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
      const token = await this.authServices.oAuthLogin(req.user);
      res.redirect(`${FRONTEND_URL}/oauth?token=${token.jwt}`);
    
    } catch (err) {
      res.status(500).send({ success: false, message: err.message });
    }
  }


}
