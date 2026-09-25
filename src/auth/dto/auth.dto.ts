import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";
export class RegisterDto {
  @IsString() @MinLength(1) @MaxLength(120) name!: string;
  @IsEmail() @MaxLength(255) email!: string;
  @IsString() @MinLength(10) @MaxLength(128) password!: string;
}
export class LoginDto {
  @IsEmail() @MaxLength(255) email!: string;
  @IsString() @MinLength(1) @MaxLength(128) password!: string;
}
export class TokenDto {
  @IsString() @MinLength(1) @MaxLength(512) token!: string;
}
export class ResetPasswordDto extends TokenDto {
  @IsString() @MinLength(10) @MaxLength(128) password!: string;
}
export class ForgotPasswordDto {
  @IsEmail() @MaxLength(255) email!: string;
}
