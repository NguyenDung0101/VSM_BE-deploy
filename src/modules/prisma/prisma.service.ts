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
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log("🔗 Connected to PostgreSQL database");
    } catch (error) {
      console.error("❌ Failed to connect to PostgreSQL database:", error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      console.log("🔌 Disconnected from PostgreSQL database");
    } catch (error) {
      console.error("❌ Error disconnecting from database:", error);
    }
  }

  // Helper methods for cleanup - Updated for PostgreSQL
  async cleanDatabase() {
    if (process.env.NODE_ENV === "production") return;

    try {
      // PostgreSQL syntax để lấy danh sách bảng
      const tablenames = await this.$queryRaw<
        Array<{ table_name: string }>
      >`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';`;

      const tables = tablenames
        .map(({ table_name }) => table_name)
        .filter((name) => name !== "_prisma_migrations");

      // PostgreSQL syntax để disable foreign key checks và truncate
      await this.$executeRawUnsafe(`SET session_replication_role = replica;`);

      for (const table of tables) {
        await this.$executeRawUnsafe(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`);
      }

      await this.$executeRawUnsafe(`SET session_replication_role = DEFAULT;`);
    } catch (error) {
      console.error("❌ Error cleaning database:", error);
    }
  }

  // Thêm method để check connection health
  async checkConnection(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error("❌ Database connection check failed:", error);
      return false;
    }
  }
}
