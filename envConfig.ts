// TODO: move this file to the config folder?

// https://nextjs.org/docs/pages/guides/environment-variables#loading-environment-variables-with-nextenv

import { loadEnvConfig } from "@next/env";

const projectDir = process.cwd();
loadEnvConfig(projectDir);
