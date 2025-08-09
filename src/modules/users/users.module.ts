import { forwardRef, Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { UploadModule } from "src/modules/upload/upload.module";

@Module({
  imports: [UploadModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
