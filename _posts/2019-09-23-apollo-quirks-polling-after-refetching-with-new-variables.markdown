---
layout: post
title:  "Apollo Quirks: Polling After Refetching with New Variables"
excerpt: "Apollo doesn't come without its quirks. Let's dig into what happens when you try to mix a poll interval and a refetch on a single Apollo query."
author: "Pete Corey"
date:   2019-09-23
tags: ["Javascript", "GraphQL", "Apollo"]
related: []
---

While working on a recent client project, [Estelle](https://twitter.com/msestellemarie) and I ran into _a fun [Apollo](https://www.apollographql.com/) quirk_. It turns out that an Apollo query with an active `pollInterval`{:.language-javascript} won't respect new variables provided by calls to `refetch`{:.language-javascript}.

To demonstrate, imagine we're rendering a paginated table filled with data pulled from the server:

<pre class='language-javascript'><code class='language-javascript'>
const Table = () => {
    let { data } = useQuery(gql`
        query items($page: Int!) {
            items(page: $page) {
                pages
                results {
                    _id
                    result
                }
            }
        }
    `, {
        pollInterval: 5000
    });
    
    return (
        &lt;>
            &lt;table>
                {data.items.results.map(({ _id, result }) => (
                    &lt;tr key={_id}>
                        &lt;td>{result}&lt;/td>
                    &lt;/tr>
                ))}
            &lt;/table>
        &lt;/>
    );
};
</code></pre>

The items in our table change over time, so we're polling our query every five seconds.

We also want to give the user buttons to quickly navigate to a given page of results. Whenever a user presses the "Page 2" button, for example, we want to `refetch`{:.language-javascript} our query with our `variables`{:.language-javascript} set to `{ page: 2 }`{:.language-javascript}:

<pre class='language-javascriptDiff'><code class='language-javascriptDiff'>
 const Table = () => {
-    let { data } = useQuery(gql`
+    let { data, refetch } = useQuery(gql`
         query items($page: Int!) {
             items(page: $page) {
                 pages
                 results {
                     _id
                     result
                 }
             }
         }
     `, {
         pollInterval: 5000
     });
     
+    const onClick = page => {
+        refetch({ variables: { page } });
+    };
     
     return (
         &lt;>
             &lt;table>
                 {data.items.results.map(({ _id, result }) => (
                     &lt;tr key={_id}>
                         &lt;td>{result}&lt;/td>
                     &lt;/tr>
                 ))}
             &lt;/table>
+            {_.chain(data.items.pages)
+                .map(page => (
+                    &lt;Button onClick={() => onClick(page)}>
+                        Page {page + 1}
+                    &lt;/Button>
+                ))
+                .value()}
         &lt;/>
     );
 };
</code></pre>

This works… for a few seconds. But then we're unexpectedly brought back to the first page. What's happening here?

It turns out that our polling query will always query the server with the variables it was given at the time polling was initialized. So in our case, even though the user advanced to page two, our polling query will fetch page one and render those results.

So how do we deal with this? [This GitHub issue on the `apollo-client`{:.language-javascript} project](https://github.com/apollographql/apollo-client/issues/3053) suggests calling `stopPolling`{:.language-javascript} before changing the query's variables, and `startPolling`{:.language-javascript} to re-enable polling with those new variables.

In our case, that would look something like this:

<pre class='language-javascriptDiff'><code class='language-javascriptDiff'>
 const Table = () => {
-    let { data, refetch } = useQuery(gql`
+    let { data, refetch, startPolling, stopPolling } = useQuery(gql`
         query items($page: Int!) {
             items(page: $page) {
                 pages
                 results {
                     _id
                     result
                 }
             }
         }
     `, {
         pollInterval: 5000
     });
     
     const onClick = page => {
+        stopPolling();
         refetch({ variables: { page } });
+        startPolling(5000);
     };
     
     return (
         &lt;>
             &lt;table>
                 {data.items.results.map(({ _id, result }) => (
                     &lt;tr key={_id}>
                         &lt;td>{result}&lt;/td>
                     &lt;/tr>
                 ))}
             &lt;/table>
             {_.chain(data.items.pages)
                 .map(page => (
                 &lt;Button onClick={() => onClick(page)}>
                     Page {page + 1}
                 &lt;/Button>
                 ))
                 .value()}
         &lt;/>
     );
 };
</code></pre>

And it works! Now our polling queries will fetch from the server with the correctly updated variables. When a user navigates to page two, they'll stay on page two!

My best guess for why this is happening, and why the `stopPolling`{:.language-javascript}/`startPolling`{:.language-javascript} solution works is that [when polling is started](https://github.com/apollographql/apollo-client/blob/2a4e4158e5d1b7249e3b6347d1038e00ec89c579/packages/apollo-client/src/core/QueryManager.ts#L1373-L1399), the value of `variables`{:.language-javascript} is [trapped in a closure](https://github.com/apollographql/apollo-client/blob/2a4e4158e5d1b7249e3b6347d1038e00ec89c579/packages/apollo-client/src/core/QueryManager.ts#L1349). When `refetch`{:.language-javascript} is called, [it changes the reference to the `options.variables`{:.language-javascript} object](https://github.com/apollographql/apollo-client/blob/master/packages/apollo-client/src/core/ObservableQuery.ts#L323-L329), _but not the referenced object_. This means the value of `options.variables`{:.language-javascript} doesn't change within polling interval.

Calling `stopPolling`{:.language-javascript} and `startPolling`{:.language-javascript} forces our polling interval to restart under a new closure with our new `variables`{:.language-javascript} values.
