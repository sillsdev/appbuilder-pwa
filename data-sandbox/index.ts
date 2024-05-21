// eslint-disable-next-line @typescript-eslint/triple-slash-reference
///<reference path="./proskomma.d.ts"/>
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { expressMiddleware } from '@apollo/server/express4';
import { json } from 'body-parser';
import cors from 'cors';
import express from 'express';
import fse, { readFileSync } from 'fs-extra';
import http from 'http';
import path from 'path';
import { typeDefs, resolvers } from 'proskomma-core';

import { SABProskomma } from '../src/lib/sab-proskomma';
import { thaw } from '../src/lib/scripts/thaw';

async function startApolloServer(typeDefs: any, resolvers: any) {
    const PORT = 2468;
    const app = express();
    const httpServer = http.createServer(app);
    const pk = new SABProskomma();

    const staticDir = path.join('static', 'collections');
    const fileIndex = fse.readJsonSync(path.join(staticDir, 'index.json'));
    for (const file of fileIndex) {
        console.log(`Loading ${file}`);
        const pkData = readFileSync(path.join(staticDir, `${file}.pkf`));
        thaw(pk, new Uint8Array(pkData));
    }

    const server = new ApolloServer({
        typeDefs,
        resolvers,
        rootValue: pk,
        plugins: [ApolloServerPluginDrainHttpServer({ httpServer })]
    });
    await server.start();
    app.use(
        '/graphql',
        cors(),
        json(),
        expressMiddleware(server, {
            context: async ({ req }) => ({ token: req.headers.token })
        })
    );
    await new Promise((resolve: any) => httpServer.listen({ port: PORT }, resolve));
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
}

startApolloServer(typeDefs, resolvers);
