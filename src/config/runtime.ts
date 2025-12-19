import fs from "node:fs/promises";
import yaml from "yaml";

import { argsSchema, configSchema } from "./schema";
import { initDirs, type DirTree } from "./initDirs";

const dirTree = {
    originals: { _withTmp: true },
    cropped: { _withTmp: true },
    optimized: { _withTmp: true },
} satisfies DirTree;

const args = argsSchema.parse(process.argv.slice(2));
const file = await fs.readFile(args[1], "utf-8");

export const config = configSchema.parse(yaml.parse(file));
export const paths = await initDirs(config.server.data_dir, dirTree);
