---
layout: post
title:  "What is NoSQL Injection?"
description: "NoSQL Injection is an attack that can be leveraged to gain complete control over the queries run against your database. Inject Detect aims to prevent it."
author: "Pete Corey"
date:   2017-07-03
tags: ["Inject Detect", "NoSQL Injection", "Meteor", "Security", "MongoDB"]
---

Progress on [Inject Detect](http://www.injectdetect.com/) continues to chug along. I’ve been working on building out an [educational section](http://www.injectdetect.com/education/) to hold a variety of articles and guides designed to help people better understand all things NoSQL Injection.

This week I put the finishing touches on two new articles: [”What is NoSQL Injection?”](http://www.injectdetect.com/education/what-is-nosql-injection/), and [“How do you prevent NoSQL Injection?”](http://www.injectdetect.com/education/how-do-you-prevent-nosql-injection/).

For posterity, I’ve included both articles below.

---- 

## What is NoSQL Injection?

NoSQL Injection is security vulnerability that lets attackers take control of database queries through the unsafe use of user input. It can be used by an attacker to:

- Expose unauthorized information
- Modify data
- Escalate privileges
- Take down your entire application

Over the past few years, we’ve worked with many teams building amazing software with Meteor and MongoDB. But to our shock and dismay, we’ve found NoSQL Injection vulnerabilities in nearly all of these projects.

## An Example Application

Let’s make things more real by introducing an example to help us visualize how NoSQL Injection can occur, and the impact it can have on your application.

Imagine that our application accepts a username and a password hash from users attempting to log into the system. We check if the provided username/password combination is valid by searching for a user with both fields in our MongoDB database:

<pre class='language-javascript'><code class='language-javascript'>
Meteor.methods({
    login(username, hashedPassword) {
        return Meteor.users.findOne({ username, hashedPassword });
    }
});
</code></pre>

If the user provided a valid `username`{:.language-javascript}, and that user’s corresponding `hashedPassword`{:.language-javascript}, the `login`{:.language-javascript} function will return that user’s document.

## Exploiting Our Application

In this example, we’re assuming that `username`{:.language-javascript} and `hashedPassword`{:.language-javascript} are strings, but we’re not explicitly making that assertion anywhere in our code. A user could potentially pass up any type of data from the client, such as a string, a number, or even an object.

A particularly clever user might pass up `"admin"`{:.language-javascript} as their `username`{:.language-javascript}, and `{$gte: ""}`{:.language-javascript} as their password. This combination would result in our `login`{:.language-javascript} method making the following query:

<pre class='language-javascript'><code class='language-javascript'>
db.users.findOne({ username: "admin", hashedPassword: {$gte: ""}})
</code></pre>

This query will return the first document it finds with a `username`{:.language-javascript} of `"admin"`{:.language-javascript} and a hashed password that is greater an empty string. Regardless of the admin user’s password, their user document will be returned by this query.

Our clever user has successfully bypassed out authentication scheme by exploiting a NoSQL Injection vulnerability.

---- 

## How do you prevent NoSQL Injection?

In [our previous example](http://www.injectdetect.com/education/what-is-nosql-injection/), our code was making the assumption that the user-provided `username`{:.language-javascript} and `hashedPassword`{:.language-javascript} were strings. We ran into trouble when a malicious user passed up a MongoDB query operator as their `hashedPassword`{:.language-javascript}.

Speaking in broad strokes, NoSQL Injection vulnerabilities can be prevented by making assertions about the types and shapes of your user-provided arguments. Instead of simply assuming that `username`{:.language-javascript} and `hashedPassword`{:.language-javascript} were strings, we should have made that assertion explicit in our code.

## Using Checks

Meteor’s [Check library](https://docs.meteor.com/api/check.html) can be used to make assertions about the type and shape of user-provided arguments. We can use `check`{:.language-javascript} in our Meteor methods and publications to make sure that we’re dealing with expected data types.

Let’s secure our `login`{:.language-javascript} method using Meteor’s `check`{:.language-javascript} library:

<pre class='language-javascript'><code class='language-javascript'>
Meteor.methods({
    login(username, hashedPassword) {
        check(username, String);
        check(hashedPassword, String);
        return Meteor.users.findOne({ username, hashedPassword });
    }
});
</code></pre>

If a user passes in a `username`{:.language-javascript} or a `password`{:.language-javascript} that is anything other than a string, the one of the calls to `check`{:.language-javascript} in our `login`{:.language-javascript} method will throw an exception. This simple check stops NoSQL Injection attacks dead in their tracks.

## Using Validated Methods

Meteor also gives us the option of writing our methods as [Validated Methods](https://guide.meteor.com/methods.html#validated-method). Validated methods incorporate this type of argument checking into the definition of the method itself.

Let's implement our `login`{:.language-javascript} method as a validated method:

<pre class='language-javascript'><code class='language-javascript'>
new ValidatedMethod({
    name: "login",
    validate: new SimpleSchema({
        username: String,
        hashedPassword: String
    }).validator(),
    run({ username, hashedPassword }) {
        return Meteor.users.findOne({ username, hashedPassword });
    }
});
</code></pre>

The general idea here is the same as our last example. Instead of using `check`{:.language-javascript}, we’re using `SimpleSchema`{:.language-javascript} to make assertions about the shape and types of our method’s arguments.

If a malicious user provides a `username`{:.language-javascript} or a `hashedPassword`{:.language-javascript} that is anything other than a string, the method will return an exception, preventing the possibility of NoSQL Injection attacks.
