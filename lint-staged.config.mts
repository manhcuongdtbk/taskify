import { relative } from "node:path";
import { isNotNil } from "es-toolkit";
import { isEslintPath, isPrettierPath } from "./config/lint-files.mts";
import { isAppRouterSegmentFile } from "./scripts/app-router-segment-files.ts";

const quote = (file: string) => `"${relative(process.cwd(), file)}"`;

/** ESLint then Prettier — membership from each tool’s API (`config/lint-files.mts`). */
const fixStaged = async (filenames: string[]) => {
  const [eslintFiles, prettierFiles] = await Promise.all([
    Promise.all(
      filenames.map(async (f) => ((await isEslintPath(f)) ? f : null)),
    ).then((rows) => rows.filter(isNotNil)),
    Promise.all(
      filenames.map(async (f) => ((await isPrettierPath(f)) ? f : null)),
    ).then((rows) => rows.filter(isNotNil)),
  ]);

  const cmds: string[] = [];
  if (eslintFiles.length > 0) {
    cmds.push(`eslint --fix ${eslintFiles.map(quote).join(" ")}`);
  }
  if (prettierFiles.length > 0) {
    cmds.push(`prettier --write ${prettierFiles.map(quote).join(" ")}`);
  }
  return cmds;
};

/** Routes script discovers files itself; only gate on whether a segment file is staged. */
const maybeFixRoutes = (filenames: string[]) =>
  filenames.some(isAppRouterSegmentFile) ? ["pnpm lint:routes:fix"] : [];

/** Prisma owns `*.prisma` format (not Prettier). Function form avoids lint-staged appending paths. */
const fixPrismaSchema = () => ["pnpm lint:prisma:fix"];

const config = {
  "*": fixStaged,
  "app/**": maybeFixRoutes,
  "*.prisma": fixPrismaSchema,
};

export default config;
