---
layout: post
title:  "Offline GraphQL Mutations with Redux Offline and Apollo"
excerpt: "Use Redux Offline and Redux Persist to add support for offline mutations to your Apollo and GraphQL-based front-end application."
author: "Pete Corey"
date:   2017-07-31
tags: ["Javascript", "GraphQL", "Apollo", "Offline"]
---

Last week we started a deep dive into adding offline support to a [React](https://facebook.github.io/react/) application using a [GraphQL data layer](http://graphql.org/) powered by [Apollo](http://www.apollodata.com/).

Thanks to out of the box features provided by [Apollo Client](http://dev.apollodata.com/?_ga=2.269348409.97412003.1501272917-1726448265.1489453690), and a little extra help provided by [Redux Offline](https://github.com/jevakallio/redux-offline) and [Redux Persist](https://github.com/rt2zz/redux-persist), we’ve managed to get our Apollo queries persisting through page loads and network disruptions.

Now let’s turn our attention to mutations.

How do we handle [Apollo mutations](http://dev.apollodata.com/react/mutations.html) made while our client is disconnected from the server? How do we store data and mutations locally and later sync those changes to the server once we regain connectivity?

## Defining the Problem

Last week, we dealt with mostly infrastructure-level changes to add offline support for our [Apollo queries](http://dev.apollodata.com/react/queries.html). Adding support for offline mutations requires a more hands-on approach.

To help explain, let’s pretend that we’re building a survey application. After a user has filled out the questions in a survey, they can submit the survey to the server through a `completeSurvey`{:.language-javascript} mutation:

<pre class='language-javascript'><code class='language-javascript'>
mutation completeSurvey($surveyId: ID!, $answers: [String]) {
    completeSurvey(surveyId: $surveyId, answers: $answers) {
        _id
        answers
        completedAt
    }
}
</code></pre>

We’re passing this mutation into a component and calling it as you would any other mutation in an Apollo-based application:

<pre class='language-javascript'><code class='language-javascript'>
onCompleteSurvey = () => {
    let surveyId = this.props.data.survey._id;
    let answers = this.state.answers;
    this.props.completeSurvey(surveyId, answers);
};

export default graphql(gql`
    ...
`, {
    props: ({ mutate }) => ({
        completeSurvey: (surveyId, answers) => mutate({
            variables: { surveyId, answers } 
        })
    })
})(Survey);
</code></pre>

Unfortunately, this mutation will fail if the client attempts to submit their survey while disconnected from the server.

To make matters worth, we can’t even capture these failures by listening for a `APOLLO_MUTATION_ERROR`{:.language-javascript} action in a custom reducer. Network-level errors are swallowed before an `APOLLO_MUTATION_INIT`{:.language-javascript} is fired and results in an exception thrown by your mutation’s promise.

This is a problem.

## Defining Success

Now that we’ve defined our problem, let’s try to define what a solution to this problem would look like.

“Offline support” is an amorphous blob of features, held together by a fuzzy notion of what the system “should do” while offline, and torn apart by what’s “actually possible”. What does it mean for our mutations to support network disruptions? Getting down to the details, _what exactly_ should happen in our application when a user attempts to submit a survey while offline?

In our situation, it would be nice to mark these surveys as “pending” on the client. Once the user reconnects to the server, any pending surveys should automatically be completed in order via `completeSurvey`{:.language-javascript} mutations. In the meantime, we could use this “pending” status to indicate the situation to the user in a friendly and meaningful way.

Now that we know what a successful offline solution looks like, let’s build it!

## Enter Redux Offline

[When it came to supporting offline queries](http://www.east5th.co/blog/2017/07/24/offline-graphql-queries-with-redux-offline-and-apollo/), Redux Offline largely worked under the hood. None of the components within our application needed any modifications to support offline querying.

Unfortunately, that’s not the case with offline mutations.

To support offline mutations through Redux Offline, we’ll need to wrap all of our mutations in plain old Redux actions. These actions should define a `meta`{:.language-javascript} field that Redux Offline uses to [reconcile the mutations with the server](]https://github.com/jevakallio/redux-offline#thats-all-she-wrote), once reconnected.

Let’s add offline support to our `completeSurvey`{:.language-javascript} mutation.

---- 

First, we’ll set up the Redux action and an action creator that we’ll use to complete our survey:

<pre class='language-javascript'><code class='language-javascript'>
export const COMPLETE_SURVEY = 'COMPLETE_SURVEY';

export const completeSurvey = (survey, answers) => {
    const mutation = gql`
        mutation completeSurvey($surveyId: ID!, $answers: [String]) {
            completeSurvey(surveyId: $surveyId, answers: $answers) {
                _id
                answers
                completedAt
            }
        }
    `;
    return {
        type: COMPLETE_SURVEY,
        payload: { ...survey },
        meta: {
            offline: {
                effect: { mutation, variables: { surveyId: survey._id, answers } }
            }
        }
    };
};
</code></pre>

The `offline`{:.language-javascript} `effect`{:.language-javascript} of this action contains our `completeSurvey`{:.language-javascript} Apollo mutation, along with the `surveyId`{:.language-javascript} and `answers`{:.language-javascript} variables needed to populate the mutation.

---- 

To tell Redux Offline how to handle this `offline`{:.language-javascript} `effect`{:.language-javascript} object, we’ll need to add an `effect`{:.language-javascript} callback to the [Redux Offline configuration](https://github.com/jevakallio/redux-offline#configuration) we [previously defined in our store](http://www.east5th.co/blog/2017/07/24/offline-graphql-queries-with-redux-offline-and-apollo/):

<pre class='language-javascript'><code class='language-javascript'>
offline({
    ...config,
    ...,
    effect: (effect, action) => {
        return client.mutate({ ...effect }).then(({ data }) => data);
    }
})
</code></pre>

At this point, we’ve instructed Redux Offline to manually trigger an Apollo mutation whenever we dispatch an action with an `offline`{:.language-javascript} `effect`{:.language-javascript}.

If Redux Offline detects that the client is disconnected from the server, it will throw this `effect`{:.language-javascript} into a queue to be retried later.

Let’s refactor our `Survey`{:.language-javascript} component to use our new action!

---- 

Now that our `COMPLETE_SURVEY`{:.language-javascript} action is completed, we’ll inject a dispatcher for our new action into our React component and use it to replace our direct call to the `completeSurvey`{:.language-javascript} mutation:

<pre class='language-javascript'><code class='language-javascript'>
onCompleteSurvey = () => {
    let surveyId = this.props.data.survey._id;
    let answers = this.state.answers;
    this.props.completeSurvey(surveyId, answers);
};

export default connect(null, { completeSurvey })(Survey);
</code></pre>

Now, instead of manually triggering the `completeSurvey`{:.language-javascript} mutation through Apollo, we’re dispatching our `COMPLETE_SURVEY`{:.language-javascript} action, which contains all of the information needed for Redux Offline to trigger our mutation either now or at some point in the future.

---- 

Once dispatched, if Redux Offline detects an active connection to the server, it will immediately carry out the `effect`{:.language-javascript} associated with our `COMPLETE_SURVEY`{:.language-javascript} action. This would kick off our `completeSurvey`{:.language-javascript} mutation, and all would be right in the world.

However, if Redux Offline detects that it’s disconnected from the server, it stores the action in a queue it refers to as its “outbox” (`offline.outbox`{:.language-javascript} in the Redux store). Once we reconnect to the server, Redux Offline works through its outbox in order, carrying out each queued mutation.

Now that we’ve refactored our survey application to manage submissions through an action managed by Redux Offline, we’ve successfully added partial offline support to our application.

Now we need to indicate what’s happening to the user.

{% include newsletter.html %}

## Managing Offline Data Locally

In order to inform the user that their survey is in a “pending” state, we’ll need to store these updated surveys somewhere on the client until their status is reconciled with the server.

Our first instinct might be to keep our updated surveys where we’re keeping the rest of our application’s data: in Apollo’s store. This would let us neatly retrieve our data through Apollo queries! Unfortunately, it’s very difficult to directly and arbitrarily update the contents of our Apollo store.

Instead, let’s store the surveys in a new section of our Redux store (under the `surveys`{:.language-javascript} key) that lives along side our Apollo store.

Creating and populating our new store with pending surveys is actually incredibly easy. First things first, let’s create a new reducer that listens for our `COMPLETE_SURVEY`{:.language-javascript} action and stores the corresponding survey in our new store:

<pre class='language-javascript'><code class='language-javascript'>
export default (state = [], action) => {
    switch (action.type) {
        case COMPLETE_SURVEY:
            return [...state, action.payload];
        default:
            return state;
    }
};
</code></pre>

If you remember our action creator function, you’ll remember that the `payload`{:.language-javascript} field of our `COMPLETE_SURVEY`{:.language-javascript} action contains the entire survey object. When we handle the `COMPLETE_SURVEY`{:.language-javascript} action, we simple concatenate that survey into our list of already completed surveys.

Next, we’ll need to wire this new reducer into our Redux store:

<pre class='language-javascript'><code class='language-javascript'>
import SurveyReducer from "...";

export const store = createStore(
    combineReducers({
        surveys: SurveyReducer,
        ...
    }),
    ...
</code></pre>

Perfect. Now every survey submitted while offline will be added to the `surveys`{:.language-javascript} array living in our Redux store.

## Displaying Pending Surveys

We can display these pending surveys to our users by subscribing to the `surveys`{:.language-javascript} field of our Redux store in our React components:

<pre class='language-javascript'><code class='language-javascript'>
export default connect(state => {
    return {
        pendingSurveys: state.survey
    };
})(PendingSurveyList);
</code></pre>

Now we can access this tangential list of `pendingSurveys`{:.language-javascript} from our components `props`{:.language-javascript} and render them just as we would any other survey in our application:

<pre class='language-javascript'><code class='language-javascript'>
render() {
    let pending = this.props.pendingSurveys;
    return (
        <div>
            <h2>Pending Surveys:</h2>
            {pending.map(survey => <Survey survey={survey}/>)}
        </div>
    );
}
</code></pre>

When we render this component, our users will see their list of pending surveys that have yet to be submitted to the server.

Great! 🎉

## Manually Managing Survey State

Unfortunately, there’s a problem with this solution. Even if we’re online when we submit our survey, it will be added to our `surveys`{:.language-javascript} store and shown as a pending survey in our UI.

This makes sense.

Because we’re using the `COMPLETE_SURVEY`{:.language-javascript} action to handle all survey completions, our action will fire on every survey we submit. These surveys pile up in our `surveys`{:.language-javascript} list and never get removed. Because we’re persisting and rehydrating our store to `localStorage`{:.language-javascript}, these surveys will persist even through page reloads!

We need a way to remove surveys from our `surveys`{:.language-javascript} store once they’ve been submitted to the server.

Thankfully, Redux Offline has a mechanism for handling this.

Let’s make a new action called `COMPLETE_SURVEY_COMMIT`{:.language-javascript}. We can instruct Redux Offline to dispatch this action once our mutation has been executed by specifying it in the `commit`{:.language-javascript} field of the `meta.offline`{:.language-javascript} portion of our action creator function:

<pre class='language-javascript'><code class='language-javascript'>
meta: {
    offline: {
        effect: { mutation, variables: { surveyId: survey._id, answers } },
        commit: { type: COMPLETE_SURVEY_COMMIT, meta: { surveyId: survey._id } }
    }
}
</code></pre>

Now we need to update our `surveys`{:.language-javascript} reducer to remove a survey from our `surveys`{:.language-javascript} store whenever a `COMPLETE_SURVEY_COMMIT`{:.language-javascript} action is handled:

<pre class='language-javascript'><code class='language-javascript'>
switch (action.type) {
    ...
    case COMPLETE_SURVEY_COMMIT:
        return _.chain(state).clone().filter(survey => survey._id !== action.meta.surveyId).value();
}
</code></pre>

That’s it!

Now our application is adding surveys to the `surveys`{:.language-javascript} store when they’re submitted (or marked as submitted while offline), and removing them once our `completeSurvey`{:.language-javascript} mutation is successfully executed.

With that, we’ve achieved our definition of success.

If submitted offline, surveys will go into a “pending” state, which is visible to the user, and will eventually be synced with the server, in order, once a connection is re-established.

## Credit Where Credit is Due

With a little bit of up-front planning and elbow grease, we’ve managed to add support for offline mutations to our React and Apollo-powered application. Combined with support for offline querying, we’ve managed to build out a reasonably powerful set of offline functionality!

To get a more wholistic understanding of the overall solution described here, be sure to check out [Manur’s](https://github.com/ReggaePanda) fantastic [“Redux Offline Examples” project on Github](https://github.com/ReggaePanda/redux-offline-examples). The `apollo-web`{:.language-javascript} project, in particular, was a major inspiration for this post and an invaluable resource for adding feature rich offline support to my Apollo application.

He even includes more advanced features in his `apollo-web`{:.language-javascript} project, such as reconciling locally generated IDs with server-generated IDs after a sync. Be sure to give the project a read through if you’re hungry for more details.

Thanks Manur, Apollo, Redux Offline, and Redux Persist!

