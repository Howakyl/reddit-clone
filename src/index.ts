import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import microConfig from './mikro-orm.config';

const main = async () => {
  const orm = await MikroORM.init(microConfig);
  await orm.getMigrator().up();
  // the getMigrator function runs migrations before anything else executes.

  // const post = orm.em.create(Post, {title: 'my first post'});
  // await orm.em.persistAndFlush(post);
  // this inserts the new post object into the database

  // const posts = await orm.em.find(Post, {});
  // console.log(posts)
};

main().catch(err => {
  console.log(err);
});