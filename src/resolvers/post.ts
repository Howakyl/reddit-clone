import { Arg, Ctx, Int, Query, Resolver, Mutation } from "type-graphql";
import { Post } from "../entities/Post";
import { MyContext } from "src/types";

@Resolver()
export class PostResolver {

  // ALL POSTS
  // returns a promise finding all posts in Post array
  @Query(() => [Post])
  posts(@Ctx() {em}: MyContext): Promise<Post[]> {
    return em.find(Post, {});
  }


  // FIND ONE POST
  // returns a promise or null - searches Post array by Post ID
  @Query(() => Post, {nullable: true})
  post(
    @Arg('id' , () => Int) id: number,
    @Ctx() {em}: MyContext
    ): Promise<Post | null> {
    return em.findOne(Post, { id });
  }


  // CREATE POST 
  // takes in one argument, the title, which is created to then make a post
  // returns a promise, which creates a Post in Post table, and the title string
  // saves to database the new post
  @Mutation(() => Post)
  async createPost(
    @Arg('title' , () => String) title: string,
    @Ctx() {em}: MyContext
    ): Promise<Post> {
      const post = em.create(Post, {title})
      await em.persistAndFlush(post)
    return post;
  }


  // UPDATE POST
  // takes in an argument of the id to find the post, then the new title of the post.
  // returns a promise - if no post is found, returns null
  @Mutation(() => Post, {nullable: true})
  async updatePost(
    @Arg('id') id: number,
    @Arg('title', () => String, {nullable: true}) title: string,
    @Ctx() {em}: MyContext
    ): Promise<Post | null> {
      const post = await em.findOne(Post, {id});
      if (!post) {
        return null
      }
      // if the title is NOT undefined, post.title is saved as the new title
      // this is then saved to the database.
      if(typeof title !== 'undefined') {
        post.title = title;
        await em.persistAndFlush(post);
      }
    return post;
  }


  // DELETE POST
  // this will return a boolean to determine whether the post was deleted or not
  // takes in the ID of the post as an argument, and returns a promise of a boolean. 
  @Mutation(() => Boolean)
  async deletePost(
    @Arg('id') id: number,
    @Ctx() {em}: MyContext
    ): Promise<boolean> {
      // deletes the post by it's ID
      try {
        await em.nativeDelete(Post, { id });
      } catch {
        return false;
      }
      return true;
  }
}