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
    console.log("🔗 Connected to MySQL database");
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log("🔌 Disconnected from MySQL database");
  }

  // Helper methods for cleanup
  async cleanDatabase() {
    if (process.env.NODE_ENV === "production") return;

    const tablenames = await this.$queryRaw<
      Array<{ TABLE_NAME: string }>
    >`SELECT TABLE_NAME from information_schema.TABLES WHERE TABLE_SCHEMA = 'nestjs-restfull';`;

    const tables = tablenames
      .map(({ TABLE_NAME }) => TABLE_NAME)
      .filter((name) => name !== "_prisma_migrations");

    try {
      await this.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0;`);

      for (const table of tables) {
        await this.$executeRawUnsafe(`TRUNCATE TABLE \`${table}\`;`);
      }

      await this.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1;`);
    } catch (error) {
      console.log({ error });
    }
  }
}
