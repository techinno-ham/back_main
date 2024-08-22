import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
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
  constructor(
    private readonly prismaService: PrismaService,
    private jwtService: JwtService,

  ) { }

  async creatUser({
    name,
    lastName,
    email,
    password,
    photoUrl
  }: UserCreateReq): Promise<UserEntity> {
    try {
      const passwordHash = await bcrypt.hash(password, process.env.SALT_BCRYPT);
      const createduser = await this.prismaService.users.create({
        data: {
          name,
          lastName,
          email,
          passwordHash,
          photoUrl
        },
      });
      return new UserEntity(createduser);
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async createUserWithSubscription({
    name,
    lastName,
    email,
    password,
  }: UserCreateReq): Promise<UserEntity> {
    try {
      const passwordHash = await bcrypt.hash(password, process.env.SALT_BCRYPT);
      const userId = uuidv4();
      const subscriptionId = uuidv4();
      const photoUrl=`${process.env.S3_HOST}/user-resources/defualtProfile/profile.svg`

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
          end_date: formattedEndDate
        },
      });

      const [createduser,] = await this.prismaService.$transaction([createUser, createSubscription])

      return new UserEntity(createduser);
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async findeByEmail(email: string): Promise<UserEntity | undefined> {
    return this.prismaService.users.findFirst({
      where: {
        email: email,
      },
    });
  };

  async validateUser({ email, password }: AuthPayloadDto) {
    const user = await this.prismaService.users.findFirst({
      where: { email: email },
      include: {
        subscriptions: {
          include: {
            tier: true, 
          },
        },
      },
    });

    if (!user) {
      throw new HttpException('Email not found', HttpStatus.NOT_FOUND);
    }

    if (!(await bcrypt.compare(password, user.passwordHash))) {
      throw new HttpException('Incorrect password', HttpStatus.UNAUTHORIZED);
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async updateUser(userId: string, updateData: UserUpdateReq): Promise<UserEntity> {
    try {
      const updatedUser = await this.prismaService.users.update({
        where: {
          user_id: userId,
        },
        data: {
          ...updateData,
        },
      });
      return new UserEntity(updatedUser);
    } catch (error) {
      console.error(error);
      throw new HttpException('Failed to update user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  async updateUserImage(userId: string, updateData: any): Promise<UserEntity> {
    try {
      const updatedUser = await this.prismaService.users.update({
        where: {
          user_id: userId,
        },
        data: {
          ...updateData,
        },
      });
      return new UserEntity(updatedUser);
    } catch (error) {
      console.error(error);
      throw new HttpException('Failed to update userImage', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async login(user: any) {
    const payload = {
      username: user.email,
      sub: {
        name: user.name,
      },
    };
 

    return {
      ...user,
      accessToken: this.jwtService.sign(payload,{ expiresIn: '1d' }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
    };
  }

  async oAuthLogin(user: any) {
    if (!user) {
      throw new Error('User not found!!!');
    }

    const payload = {
      username: user.email,
      sub: {
        name: user.name,
      },
    };

    const jwt = this.jwtService.sign(payload);

    return { jwt };
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

  async generateToken(userId: string): Promise<string> {
    const payload = { userId };

    const token = await jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: 81000,
    });
    return token;
  }



  async getUserWithToken(token: string): Promise<UserEntity | undefined> {
    try {
      const payload = (await this.jwtService.verify(
        token
      ));
      if (!payload) {
        return null;
      };

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
  

      if (!user) return null;

      return {
        ...user,
        isAuthenticated: true,
      };
    } catch (error) {
      return null;
    }
  }


}
