import { User } from '../entities/User';
// MAKE SURE IMPORTS ARE USING RELATIVE PATHS ^^^
import { MyContext } from 'src/types';
import { Resolver, Mutation, Arg, InputType, Field, Ctx, Query, ObjectType } from 'type-graphql';
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

// this will be used to pass an error into our UI to let user know why their login is not valid.
@ObjectType()
class FieldError {
  @Field()
  field: String;
  @Field()
  message:String;
}

// returns either an error or a User, both of which can be null, and optional as indicated by ?.
@ObjectType()
class UserResponse {
  @Field(() => [Error], {nullable: true})
  errors?: Error[]

  @Field(() => User, {nullable: true})
  user?: User
}

@Resolver()
export class UserResolver {

  //ALL USERS
  @Query(() => [User])
  users(@Ctx() {em}: MyContext): Promise<User[]> {
    return em.find(User, {});
  }

  // CREATE USER
  // takes in options object as argument, which is username and pass
  // creates user in database, then saves user to db
  @Mutation(() => User)
  async register(
    // @Arg('options', () => UsernamePasswordInput) options: UsernamePasswordInput    ---- this is the explicit typing way
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

  @Mutation(() => User)
  async login(
    @Arg('options') options: UsernamePasswordInput,
    @Ctx() { em }: MyContext
  ) {
    const user = await em.findOne(User, {username: options.username});
    if (!user) {
      return {
        errors: [{}]
      }
    }
    return user;
  }
}