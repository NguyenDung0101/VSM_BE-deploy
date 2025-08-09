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

  // Chỉ dùng khi cần dọn dữ liệu trong môi trường dev/test
  async cleanDatabase() {
    if (process.env.NODE_ENV === "production") return;

    const schema = "public"; // schema mặc định của PostgreSQL

    const tablenames = await this.$queryRaw<
      Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname = ${schema};`;

    const tables = tablenames
      .map(({ tablename }) => tablename)
      .filter((name) => name !== "_prisma_migrations");

    try {
      for (const table of tables) {
        await this.$executeRawUnsafe(`TRUNCATE TABLE "${schema}"."${table}" RESTART IDENTITY CASCADE;`);
      }
    } catch (error) {
      console.error("❌ Error cleaning database:", error);
    }
  }
}
