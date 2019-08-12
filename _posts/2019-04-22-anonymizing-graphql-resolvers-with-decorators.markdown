---
layout: post
title:  "Anonymizing GraphQL Resolvers with Decorators"
excerpt: "The structure and modular nature of GraphQL resolvers lets us do some amazing things. Check out how we can recursively apply decorators to our resolver tree to elegantly build a \"demo mode\" into our application."
author: "Pete Corey"
date:   2019-04-22
tags: ["Javascript", "GraphQL", "Node.js", "Mongoose"]
related: []
---

As software developers and application owners, we often want to show off what we're working on to others, especially if there's some financial incentive to do so. Maybe we want to give a demo of our application to a potential investor or a prospective client. The problem is that staging environments and mocked data are often lifeless and devoid of the magic that makes our project special.

In an ideal world, we could show off our application using production data without violating the privacy of our users.

On a recently client project we managed to do just that by modifying our GraphQL resolvers with decorators to automatically return anonymized data. I'm very happy with the final solution, so I'd like to give you a run-through.

## Setting the Scene

Imagine that we're working on a Node.js application that uses Mongoose to model its data on the back-end. For context, imagine that our `User`{:.language-javascript} Mongoose model looks something like this:

<pre class='language-javascript'><code class='language-javascript'>
const userSchema = new Schema({
  name: String,
  phone: String
});

const User = mongoose.model('User', userSchema);
</code></pre>

As we mentioned before, we're using GraphQL to build our client-facing API. The exact GraphQL implementation we're using doesn't matter. Let's just assume that we're assembling our resolver functions into a single nested object before passing them along to our GraphQL server.

For example, a simple resolver object that supports a `user`{:.language-javascript} query might look something like this:

<pre class='language-javascript'><code class='language-javascript'>
const resolvers = {
  Query: {
    user: (_root, { _id }, _context) => {
      return User.findById(_id);
    }
  }
};
</code></pre>

Our goal is to return an anonymized user object from our resolver when we detect that we're in "demo mode".

## Updating Our Resolvers

The most obvious way of anonymizing our users when in "demo mode" would be to find every resolver that returns a `User`{:.language-javascript} and manually modify the result before returning:

<pre class='language-javascript'><code class='language-javascript'>
const resolvers = {
  Query: {
    user: async (_root, { _id }, context) => {
      let user = await User.findById(_id);

      // If we're in "demo mode", anonymize our user:
      if (context.user.demoMode) {
        user.name = 'Jane Doe';
        user.phone = '(555) 867-5309';
      }

      return user;
    }
  }
};
</code></pre>

This works, but it's a high touch, high maintenance solution. Not only do we have to comb through our codebase modifying every resolver function that returns a `User`{:.language-javascript} type, but we also have to remember to conditionally anonymize all _future_ resolvers that return `User`{:.language-javascript} data.

Also, what if our anonymization logic changes? For example, what if we want anonymous users to be given the name `'Joe Schmoe'`{:.language-javascript} rather than `'Jane Doe'`{:.language-javascript}? Doh!

Thankfully, a little cleverness and a little help from Mongoose opens the doors to an elegant solution to this problem.

## Anonymizing from the Model

We can improve on our previous solution by moving the anonymization logic into our `User`{:.language-javascript} model. Let's write an `anonymize`{:.language-javascript} Mongoose method on our `User`{:.language-javascript} model that scrubs the current user's `name`{:.language-javascript} and `phone`{:.language-javascript} fields and returns the newly anonymized model object:

<pre class='language-javascript'><code class='language-javascript'>
userSchema.methods.anonymize = function() {
  return _.extend({}, this, {
    name: 'Jane Doe',
    phone: '(555) 867-5309'
  });
};
</code></pre>

We can refactor our `user`{:.language-javascript} resolver to make use of this new method:

<pre class='language-javascript'><code class='language-javascript'>
async (_root, { _id }, context) => {
  let user = await User.findById(_id);

  // If we're in "demo mode", anonymize our user:
  if (context.user.demoMode) {
    return user.anonymize();
  }

  return user;
}
</code></pre>

Similarly, if we had any other GraphQL/Mongoose types we wanted to anonymize, such as a `Company`{:.language-javascript}, we could add an `anonymize`{:.language-javascript} function to the corresponding Mongoose model:

<pre class='language-javascript'><code class='language-javascript'>
companySchema.methods.anonymize = function() {
  return _.extend({}, this, {
    name: 'Initech'
  });
};
</code></pre>

And we can refactor any resolvers that return a `Company`{:.language-javascript} GraphQL type to use our new anonymizer before returning a result:

<pre class='language-javascript'><code class='language-javascript'>
async (_root, { _id }, context) => {
  let company = await Company.findById(_id);

  // If we're in "demo mode", anonymize our company:
  if (context.user.demoMode) {
    return company.anonymize();
  }

  return company;
}
</code></pre>

## Going Hands-off with a Decorator

Our current solution still requires that we modify _every resolver in our application_ that returns a `User`{:.language-javascript} or a `Company`{:.language-javascript}. We also need to remember to conditionally anonymize any users or companies we return from resolvers we write in the future.

This is far from ideal.

Thankfully, we can automate this entire process. If you look at our two resolver functions up above, you'll notice that the anonymization process done by each of them is nearly identical.

We anonymize our `User`{:.language-javascript} like so:

<pre class='language-javascript'><code class='language-javascript'>
// If we're in "demo mode", anonymize our user:
if (context.user.demoMode) {
  return user.anonymize();
}

return user;
</code></pre>

Similarly, we anonymize our `Company`{:.language-javascript} like so:

<pre class='language-javascript'><code class='language-javascript'>
// If we're in "demo mode", anonymize our company:
if (context.user.demoMode) {
  return company.anonymize();
}

return company;
</code></pre>

Because both our `User`{:.language-javascript} and `Company`{:.language-javascript} Mongoose models implement an identical interface in our `anonymize`{:.language-javascript} function, the process for anonymizing their data is the same.

In theory, we could crawl through our `resolvers`{:.language-javascript} object, looking for any resolvers that return a model with an `anonymize`{:.language-javascript} function, and conditionally anonymize that model before returning it to the client.

Let's write a function that does exactly that:

<pre class='language-javascript'><code class='language-javascript'>
const anonymizeResolvers = resolvers => {
  return _.mapValues(resolvers, resolver => {
    if (_.isFunction(resolver)) {
      return decorateResolver(resolver);
    } else if (_.isObject(resolver)) {
      return anonymizeResolvers(resolver);
    } else if (_.isArray(resolver)) {
      return _.map(resolver, resolver => anonymizeResolvers(resolver));
    } else {
      return resolver;
    }
  });
};
</code></pre>

Our new `anonymizeResolvers`{:.language-javascript} function takes our `resolvers`{:.language-javascript} map and maps over each of its values. If the value we're mapping over is a function, we call a soon-to-be-written `decorateResolver`{:.language-javascript} function that will wrap the function in our anonymization logic. Otherwise, we either recursively call `anonymizeResolvers`{:.language-javascript} on the value if it's an array or an object, or return it if it's any other type of value.

Our `decorateResolver`{:.language-javascript} function is where our anonymization magic happens:

<pre class='language-javascript'><code class='language-javascript'>
const decorateResolver = resolver => {
  return async function(_root, _args, context) {
    let result = await resolver(...arguments);
    if (context.user.demoMode &&
        _.chain(result)
         .get('anonymize')
         .isFunction()
         .value()
    ) {
      return result.anonymize();
    } else {
      return result;
    }
  };
};
</code></pre>

In `decorateResolver`{:.language-javascript} we replace our original `resolver`{:.language-javascript} function with a new function that first calls out to the original, passing through any arguments our new resolver received. Before returning the result, we check if we're in demo mode and that the result of our call to `resolver`{:.language-javascript} has an `anonymize`{:.language-javascript} function. If both checks hold true, we return the anonymized `result`{:.language-javascript}. Otherwise, we return the original `result`{:.language-javascript}.

We can use our newly constructed `anonymizeResolvers`{:.language-javascript} function by wrapping it around our original `resolvers`{:.language-javascript} map before handing it off to our GraphQL server:

<pre class='language-javascript'><code class='language-javascript'>
const resolvers = anonymizeResolvers({
  Query: {
    ...
  }
});
</code></pre>

Now any GraphQL resolvers that return any Mongoose model with an `anonymize`{:.language-javascript} function with return anonymized data when in demo mode, regardless of where the query lives, or when it's written.

## Final Thoughts

While I've been using Mongoose in this example, it's not a requirement for implementing this type of solution. Any mechanism for "typing" objects and making them conform to an interface should get you where you need to go.

The real magic here is the automatic decoration of every resolver in our application. I'm incredibly happy with this solution, and thankful that GraphQL's resolver architecture made it so easy to implement.

My mind is buzzing with other decorator possibilities. Authorization decorators? Logging decorators? The sky seems to be the limit. Well, the sky and the maximum call stack size.
