import {
  formatLintFileSupportReport,
  getLintFileSupportReport,
} from "../config/lint-files.mts";

const main = async () => {
  const all = process.argv.includes("--all");
  const report = await getLintFileSupportReport();
  console.log(formatLintFileSupportReport(report, { all }));
};

main().catch((reason: unknown) => {
  console.error(reason);
  process.exit(1);
});
