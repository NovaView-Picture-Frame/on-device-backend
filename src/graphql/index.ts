import { weave } from "@gqloom/core";
import { ZodWeaver } from "@gqloom/zod";

import { imagesResolver } from "./resolvers/images";
import { configResolver } from "./resolvers/config";

export const schema = weave(ZodWeaver, imagesResolver, configResolver);
