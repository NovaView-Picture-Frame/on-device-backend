import { createHandler } from "graphql-http/lib/use/fastify";

import { schema } from "../../graphql";

export const graphqlHandler = createHandler({ schema });
