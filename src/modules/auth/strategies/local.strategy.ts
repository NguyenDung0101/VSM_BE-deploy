import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { AuthService } from "../auth.service";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: "email",
    });
  }

  async validate(email: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(email, password);
    // Dòng này dùng để kiểm tra xem user có tồn tại không
    if (!user) {
      throw new UnauthorizedException(); // Nếu user không tồn tại thì throw error
    }
    return user;
  }
}
