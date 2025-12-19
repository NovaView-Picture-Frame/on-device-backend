import { resolver, query } from "@gqloom/core";

import { publicConfigSchema } from "../../models/publicConfig";
import { publicConfig } from "../../services/config";

export const configResolver = resolver({
    config: query(publicConfigSchema).resolve(() => publicConfig),
});
