import { User } from 'src/entities/User';
import { MyContext } from 'src/types';
import { Resolver, Mutation, Arg, InputType, Field, Ctx } from 'type-graphql';
import argon2 from 'argon2';

// this is an alternative to making multiple Arg() decorators
// you can make a class, which is then passed into the Arg as it's type
@InputType()
class UsernamePasswordInput {
  @Field()
  username: string
  // username is inferred, but you can explicity set the type like in password below.
  @Field(() => String)
  password: string 
}

@Resolver()
export class UserResolver {

  // CREATE USER
  // takes in options object as argument, which is username and pass
  // creates user in database, then saves user to db
  @Mutation(() => String)
  async register(
    @Arg('options') options: UsernamePasswordInput,
    @Ctx() { em }: MyContext
  ) {
    const hashedPassword = await argon2.hash(options.password)
    // creates user with username, and hashed password from argon2
    const user = em.create(User, {
      username: options.username, 
      password: hashedPassword
    });
    await em.persistAndFlush(user);
    return user;
  }
}