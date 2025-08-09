import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log: ["query", "info", "warn", "error"],
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log("🔗 Connected to PostgreSQL database");
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log("🔌 Disconnected from PostgreSQL database");
  }

  /**
   * Xóa sạch dữ liệu trong database (dev only)
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV === "production") return;

    const tables = await this.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables
      WHERE schemaname = 'public';
    `;

    try {
      for (const { tablename } of tables) {
        await this.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" RESTART IDENTITY CASCADE;`);
      }
    } catch (error) {
      console.log({ error });
    }
  }
}
