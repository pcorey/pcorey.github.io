---
layout: post
title:  "GraphQL Authentication with Apollo and React"
description: "Let's build out the front-end authentication functionality of a React, and Apollo, and Absinthe-powered Elixir application."
author: "Pete Corey"
date:   2017-05-15
tags: ["Elixir", "Phoenix", "Absinthe", "GraphQL", "Apollo", "Authentication"]
---

[Continuing on from last week](http://www.east5th.co/blog/2017/05/08/graphql-authentication-with-elixir-and-absinthe/), we have our authentication and authorization workflow ironed out in our [Elixir](http://elixir-lang.org/)/[Absinthe](http://absinthe-graphql.org/) powered back-end. Fantastic!

But what about the front-end?

How do we get our `auth_token`{:.language-javascript} (or `authToken`{:.language-javascript}, once it’s passed through [Apollo](http://www.apollodata.com/)) from the server? How do we manage active user sessions on the client? How do we ensure our `authToken`{:.language-javascript} is passed up with each request? How do we handle authentication failures?

More great questions! Let’s dive in and set up client-side authentication in our React/[Apollo](http://www.apollodata.com/)-powered front-end.

## Getting Our Authentication Token

In order to have an `authToken`{:.language-javascript} to authenticate our GraphQL requests, we first need to get one from the server.

An `authToken`{:.language-javascript} can be returned by any publicly accessible GraphQL mutation, such as a `signIn`{:.language-javascript} mutation, [or in my case](http://www.east5th.co/blog/2017/04/24/passwordless-authentication-with-phoenix-tokens/), a `verifyRequestedToken`{:.language-javascript} mutation.

Assuming we’re in an Apollo-wrapped React component with a mutation function called `verifyRequestedToken`{:.language-javascript}, we can call it to retrieve our `authToken`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
this.props.verifyRequestedToken(token)
    .then(({ data: { verifyRequestedToken: { authToken } } }) => {
        localStorage.setItem("authToken", authToken);
    })
</code></pre>

Once we retrieve the token from the `verifyRequestedToken`{:.language-javascript} mutation, we'll store it in `localStorage`{:.language-javascript} for later use.

## Attaching Our Authentication Token

Now that we have our hands on an `authToken`{:.language-javascript}, we can send it up with each GraphQL request made from the client.

But how do we do this?

[Apollo middleware](http://dev.apollodata.com/core/network.html#networkInterfaceMiddleware) gives us an easily accessible hook into all requests made against our GraphQL server. Let's add a middleware function to our network interface that attaches our token:

<pre class='language-javascript'><code class='language-javascript'>
networkInterface.use([{
    applyMiddleware(req, next) {
        let authToken = localStorage.getItem("authToken");
        if (authToken) {
            req.options.headers = _.extend(req.options.headers, {
                authorization: `Bearer ${authToken}`
            });
        }
        next();
    }
}]);
</code></pre>

This middleware function checks to see if an `authToken`{:.language-javascript} is stored in `localStorage`{:.language-javascript}. If it is, it’s added as a [bearer token](https://tools.ietf.org/html/rfc6750#section-1.2) to the authorization header of our GraphQL request.

Otherwise, if no `authToken`{:.language-javascript} is found in `localStorage`{:.language-javascript}, no authorization header is set.

Remember, if no `authorization`{:.language-javascript} header is provided, our Absinthe server will let the unauthorized user [access publicly available mutations and queries](http://www.east5th.co/blog/2017/05/08/graphql-authentication-with-elixir-and-absinthe/#a-public-query). An invalid `authToken`{:.language-javascript} will result in an authorization error at the HTTP level.

## Handling HTTP Authentication Errors

If an invalid `authCode`{:.language-javascript} is passed up to the server, the server will return a `403`{:.language-javascript} authorization error. This error is returned at the HTTP level, not as a GraphQL error.

We can add another layer of middleware, [or “afterware”](http://dev.apollodata.com/core/network.html#networkInterfaceAfterware), to our network interface in order to catch these `403`{:.language-javascript} errors as they come back from the server:

<pre class='language-javascript'><code class='language-javascript'>
networkInterface.useAfter([{
    applyAfterware({ response }, next) {
        if (response.status === 403) {
            localStorage.removeItem("authToken");
        }
        next();
    }
}]);
</code></pre>

In the afterware function, we check each response for a `403`{:.language-javascript} status. If we encounter a `403`{:.language-javascript} response, we clear the current `authToken`{:.language-javascript} from `localStorage`{:.language-javascript}, effectively signing out the current user.

When using Apollo in this way, clearing the `authToken`{:.language-javascript} from `localStorage`{:.language-javascript} signs the user our for subsequent requests, but the currently signed in user object is still floating around in the client’s data store.

In [Inject Detect](http://www.injectdetect.com/), I’m flushing this user out of the client’s data store by manually querying for the current user (`user`{:.language-javascript}) after removing `authToken`{:.language-javascript} from `localStorage`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
client.query({
    query: gql`
        query {
            user {
                id
            }
        }
    `,
     fetchPolicy: "network-only"
});
</code></pre>

Specifying a `fetchPolicy`{:.language-javascript} of `"network-only"`{:.language-javascript} forces the Apollo client to fetch the current user from the server, rather than returning the user cached on the client.

Because this query is made without an `authToken`{:.language-javascript}, no user is returned from the server. The user in the client’s store is cleared out, and any components relying on this query result are re-rendered.

Full disclosure - there are probably [better ways to update the store in this situation](http://dev.apollodata.com/react/cache-updates.html). If you have any suggestions, or are doing something similar, please let me know!

## Handling GraphQL Authentication Errors

You may remember that on top of throwing HTTP authentication errors, our GraphQL resolvers will also throw authorization errors if the current user doesn’t have permission to access a given query or mutation.

These errors will be handled inline, at the source of the query or mutation, just like any other GraphQL error.

Let’s run through an example.

Going off of [our examples from last week](http://www.east5th.co/blog/2017/05/08/graphql-authentication-with-elixir-and-absinthe/), let’s pretend that we’re accidentally showing the “Sign out” button to unauthenticated users. Clicking the sign out button triggers a `signOut`{:.language-javascript} mutation:

<pre class='language-javascript'><code class='language-javascript'>
this.props.signOut()
    .then(() => localStorage.removeItem("jwt"))
    ...
</code></pre>

If we try to call this mutation as an unauthenticated user, the `sign_out`{:.language-elixir} resolver will throw a GraphQL error down to the client. We’ll need to catch this, parse the resulting `graphQLErrors`{:.language-javascript}, and show the errors to the user in some meaningful way:

<pre class='language-javascript'><code class='language-javascript'>
this.props.signOut()
    .then(() => localStorage.removeItem("jwt"))
    ...
    .catch((err) => {
        let errors = _.isEmpty(err.graphQLErrors)
                   ? ["Unexpected error."]
                   : _.map(err.graphQLErrors, "message");
        this.setState({ errors });
    });
</code></pre>

Any resulting `errors`{:.language-javascript} can be rendered by the component in a way that makes sense in the context of the application.

## Final Thoughts

With that’s we’ve set up a full-stack authentication system using React, Apollo, Absinthe, and Elixir!

While all of the moving pieces can feel daunting at first glance, breaking the problem into its piece components leads us to a relatively simple solution. All we needed to build a basic Apollo-powered session management system on the client was two middleware functions and some basic error handling.

Not bad for a day’s work.
