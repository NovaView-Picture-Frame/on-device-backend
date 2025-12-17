import { weave } from "@gqloom/core";
import { ZodWeaver } from "@gqloom/zod";

import { imagesResolver } from "./resolvers/images";

export const schema = weave(ZodWeaver, imagesResolver);
