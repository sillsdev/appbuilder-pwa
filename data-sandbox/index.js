const path = require('path');
const fse = require('fs-extra');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer');
const express = require('express');
const http = require('http');
const cors = require('cors');
const { json } = require('body-parser');
const { Proskomma, typeDefs, resolvers } = require('proskomma-core');

async function startApolloServer(typeDefs, resolvers) {
    const PORT = 2468;
    const app = express();
    const httpServer = http.createServer(app);
    const pk = new Proskomma([
        {
            name: "source",
            type: "string",
            regex: "^[^\\s]+$"
        },
        {
            name: "project",
            type: "string",
            regex: "^[^\\s]+$"
        },
        {
            name: "revision",
            type: "string",
            regex: "^[^\\s]+$"
        },
    ]);
    if (process.argv.length !== 3) {
        console.error("That's an error");
        process.exit(1);
    } else {
        for (const file of fse.readdirSync(path.resolve(process.argv[2]))) {
            console.log(`Loading ${file}`);
            pk.loadSuccinctDocSet(
                fse.readJsonSync(
                    path.join(
                        path.resolve(process.argv[2],
                            file
                        )
                    )
                )
            );
        }
    }
    const server = new ApolloServer({
        typeDefs,
        resolvers,
        rootValue: pk,
        plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    });
    await server.start();
    app.use(
        '/graphql',
        cors(),
        json(),
        expressMiddleware(server, {
            context: async ({ req }) => ({ token: req.headers.token }),
        }),
    );
    // server.applyMiddleware({ app });
    await new Promise(resolve => httpServer.listen({ port: PORT }, resolve));
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
}

startApolloServer(typeDefs, resolvers);
