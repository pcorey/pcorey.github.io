---
layout: post
title:  "Offline GraphQL Queries with Redux Offline and Apollo"
excerpt: "Use Redux Offline and Redux Persist to add support for offline queries to your Apollo and GraphQL-based front-end application."
author: "Pete Corey"
date:   2017-07-24
tags: ["Javascript", "GraphQL", "Apollo", "Offline"]
---

{% capture correction %}
Be aware that this article was written using Apollo Client version 1, which internally uses Redux to manage its state. __This technique of implementing offline support will not work with later versions of Apollo Client.__
{% endcapture %}

{% include correction.html content=correction %}

Ironically, in our ever more connected world, demands for offline capabilities of web applications are growing. Our users (and clients) expect to use rich internet applications while online, offline, and in areas of questionable connectivity.

This can be… difficult.

Let’s dive into how we can build a reasonably powerful offline solution using [React](https://facebook.github.io/react/) and a [GraphQL data layer](http://graphql.org/) powered by [Apollo Client](http://www.apollodata.com/). We’ll split this article into two parts. This week, we’ll discuss offline querying. Next week, we’ll tackle mutations.

## Redux Persist and Redux Offline

Under the hood, [Apollo Client](https://github.com/apollographql/apollo-client) is powered by [Redux](http://redux.js.org/). This means that the entire Redux ecosystem of tools and libraries are available for us to use in our Apollo application.

In the world of Redux offline support, there are two major players: Redux Persist, and Redux Offline.

[Redux Persist](https://github.com/rt2zz/redux-persist) is a fantastic, but bare bones, tool designed to store and retrieve (or “rehydrate”) a redux store to and from `localStorage`{:.language-javascript} (or any other [supported storage engine](https://github.com/rt2zz/redux-persist#storage-engines)).

[Redux Offline](https://github.com/jevakallio/redux-offline) expands on Redux Persist and adds additional layers of functionality and utility. Redux Offline automatically detects network disconnections and reconnections, lets you queue up actions and operations while offline, and automatically retries those actions once reconnected.

Redux Offline is the batteries-included option for offline support. 🔋

## Offline Queries

Out of the box, Apollo Client works fairly well in partially connected network situations. Once a query is made by the client, the results of that query are saved to the Apollo store.

If that same query is made again [with any `fetchPolicy`{:.language-javascript} other than `network-only`{:.language-javascript}](http://dev.apollodata.com/react/api-queries.html#graphql-config-options-fetchPolicy), the results of that query will be immediately pulled from the client’s store and returned to the querying component. This means that even if our client is disconnected from the server, repeated queries will still be resolved with the most recent results available.

<a href="https://github.com/jevakallio/redux-offline"><img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/static/reduxoffline.png" style="float: right; width: 5em; margin: 0 0 1em 1em;"></a>

Unfortunately, as soon as a user closes our application, their store is lost. How can we persist the client’s Apollo store through application restarts?

Redux Offline to the rescue!

The Apollo store actually exists within our application’s Redux store (under the `apollo`{:.language-javascript} key). By persisting the entire Redux store to `localStorage`{:.language-javascript}, and rehydrating it every time the application is loaded, we can carry over the results of past queries through application restarts, [even while disconnected from the internet](https://github.com/jevakallio/redux-offline#progressive-web-apps)!

Using Redux Offline with an Apollo Client application doesn’t come without its kinks. Let’s explore how to get these two libraries to work together.

### Manually Building a Store

Normally, setting up an Apollo client is fairly simple:

<pre class='language-javascript'><code class='language-javascript'>
export const client = new ApolloClient({
    networkInterface
});
</code></pre>

The `ApolloClient`{:.language-javascript} constructor would create our Apollo store (and indirectly, our Redux store) automatically for us. We’d simply drop this new `client`{:.language-javascript} into our `ApolloProvider`{:.language-javascript} component:

<pre class='language-javascript'><code class='language-javascript'>
ReactDOM.render(
    &lt;ApolloProvider client={client}>
        &lt;App />
    &lt;/ApolloProvider>,
    document.getElementById('root')
);
</code></pre>

When using Redux Offline, we’ll need to manually construct our Redux store to pass in our Redux Offline middleware. To start, let’s just recreate what Apollo does for us:

<pre class='language-javascript'><code class='language-javascript'>
export const store = createStore(
    combineReducers({ apollo: client.reducer() }),
    undefined,
    applyMiddleware(client.middleware())
);
</code></pre>

Our new `store`{:.language-javascript} uses the reducer and middleware provided by our Apollo `client`{:.language-javascript}, and initializes with an initial store value of `undefined`{:.language-javascript}.

We can now pass this `store`{:.language-javascript} into our `ApolloProvider`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
&lt;ApolloProvider client={client} store={store}>
    &lt;App />
&lt;/ApolloProvider>
</code></pre>

Perfect. Now that we have control over the creation of our Redux store, we can wire in offline support with Redux Offline.

### Basic Query Persistence

Adding Redux Offline into the mix, in its simplest form, consists of adding a new piece of middleware to our store:

<pre class='language-javascript'><code class='language-javascript'>
import { offline } from 'redux-offline';
import config from 'redux-offline/lib/defaults';
</code></pre>

<pre class='language-javascript'><code class='language-javascript'>
export const store = createStore(
    ...
    compose(
        applyMiddleware(client.middleware()),
        offline(config)
    )
);
</code></pre>

Out of the box, this `offline`{:.language-javascript} middleware will automatically start persisting our Redux store into `localStorage`{:.language-javascript}.

Don’t believe me?

Fire up your console and pull up this `localStorage`{:.language-javascript} entry:

<pre class='language-javascript'><code class='language-javascript'>
localStorage.getItem("reduxPersist:apollo");
</code></pre>

You should be given a massive JSON blob that represents the entire current state of your Apollo application.

<video width="100%" style="" src="https://s3-us-west-1.amazonaws.com/www.east5th.co/static/redux_persist_apollo.webm" autoplay loop controls></video>

Awesome!

Redux Offline is now automatically saving snapshots of our Redux store to `localStorage`{:.language-javascript}. Any time you reload your application, this state will be automatically pulled out of `localStorage`{:.language-javascript} and rehydrated into your Redux store.

Any queries that have resolutions living in this store will return that data, even if the application is currently disconnected from the server.

{% include newsletter.html %}

### Rehydration Race Conditions

Unfortunately, store rehydration isn’t instant. If our application tries to make queries while Redux Offline is rehydrating our store, Strange Things™ can happen.

If we turn on `autoRehydrate`{:.language-javascript} logging within Redux Offline (which is an ordeal in and of itself), we’d see similar errors when we first load our application:

> 21 actions were fired before rehydration completed. This can be a symptom of a race condition where the rehydrate action may overwrite the previously affected state. Consider running these actions after rehydration:
> …

The creator of Redux Persist acknowledges this and has written [a recipe for delaying the rendering of your application](https://github.com/rt2zz/redux-persist/blob/master/docs/recipes.md#delay-render-until-rehydration-complete) until rehydration has taken place. Unfortunately, his solution relies on manually calling `persistStore`{:.language-javascript}, which Redux Offline does for us behind the scenes.

Let’s come up with another solution.

We’ll start by creating a new Redux action called `REHYDRATE_STORE`{:.language-javascript}, and a corresponding reducer that sets a `rehydrated`{:.language-javascript} flag in our Redux store to `true`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
export const REHYDRATE_STORE = 'REHYDRATE_STORE';
</code></pre>

<pre class='language-javascript'><code class='language-javascript'>
export default (state = false, action) => {
    switch (action.type) {
        case REHYDRATE_STORE:
            return true;
        default:
            return state;
    }
};
</code></pre>

Now let’s add our new reducer to our store and tell Redux Offline to trigger our action when it finishes rehydrating the store:

<pre class='language-javascript'><code class='language-javascript'>
export const store = createStore(
    combineReducers({
        rehydrate: RehydrateReducer,
        apollo: client.reducer()
    }),
    ...,
    compose(
        ...
        offline({
            ...config,
            persistCallback: () => {
                store.dispatch({ type: REHYDRATE_STORE });
            },
            persistOptions: {
                blacklist: ['rehydrate']
            }
        })
    )
);
</code></pre>

Perfect. When Redux Offline finishes hydrating our store, it’ll trigger the `persistCallback`{:.language-javascript} function, which dispatches our `REHYDRATE_STORE`{:.language-javascript} action, and eventually updates the `rehydrate`{:.language-javascript} field in our store.

Adding `rehydrate`{:.language-javascript} to our Redux Offline `blacklist`{:.language-javascript} ensures that that piece of our store will never be stored to, or rehydrated from `localStorage`{:.language-javascript}.

Now that our store is accurately reflecting whether or not rehydration has happened, let’s write a component that listens for changes to our new `rehydrate`{:.language-javascript} field and only renders its children if `rehydrate`{:.language-javascript} is `true`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
class Rehydrated extends Component {
    render() {
        return (
            &lt;div className="rehydrated">
                {this.props.rehydrated ? this.props.children : &lt;Loader />}
            &lt;/div>
        );
    }
}

export default connect(state => {
    return {
        rehydrate: state.rehydrate
    };
})(Rehydrate);
</code></pre>

Finally, we can wrap our `<App />`{:.language-javascript} component in our new `<Rehydrate>`{:.language-javascript} component to prevent our application from rendering until rehydration has taken place:

<pre class='language-javascript'><code class='language-javascript'>
&lt;ApolloProvider client={client} store={store}>
    &lt;Rehydrated>
        &lt;App />
    &lt;/Rehydrated>
&lt;/ApolloProvider>
</code></pre>

Whew.

Now our application will happily wait until Redux Offline has completely rehydrated our store from `localStorage`{:.language-javascript} before continuing on to render and make any subsequent GraphQL queries or mutations.

## Quirks and Notes

There are a few quirks and things to take note of when using Redux Offline with Apollo client.

First, it’s important to note that the examples in this article are using version `1.9.0-0`{:.language-javascript} of the `apollo-client`{:.language-javascript} package. Fixes were introduced to Apollo Client in [version 1.9](https://github.com/apollographql/apollo-client/blob/df42883c3245ba206ddd72a9cffd9a1522eee51c/CHANGELOG.md#v190-0) that resolved some [strange behaviors when combined with Redux Offline](https://github.com/apollographql/apollo-client/issues/424#issuecomment-316634765).

Another oddity related to this setup is that Redux Offline doesn’t seem to play nicely with the [Apollo Client Devtools](http://dev.apollodata.com/core/devtools.html#Apollo-Client-Devtools). Trying to use Redux Offline with the Devtools installed can sometimes lead to unexpected, and seemingly unrelated errors.

These errors can be easily avoided by not connecting to the Devtools when creating your Apollo `client`{:.language-javascript} instance:

<pre class='language-javascript'><code class='language-javascript'>
export const client = new ApolloClient({
    networkInterface,
    connectToDevTools: false
});
</code></pre>

## Stay Tuned

Redux Offline should give you basic support for query resolution for your Apollo-powered React application, even if your application is re-loaded while disconnected from your server.

Next week we’ll dive into handling offline mutations with Redux Offline.

Stay tuned!
