import { User } from 'src/entities/User';
import { MyContext } from 'src/types';
import { Resolver, Mutation, Arg, InputType, Field, Ctx } from 'type-graphql';

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
    const user = em.create(User, {username: options.username})
    await em.persistAndFlush(user);
    return user;
  }
}