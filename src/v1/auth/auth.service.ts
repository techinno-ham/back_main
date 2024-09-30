import { Injectable, Inject, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import {
  AuthPayloadDto,
  UserCreateReq,
  UserEntity,
  UserForgetPassReq,
  UserResetPassReq,
  UserUpdateReq,
} from './dtos/auth.dto';
// import { JwtService } from '@nestjs/jwt';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { Redis } from 'ioredis';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import * as dayjs from 'dayjs'
// import { userType } from '@prisma/client';

interface payloadJWT {
  username: string;
  user_type: any;
  iat: number;
  exp: number;
};



@Injectable()
export class AuthService {
  private readonly SERVICE = 'AuthService';
  constructor(
    private readonly prismaService: PrismaService,
    private jwtService: JwtService,
    private readonly logger: Logger,

  ) { }

  async creatUser({ name, lastName, email, password, photoUrl }: UserCreateReq): Promise<UserEntity> {
    try {
      this.logger.log(`Creating user with email ${email}`, this.SERVICE);
      const passwordHash = await bcrypt.hash(password, process.env.SALT_BCRYPT);
      const createdUser = await this.prismaService.users.create({
        data: {
          name,
          lastName,
          email,
          passwordHash,
          photoUrl,
        },
      });
      this.logger.log(`User created successfully - ${createdUser.user_id}`, this.SERVICE);
      return new UserEntity(createdUser);
    } catch (error) {
      this.logger.error('Failed to create user', error.stack, this.SERVICE);
      throw new HttpException('Failed to create user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async createUserWithSubscription({ name, lastName, email, password }: UserCreateReq): Promise<UserEntity> {
    try {
      this.logger.log(`Creating user with subscription for email ${email}`, this.SERVICE);
      const passwordHash = await bcrypt.hash(password, process.env.SALT_BCRYPT);
      const userId = uuidv4();
      const subscriptionId = uuidv4();
      const photoUrl = `${process.env.CDN_URL}/user-resources/defaultProfile/profile.svg`;

      const createUser = this.prismaService.users.create({
        data: {
          user_id: userId,
          name,
          lastName,
          email,
          passwordHash,
          photoUrl,
          activeSubscriptionId: subscriptionId,
        },
      });

      const startDate = dayjs();
      const endDate = startDate.add(30, 'day');
      const formattedStartDate = startDate.toISOString();
      const formattedEndDate = endDate.toISOString();

      const createSubscription = this.prismaService.subscription.create({
        data: {
          id: subscriptionId,
          tier_id: 0,
          user_id: userId,
          start_date: formattedStartDate,
          end_date: formattedEndDate,
        },
      });

      const [createdUser] = await this.prismaService.$transaction([createUser, createSubscription]);

      this.logger.log(`User with subscription created successfully - ${createdUser.user_id}`, this.SERVICE);
      return new UserEntity(createdUser);
    } catch (error) {
      this.logger.error('Failed to create user with subscription', error.stack, this.SERVICE);
      throw new HttpException('Failed to create user with subscription', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async createUserWithSubscriptionGoogle(userInfo:any): Promise<UserEntity> {
    try {
      this.logger.log(`Creating user with subscription for email ${userInfo.email}`, this.SERVICE);
      const passwordHash = await bcrypt.hash("12345678!@", process.env.SALT_BCRYPT);
      const userId = uuidv4();
      const subscriptionId = uuidv4();
      const photoUrl = userInfo.picture

      const createUser = this.prismaService.users.create({
        data: {
          user_id: userId,
          name:userInfo.name,
          lastName:userInfo.lastName,
          email:userInfo.email,
          passwordHash,
          photoUrl,
          activeSubscriptionId: subscriptionId,
        },
      });

      const startDate = dayjs();
      const endDate = startDate.add(30, 'day');
      const formattedStartDate = startDate.toISOString();
      const formattedEndDate = endDate.toISOString();

      const createSubscription = this.prismaService.subscription.create({
        data: {
          id: subscriptionId,
          tier_id: 0,
          user_id: userId,
          start_date: formattedStartDate,
          end_date: formattedEndDate,
        },
      });

      const [createdUser] = await this.prismaService.$transaction([createUser, createSubscription]);

      this.logger.log(`User with subscription created successfully - ${createdUser.user_id}`, this.SERVICE);
      return new UserEntity(createdUser);
    } catch (error) {
      this.logger.error('Failed to create user with subscription', error.stack, this.SERVICE);
      throw new HttpException('Failed to create user with subscription', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findeByEmail(email: string): Promise<UserEntity | undefined> {
    try {
      this.logger.log(`Finding user by email ${email}`, this.SERVICE);
      const user = await this.prismaService.users.findFirst({
        where: { email },
      });
      if (user) {
        this.logger.log(`User found - ${user.user_id}`, this.SERVICE);
        return new UserEntity(user);
      } else {
        this.logger.warn(`User not found by email ${email}`, this.SERVICE);
        return undefined;
      }
    } catch (error) {
      this.logger.error('Failed to find user by email', error.stack, this.SERVICE);
      throw new HttpException('Failed to find user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async validateUser({ email, password }: AuthPayloadDto) {
    try {
      this.logger.log(`Validating user by email ${email}`, this.SERVICE);
      const user = await this.prismaService.users.findFirst({
        where: { email },
        include: {
          subscriptions: {
            include: {
              tier: true,
            },
          },
        },
      });

      if (!user) {
        this.logger.warn(`User with email ${email} not found`, this.SERVICE);
        throw new HttpException('Email not found', HttpStatus.UNAUTHORIZED);
      }

      if (!(await bcrypt.compare(password, user.passwordHash))) {
        this.logger.warn(`Incorrect password for user with email ${email}`, this.SERVICE);
        throw new HttpException('Incorrect password', HttpStatus.UNAUTHORIZED);
      }

      const { passwordHash, ...result } = user;
      this.logger.log(`User validated successfully - ${user.user_id}`, this.SERVICE);
      return result;
    } catch (error) {
      this.logger.error('Failed to validate user', error.stack, this.SERVICE);
      throw new HttpException('Failed to validate user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateUser(userId: string, updateData: UserUpdateReq): Promise<UserEntity> {
    try {
      this.logger.log(`Updating user with ID ${userId}`, this.SERVICE);
      const updatedUser = await this.prismaService.users.update({
        where: {
          user_id: userId,
        },
        data: { ...updateData },
      });
      this.logger.log(`User updated successfully - ${updatedUser.user_id}`, this.SERVICE);
      return new UserEntity(updatedUser);
    } catch (error) {
      this.logger.error('Failed to update user', error.stack, this.SERVICE);
      throw new HttpException('Failed to update user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  async updateUserImage(userId: string, updateData: any): Promise<UserEntity> {
    try {
      this.logger.log(`Updating user image for user ID ${userId}`, this.SERVICE);
      const updatedUser = await this.prismaService.users.update({
        where: {
          user_id: userId,
        },
        data: { ...updateData },
      });
      this.logger.log(`User image updated successfully - ${updatedUser.user_id}`, this.SERVICE);
      return new UserEntity(updatedUser);
    } catch (error) {
      this.logger.error('Failed to update user image', error.stack, this.SERVICE);
      throw new HttpException('Failed to update user image', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async login(user: any) {
    try {
      this.logger.log(`Logging in user with email ${user.email}`, this.SERVICE);
      const payload = {
        username: user.email,
        sub: {
          name: user.name,
        },
      };

      const tokens = {
        accessToken: this.jwtService.sign(payload, { expiresIn: '3d' }),
        refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
      };

      this.logger.log(`User logged in successfully - ${user.user_id}`, this.SERVICE);
      return { ...user, ...tokens };
    } catch (error) {
      this.logger.error('Failed to login user', error.stack, this.SERVICE);
      throw new HttpException('Failed to login user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async oAuthLogin(user: any) {
    try {
      this.logger.log(`OAuth login for user with email ${user.email}`, this.SERVICE);
      if (!user) {
        throw new Error('User not found!!!');
      }
      const existingUser = await this.findeByEmail(user.email);


      //when not registred
      if (!existingUser) {
        const existingUser = await this.createUserWithSubscriptionGoogle(user);

      //when past registred
      }else{

      }
 


    
    } catch (error) {
      this.logger.error('Failed to OAuth login user', error.stack, this.SERVICE);
      throw new HttpException('Failed to OAuth login user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


  async generateNewAccessToken(user: any): Promise<string> {
    const payload = {
      username: user.email,
      sub: {
        name: user.name,
      },
    };

    return this.jwtService.sign(payload);
  }



  async getUserWithToken(token: string): Promise<UserEntity | undefined> {
    try {
      this.logger.log(`Getting user with token`, this.SERVICE);
      const payload = await this.jwtService.verify(token);
      if (!payload) {
        this.logger.warn(`Invalid token provided`, this.SERVICE);
        return null;
      }

      const user = await this.prismaService.users.findUnique({
        where: {
          email: payload.username,
        },
        select: {
          user_id: true,
          name: true,
          lastName: true,
          email: true,
          photoUrl: true,
          mobileNumber: true,
          organisation: true,
          created_at: true,
          updated_at: true,
          activeSubscriptionId: true,
          subscriptions: {
            include: {
              tier: true,
            },
          },
        },
      });

      if (!user) {
        this.logger.warn(`User not found with the provided token`, this.SERVICE);
        return null;
      }

      this.logger.log(`User found with token - ${user.user_id}`, this.SERVICE);
      return {
        ...user,
        isAuthenticated: true,
      };
    } catch (error) {
      this.logger.error('Failed to get user with token', error.stack, this.SERVICE);
      return null;
    }
  }


}
