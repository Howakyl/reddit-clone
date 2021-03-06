import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import microConfig from './mikro-orm.config';
import express from 'express';
import {ApolloServer} from 'apollo-server-express';
import {buildSchema} from 'type-graphql';
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import redis from 'redis';
import session from 'express-session';
import connectRedis from 'connect-redis';
import { MyContext } from "./types";
import cors from 'cors';

// ~/Downloads/redis-6.0.10/src/redis-server TO START REDIS // 


const main = async () => {
  const orm = await MikroORM.init(microConfig);
  await orm.getMigrator().up();
  // the getMigrator function runs migrations before anything else executes.

  const PORT = 4000;
  const app = express();

  const RedisStore = connectRedis(session);
  const redisClient = redis.createClient();

  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  );

  app.use(
    session({
      name: 'qid',
      store: new RedisStore({ 
        client: redisClient,
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
        httpOnly: true, // this will make cookie unaccessible in js frontend code
        sameSite: 'lax', // csrf setting
        secure: __prod__, // cookie will only work in https, not development
      },
      saveUninitialized: false,
      secret: 'sdfljn2349sldkjalqwjeoijxkn2354ii2nma1',
      // make this ^ ENV
      resave: false,
    })
  )
  
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    context: ({req, res}): MyContext => ({ em: orm.em, req, res })
  });

  apolloServer.applyMiddleware({ 
    app, 
    cors: false,
  });

  app.listen(PORT, () => {
    console.log(`server started on Port:${PORT}`)
  })

  // const post = orm.em.create(Post, {title: 'my first post'});
  // await orm.em.persistAndFlush(post);
  // this inserts the new post object into the database

  // const posts = await orm.em.find(Post, {});
  // console.log(posts)
};

main().catch(err => {
  console.log(err);
});
