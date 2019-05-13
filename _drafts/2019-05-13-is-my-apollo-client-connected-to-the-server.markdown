---
layout: post
title:  "Is My Apollo Client Connected to the Server?"
description: "It turns out that the problem of detecting server connectivity is more complicated than it first seems in the current state of Apollo."
author: "Pete Corey"
date:   2019-05-13
tags: ["Javascript", "GraphQL", "Apollo"]
related: []
---

When you're building a real-time, subscription-heavy front-end application, it can be useful to know if your client is actively connected to the server. If that connection is broken, maybe because the server is temporarily down for maintenance, we'd like to be able to show a message explaining the situation to the user. Once we re-establish our connection, we'd like to hide that message and go back to business as usual.

That's the dream, at least. Trying to implement this functionality using [Apollo](https://www.apollographql.com/) turned out to be more trouble than we expected on a recent client project.

Let's go over a few of the solutions that we tried that didn't solve the problem, for various reasons, and then let's go over the final working solution that we came up with. Ultimately, I'm happy with what we landed on, but I didn't expect to uncover so many roadblocks along the way.

## What Didn't Work

Our first attempt was to build a component that polled for a `heartbeat`{:.language-javascript} query on the server. If the query ever failed with an `error`{:.language-javascript}, we'd show a "disconnected" message to the client. Presumably, once the connection to the server was re-established, the `error`{:.language-javascript} would clear, and we could render the children of our component:

<pre class='language-javascript'><code class='language-javascript'>
const Connected = props => {
  return (
    <Query query={gql'{ heartbeat }'} pollInterval={5000}>
      {({error, loading}) => {
        if (loading) {
            return &lt;Loader/>;
        }
        else if (error) {
            return &lt;Message/>;
        }
        else {
            return props.children;
        }
      }}
    </Query>
  );
}
</code></pre>

Unfortunately, our assumptions didn't hold up. Apparently when a query fails, Apollo (`react-apollo@2.5.5`{:.language-*}) will stop polling on that failing query, stopping our connectivity checker dead in its tracks.

__NOTE:__ Apparently, this should work, and in various simplified reproductions I built while writing this article, _it did work_. Here are various issues and pull requests documenting the problem, merging in fixes (which others claim don't work), and documenting workarounds:

- [Wrapped component never gets updated after an error](https://github.com/apollographql/react-apollo/issues/1229)
- [2.0 not clearing error after refetch](https://github.com/apollographql/apollo-client/issues/2513)
- [Resubscribe after error -- apollo-client issue 2513](https://github.com/apollographql/react-apollo/pull/1531)

---- 

We thought, "well, if polling is turned off on error, let's just turn it back on again!" Our next attempt used `startPolling`{:.language-javascript} to try restarting our periodic heartbeat query.

<pre class='language-javascript'><code class='language-javascript'>
if (error) {
  startPolling(5000);
}
</code></pre>

No dice.

Our component start refetching our query, but the `Query`{:.language-javascript} component returns values for both `data`{:.language-javascript} and `error`{:.language-javascript}, along with a `networkStatus`{:.language-javascript} of `8`{:.language-javascript}, which indicates that ["one or more errors were detected."](https://www.apollographql.com/docs/react/api/react-apollo#graphql-query-data-networkStatus)

If a query returns both an error and data, how are we to know which to trust? Was the query successful? Or was there an error?

We also tried to implement our own polling system with various combinations of `setTimeout`{:.language-javascript} and `setInterval`{:.language-javascript}. Ultimately, none of these solutions seemed to work because Apollo was returning both `error`{:.language-javascript} and `data`{:.language-javascript} for queries, once the server had recovered.

__NOTE:__ This should also work, though it would be unnecessary, if it weren't for the issues mentioned above.

---- 

Lastly, we tried to leverage subscriptions to build our connectivity detection system. We wrote a `heartbeat`{:.language-javascript} subscription which pushes a timestamp down to the client every five seconds. Our component subscribes to this publication… And then what?

We'd need to set up another five second interval on the client that flips into an error state if it hasn't seen a heartbeat in the last interval.

But once again, once our connection to the server is re-established, our subscription won't re-instantiate in a sane way, and our client will be stuck showing a stale disconnected message.

## What Did Work

We decided to go a different route and implement a solution that leverages the `SubscriptionClient`{:.language-javascript} lifecycle and Apollo's client-side query functionality.

Starting things off, we added a purely client-side `online`{:.language-javascript} query that returns a `Boolean!`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
const typeDefs = gql`
  extend type Query {
    online: Boolean!
  }
`;

const client = new ApolloClient({
  ...,
  typeDefs
});
</code></pre>

And We refactored our `Connected`{:.language-javascript} component to query for that value from the cache:

<pre class='language-javascript'><code class='language-javascript'>
const Connected = props => {
  return (
    <Query query={gql'{ online @client }'}>
      {({error, loading}) => {
        if (loading) {
            return &lt;Loader/>;
        }
        else if (error) {
            return &lt;Message/>;
        }
        else {
            return props.children;
        }
      }}
    </Query>
  );
}
</code></pre>

Notice that we're not polling on this query. Any time we update our `online`{:.language-javascript} value in the cache, Apollo knows to re-render this component.

Next, while setting up our `SubscriptionClient`{:.language-javascript} and `WebSocketLink`{:.language-javascript}, we added a few hooks to detect when our client is connected, disconnected, and later reconnected. In each of those cases, we write the appropriate value of `online`{:.language-javascript} to our cache:

<pre class='language-javascript'><code class='language-javascript'>
TODO: Do this snippet
</code></pre>

And that's all there is to it!

Any time our `SubscriptionClient`{:.language-javascript} detects that it's disconnected from the server, we write `offline: false`{:.language-javascript} into our cache, and any time we connect or reconnect, we write `offline: true`{:.language-javascript}. Our component picks up each of these changes and shows a corresponding message to the user.

Huge thanks to [this StackOverflow comment](https://stackoverflow.com/questions/50887793/check-for-internet-connectivity-using-websocketlink-from-apollo-link-ws/50893219#50893219) for pointing us in the right direction.
