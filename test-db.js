import "dotenv/config";
import prisma from "./src/config/prisma.js";

console.log("DATABASE_URL exists:", Boolean(process.env.DATABASE_URL));
console.log(
  "DATABASE_URL host:",
  process.env.DATABASE_URL?.match(/@([^:/]+(?::\d+)?)/)?.[1]
);

async function main() {
  const count = await prisma.url.count();

  console.log(`Database connected.`);
  console.log(`URLs in database: ${count}`);
}

main()
  .catch((error) => {
    console.error("Database connection failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
