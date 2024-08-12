import {IsEmail , IsString, MinLength } from 'class-validator';


export class UserCreateReq{
    @IsString()
    name: string;

    @IsString()
    lastName : string;

    @IsEmail()
    email :string

    @IsString()
    @MinLength(8)
    password:string

}
export class UserLoginReq{

    @IsEmail()
    email :string

    @IsString()
    password:string

}

export class AuthPayloadDto {
  email: string;

  password: string;
}

export class UserForgetPassReq{
  @IsString()
  email :string
}

export class UserResetPassReq{
  @IsString()
  token:string

  @IsString()
  newPassword:string
}


export class UserEntity {
    constructor(partial: Partial<UserEntity>) {
      Object.assign(this, partial);
    }
    user_id:string
    name: string;
    lastName: string;
    email: string;
    passwordHash:string
    isAuthenticated?:boolean

  }
  
