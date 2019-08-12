---
layout: post
title:  "Snapshot Testing GraphQL Queries"
excerpt: "Snapshot testing is a breath of fresh air, especially when combined with testing GraphQL endpoints."
author: "Pete Corey"
date:   2018-10-01
tags: ["Javascript", "GraphQL", "Testing"]
related: []
---

For a recent client project, I've been building out a Node.js backend service fronted by a GraphQL API. A recent revelation made me realize just how useful Jest's snapshot testing can be for writing high-level backend tests, specifically tests targeting GraphQL queries.

My typical approach for testing GraphQL queries is to import and test each query's resolver function individually, as if it were just another function in my application.

Here's an example to help paint a more complete picture:

<pre class='language-javascript'><code class='language-javascript'>
const { bedCount } = require('...');

describe('Unit.bedCount', () => {
    it('it counts beds', async () => {
        expect.assertions(1);
        let user = await createTestUser();
        let unit = await Unit.model.create({ _id: 1, name: 'n1' });
        await Bed.model.create({ _id: 2, unitId: 1, name: 'b1' });
        await Bed.model.create({ _id: 3, unitId: 1, name: 'b2' });

        let result = bedCount(unit, {}, { user });
        expect(result).toEqual(2);
    });
});
</code></pre>

Our test is verifying that a `bedCount`{:.language-javascript} edge off of our `Unit`{:.language-javascript} type returns the correct number of beds that live under that unit. We test this by manually inserting some test data into our database, importing the `bedCount`{:.language-javascript} resolver function, and manually calling `bedCount`{:.language-javascript} with the correct root (`unit`{:.language-javascript}), args (`{}`{:.language-javascript}), and context (`{ user }`{:.language-javascript}) arguments. Once we have the result, we verify that it's correct.

All's well and good here.

However, things start to get more complex when the result of our query increases in complexity. We very quickly have to start flexing our Jest muscles and writing all kinds of complex matchers to verify the contents of our result.

{% include newsletter.html %}

What's more, by testing our resolver function directly, we're only testing half of our GraphQL endpoint. We're not verifying that our schema actually contains the edge we're trying to test, or the fields we're trying to fetch off our our result type.

Thankfully, there's a better way to test these queries. Using [Jest snapshots](https://jestjs.io/docs/en/snapshot-testing) we can refactor our original test into something like this:

<pre class='language-javascript'><code class='language-javascript'>
describe('Unit.bedCount', () => {
    it('it counts beds', async () => {
        expect.assertions(1);
        let user = await createTestUser();
        await Unit.model.create({ _id: 1, name: 'n1' });
        await Bed.model.create({ _id: 2, unitId: 1, name: 'b1' });
        await Bed.model.create({ _id: 3, unitId: 1, name: 'b2' });
        let query = `
            query {
                unit(_id: 1) {
                    bedCount
                }
            }
        `;
        expect(await graphql(schema, query, {}, { user })).toMatchSnapshot();
    });
});
</code></pre>

Here we're once again setting up some test data, but then we perform an actual query through an instance of our GraphQL endpoint we set up on the fly. We pass in our application's GraphQL schema (`schema`{:.language-javascript}), the query we'd like to test (`query`{:.language-javascript}), a root value (`{}`{:.language-javascript}), and the context we'd like to use when performing the query (`{ user }`{:.language-javascript}).

However, instead of manually verifying that the results of our resolver are correct, we make an assertion that the result of our GraphQL query matches our snapshot.

When we first run this test, Jest creates a `__snapshots__`{:.language-javascript} folder alongside our test. In that folder, we'll find a `bedCount.test.js.snap`{:.language-javascript} file that holds the result of our query:

<pre class='language-javascript'><code class='language-javascript'>
// Jest Snapshot v1, https://goo.gl/fbAQLP

exports[`Unit.bedCount it counts beds 1`{:.language-javascript}] = `
Object {
  "data": Object {
    "unit": Object {
      "bedCount": 2,
    },
  },
}
`;
</code></pre>

Any time the result of our query changes, our snapshot test will fail and give us a diff of our previous result saved in our snapshot, and the new, differing result.

The main benefit of this solution, in my mind, is that our query results can be as simple or as complex as we'd like. It doesn't matter to us, as we don't have to work with that data directly. We simply had it off to Jest.

Thanks Jest!
