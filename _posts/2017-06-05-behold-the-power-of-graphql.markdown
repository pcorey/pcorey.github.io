---
layout: post
title:  "Behold the Power of GraphQL"
excerpt: "The ability to seamlessly spread your data across many different data stores is a game-changing and under-explored feature of GraphQL."
author: "Pete Corey"
date:   2017-06-05
tags: ["Inject Detect", "Javascript", "Node.js", "GraphQL", "Stripe"]
---

Imagine you’re build out a billing history page. You’ll want to show the current user’s basic account information along with the most recent charges made against their account.

Using [Apollo client](http://dev.apollodata.com/) and [React](https://facebook.github.io/react/), we can wire up a simple query to pull down the information we need:

<pre class='language-javascript'><code class='language-javascript'>
export default graphql(gql`
    query {
        user {
            id
            email
            charges {
                id
                amount
                created
            }
        }
    }
`)(Account);
</code></pre>

Question: Where are the user’s `charges`{:.language-javascript} being pull from? Our application’s data store? Some third party service?

Follow-up question: Does it matter?

## A Tale of Two Data Sources

In this example, we’re resolving the current user from our application’s data store, and we’re resolving all of the charges against that user with [Stripe API](https://stripe.com/docs/api) calls.

We’re not storing any charges in our application.

If we take a look at our [Elixir](https://elixir-lang.org/)-powered [Absinthe](http://absinthe-graphql.org/) schema definition for the `user`{:.language-javascript} type, we’ll see what’s going on:

<pre class='language-elixir'><code class='language-elixir'>
object :user do
  field :id, :id
  field :email, :string
  field :charges, list_of(:stripe_charge) do
    resolve fn
      (user, _, _) ->
        case Stripe.get_charges(user.customer_id) do
          {:ok, charges} -> {:ok, charges}
          _ -> InjectDetect.error("Unable to resolve charges.")
        end
    end
  end
end
</code></pre>

The `id`{:.language-javascript} and `email`{:.language-javascript} fields on the `user`{:.language-javascript} type are being automatically pulled out of the `user`{:.language-javascript} object.

The `charges`{:.language-javascript} field, on the other hand, has a custom resolver function that queries the Stripe API with the user’s `customer_id`{:.language-javascript} and returns all charges that have been made against that customer.

Keep in mind that this is just an example. In a production system, it would be wise to add a caching and rate limiting layer between the client and the Stripe API calls to prevent abuse...

## Does It Matter?

Does it matter that the user and the charges agains the user are being resolves from different data sources? Not at all.

This is the power of [GraphQL](http://graphql.org/)!

From the client’s perspective, the source of the data is irrelevant. All that matters is the data’s shape and the connections that can be made between that data and the rest of the data in the graph.
