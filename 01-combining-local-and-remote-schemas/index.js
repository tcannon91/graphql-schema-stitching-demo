const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { introspectSchema, RenameTypes, RenameRootFields } = require('@graphql-tools/wrap');
const { stitchSchemas } = require('@graphql-tools/stitch');
const { buildSchema } = require('graphql');

const makeRemoteExecutor = require('./lib/make_remote_executor');
const localSchema = require('./services/local/schema');

async function makeGatewaySchema() {
  // Make remote executors:
  // these are simple functions that query a remote GraphQL API for JSON.
  const productsExec = makeRemoteExecutor('http://localhost:4001/graphql');
  const storefrontsExec = makeRemoteExecutor('http://localhost:4002/graphql');
  const rainforestApiExec = makeRemoteExecutor('http://localhost:4001/graphql');

  return stitchSchemas({
    subschemas: [
      {
        // 1. Introspect a remote schema. Simple, but there are caveats:
        // - Remote server must enable introspection.
        // - Custom directives are not included in introspection.
        schema: await introspectSchema(productsExec),
        executor: productsExec,
      },
      {
        // 2. Manually fetch a remote SDL string, then build it into a simple schema.
        // - Use any strategy to load the SDL: query it via GraphQL, load it from a repo, etc.
        // - Allows the remote schema to include custom directives.
        schema: buildSchema(await fetchRemoteSDL(storefrontsExec)),
        executor: storefrontsExec,
      },
      {
        // 3. Integrate a schema that conflicts with another schema.
        // Let's pretend that "Rainforest API" executor talks to an API that
        // we don't control (say, a product database named after a rainforest...),
        // and the naming in this third-party API conflicts with our schemas.
        // In this case, transforms may be used to integrate the third-party schema
        // with remapped names (and/or numerous other transformations).
        schema: await introspectSchema(rainforestApiExec),
        executor: rainforestApiExec,
        transforms: [
          new RenameTypes((name) => `Rainforest${name}`),
          new RenameRootFields((op, name) => `rainforest${name.charAt(0).toUpperCase()}${name.slice(1)}`),
        ]
      },
      {
        // 4. Incorporate a locally-executable schema.
        // no need for a remote executor!
        schema: localSchema
      }
    ]
  });
}

// Custom fetcher that queries a remote schema for an "sdl" field.
// This is NOT a standard GraphQL convention – it's just a simple way
// for a remote API to provide its own schema, complete with custom directives.
async function fetchRemoteSDL(executor) {
  const result = await executor({ document: '{ sdl }' });
  return result.data.sdl;
}

makeGatewaySchema().then(schema => {
  const app = express();
  app.use('/graphql', graphqlHTTP({ schema, graphiql: true }));
  app.listen(4000);
  console.log('gateway running on port 4000');
});