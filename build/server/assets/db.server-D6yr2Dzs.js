import { PrismaNeon } from "@prisma/adapter-neon";
import { neon } from "@neondatabase/serverless";
import { PrismaClient } from "@prisma/client";
//#region app/lib/db.server.ts
var adapter = new PrismaNeon(neon(process.env.DATABASE_URL));
var globalForPrisma = globalThis;
var prisma = globalForPrisma.prisma ?? new PrismaClient({
	adapter,
	log: process.env.NODE_ENV === "development" ? [
		"query",
		"error",
		"warn"
	] : ["error"]
});
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
//#endregion
export { prisma as t };
