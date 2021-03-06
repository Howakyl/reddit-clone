import { User } from '../entities/User';
// MAKE SURE IMPORTS ARE USING RELATIVE PATHS ^^^
import { MyContext } from 'src/types';
import { Resolver, Mutation, Arg, InputType, Field, Ctx, Query, ObjectType } from 'type-graphql';
import argon2 from 'argon2';
import { EntityManager } from '@mikro-orm/postgresql';

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
  @Field(() => [FieldError], {nullable: true})
  errors?: FieldError[]

  @Field(() => User, {nullable: true})
  user?: User
}

@Resolver()
export class UserResolver {

  @Query(() => User, {nullable: true})
  async me(@Ctx() { req, em }: MyContext) {
    // console.log("SESSION: ",req.session)
    // you are not logged in
    if (!req.session.userId) return null;
    
    const user = await em.findOne(User, { id: req.session.userId });
    return user;
  }

  //ALL USERS
  /////////////////
  @Query(() => [User])
  users(@Ctx() {em}: MyContext): Promise<User[]> {
    return em.find(User, {});
  }

  // CREATE USER
  /////////////////
  // takes in options object as argument, which is username and pass
  // creates user in database, then saves user to db

  @Mutation(() => UserResponse)
  async register(
    // @Arg('options', () => UsernamePasswordInput) options: UsernamePasswordInput    ---- this is the explicit typing way
    @Arg('options') options: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    if (options.username.length <= 2) {
      return {
        errors: [
          {
          field: "username",
          message: "username must be greater than 2 characters"
        },
      ]
      }
    }

    if (options.password.length <= 3) {
      return {
        errors: [
          {
          field: "password",
          message: "password length must be greater than 3 characters"
        },
      ]
      }
    }

    const hashedPassword = await argon2.hash(options.password)
    // creates user with username, and hashed password from argon2
    let user;
    try {
      const result = await (em as EntityManager)
        .createQueryBuilder(User)
        .getKnexQuery()
        .insert({
          username: options.username, 
          password: hashedPassword,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning("*");
      user = result[0];
    } catch (err) {
      // console.log(err)
      // duplicate username error
      if (err.code === '23505' || err.detail.includes('already exists')) {
        return {
          errors: [
            {
              field: "username",
              message: "user already exists."
            },
          ],
        }
      }
    }

    // store user id session
    // logs you in upon registering and keeps you logged in
    req.session.userId = user.id;

    return {user};
  }


  // LOGIN USER
  @Mutation(() => UserResponse)
  async login(
    @Arg('options') options: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(User, {username: options.username});
    if (!user) {
      return {
        errors: [
          {
          field: 'username',
          message: "that username doesn't exist"
        },
      ],
      }
    }
    const valid = await argon2.verify(user.password, options.password)
    if (!valid) {
      return {
        errors: [
          {
          field: "password",
          message: "incorrect password"
        },
      ],
      }
    }

    req.session.userId = user.id;

    return {user};
  }
}