import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
// import { Post } from "./entities/Post";
import microConfig from './mikro-orm.config';
import express from 'express';

const main = async () => {
  const orm = await MikroORM.init(microConfig);
  await orm.getMigrator().up();
  // the getMigrator function runs migrations before anything else executes.

  const PORT = 4000;
  const app = express();
  app.get('/', (_,res) => {
    res.send("hello")
  })
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