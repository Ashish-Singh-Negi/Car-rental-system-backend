import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPostgresAdapter } from "@prisma/adapter-ppg";

import "dotenv/config";

const prisma = new PrismaClient({
  adapter: new PrismaPostgresAdapter({
    connectionString:
      process.env.DATABASE_URL || "Alternante DB connection string",
  }),
});

export { prisma };
