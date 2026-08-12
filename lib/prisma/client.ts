// https://www.prisma.io/docs/guides/frameworks/nextjs#26-set-up-prisma-client

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../../app/generated/prisma/client";
import { isProduction } from "../env";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
  });
if (!isProduction) globalForPrisma.prisma = prisma;
export default prisma;
