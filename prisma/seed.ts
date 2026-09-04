// prisma/seed.ts — seeds preset (global) Tags.
// Run with: npx prisma db seed
// (or: npx tsx prisma/seed.ts)

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const PRESET_TAGS = [
  "DSA",
  "Project",
  "Reading",
  "Gym",
  "LeetCode",
  "Learning",
  "Writing",
];

async function main() {
  console.log("🌱  Seeding preset tags...");

  for (const name of PRESET_TAGS) {
    await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name, userId: null },
    });
  }

  console.log(`✅  Done — ${PRESET_TAGS.length} preset tags upserted.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
