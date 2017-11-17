---
layout: post
title:  "Phoenix Todos - Finishing Authentication"
description: "Part five of our 'Phoenix Todos' Literate Commits series. Finishing up authentication."
author: "Pete Corey"
date:   2016-09-28
repo: "https://github.com/pcorey/phoenix_todos"
literate: true
tags: ["Elixir", "Phoenix", "Literate Commits", "Phoenix Todos", "Authentication"]
---

# [Client-side Validation Bug]({{page.repo}}/commit/7168aa4b3b1d1ed7d6c1a57e4654961c2b6da16f)

You may have noticed that with our previous solution, only server-side
errors would show on the sign-up form. Client-side validation was taking
place in our `onSubmit`{:.language-javascript} handler, but errors were never propagating to the
UI!

This was happening because we were storing client-side validation errors
in the `JoinPage`{:.language-javascript} component's state:

<pre class='language-javascript'><code class='language-javascript'>
this.setState({ errors });
</code></pre>

However, our `render`{:.language-javascript} function was pulling errors out of the `props`{:.language-javascript}
passed into the component by Redux.

Our component didn't have a single source of truth for the `errors`{:.language-javascript}
array.

The fix to this issue is fairly elegant. We can pull the validation
checks out of the `onSubmit`{:.language-javascript} handler and move them into our `signUp`{:.language-javascript}
action. If we detect any validation issues, we'll return
them to the `JoinPage`{:.language-javascript} component by dispatching a `SIGN_UP_FAILURE`{:.language-javascript}
action:

<pre class='language-javascript'><code class='language-javascript'>
if (errors.length) {
  return dispatch(signUpFailure(errors));
}
</code></pre>

From our component's perspective, all errors are seen as
server-side errors and render correctly.


<pre class='language-javascriptDiff'><p class='information'>web/static/js/actions/index.js</p><code class='language-javascriptDiff'>
 ...
     dispatch(signUpRequest());
+
+    let errors = [];
+    if (!email) {
+      errors.push({ email: "Email required" });
+    }
+    if (!password) {
+      errors.push({ password: "Password required" });
+    }
+    if (password_confirm !== password) {
+      errors.push({ password_confirm: "Please confirm your password" });
+    }
+    if (errors.length) {
+      return Promise.resolve(dispatch(signUpFailure(errors)));
+    }
+
     return fetch("/api/users", {
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/pages/AuthPageJoin.jsx</p><code class='language-javascriptDiff'>
 ...
     const password_confirm = this.refs.password_confirm.value;
-    const errors = {};
-
-    if (!email) {
-      errors.email = 'Email required';
-    }
-    if (!password) {
-      errors.password = 'Password required';
-    }
-    if (password_confirm !== password) {
-      errors.password_confirm = 'Please confirm your password';
-    }
-
-    this.setState({ errors });
-    if (Object.keys(errors).length) {
-      return;
-    }
 
</code></pre>



# [Sign-out Actions]({{page.repo}}/commit/c399f07577f24c75d1fae93e39bee3f9ac6868a1)

Now that we've established the pattern our Redux actions and reducers
will follow, we can start implementing our other authentication
features.

To give users the ability to sign out, we'll start by creating three new
actions: `SIGN_OUT_REQUEST`{:.language-javascript}, `SIGN_OUT_SUCCESS`{:.language-javascript}, and `SIGN_OUT_FAILURE`{:.language-javascript}.

Along with the action creators for each of these actions, we'll also
create an asynchronous action function called `signOut`{:.language-javascript} which accepts
the current user's JWT as an argument. This function makes a `DELETE`{:.language-javascript}
request to our `/api/sessions`{:.language-javascript} endpoint, sending the `jwt`{:.language-javascript} in the
`"Authorization"`{:.language-javascript} header:

<pre class='language-javascript'><code class='language-javascript'>
return fetch("/api/sessions", {
  method: "delete",
  headers: {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": jwt
  }
})
</code></pre>

Our `SIGN_OUT_SUCCESS`{:.language-javascript} reducer clears the `user`{:.language-javascript} and `jwt`{:.language-javascript} fields in
our application state:

<pre class='language-javascript'><code class='language-javascript'>
case SIGN_OUT_SUCCESS:
  return Object.assign({}, state, {
    user: undefined,
    jwt: undefined
  });
</code></pre>

And the `SIGN_OUT_FAILURE`{:.language-javascript} resolver will save any errors from the server
into `errors`{:.language-javascript}.

Now that our sign-out actions and resolvers are set, we can wire our
`App`{:.language-javascript} component up to our Redux store with a call to `connect`{:.language-javascript}, and replace
our old `Meteor.logout()`{:.language-javascript} code with a call to our `signOut`{:.language-javascript} thunk:

<pre class='language-javascript'><code class='language-javascript'>
this.props.signOut(this.props.jwt)
</code></pre>

With that, authenticated users have the ability to sign out of our application!


<pre class='language-javascriptDiff'><p class='information'>web/static/js/actions/index.js</p><code class='language-javascriptDiff'>
 ...
 
+export const SIGN_OUT_REQUEST = "SIGN_OUT_REQUEST";
+export const SIGN_OUT_SUCCESS = "SIGN_OUT_SUCCESS";
+export const SIGN_OUT_FAILURE = "SIGN_OUT_FAILURE";
+
 export function signUpRequest() {
 ...
 
+export function signOutRequest() {
+  return { type: SIGN_OUT_REQUEST };
+}
+
+export function signOutSuccess() {
+  return { type: SIGN_OUT_SUCCESS };
+}
+
+export function signOutFailure(errors) {
+  return { type: SIGN_OUT_FAILURE, errors };
+}
+
 export function signUp(email, password, password_confirm) {
 ...
 }
+
+export function signOut(jwt) {
+  return (dispatch) => {
+    dispatch(signOutRequest());
+    return fetch("/api/sessions", {
+      method: "delete",
+      headers: {
+        "Accept": "application/json",
+        "Content-Type": "application/json",
+        "Authorization": jwt
+      }
+    })
+      .then((res) => res.json())
+      .then((res) => {
+        if (res.errors) {
+          dispatch(signOutFailure(res.errors));
+          return false;
+        }
+        else {
+          dispatch(signOutSuccess());
+          return true;
+        }
+      });
+  }
+}
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/layouts/App.jsx</p><code class='language-javascriptDiff'>
 ...
 import Loading from '../components/Loading.jsx';
+import { connect } from "react-redux";
+import { signOut } from "../actions";
 
 ...
 
-export default class App extends React.Component {
+class App extends React.Component {
   constructor(props) {
 ...
   logout() {
-    Meteor.logout();
-
-    // if we are on a private list, we'll need to go to a public one
-    if (this.props.params.id) {
-      const list = Lists.findOne(this.props.params.id);
-      if (list.userId) {
-        const publicList = Lists.findOne({ userId: { $exists: false } });
-        this.context.router.push(`/lists/${ publicList._id }`{:.language-javascript});
-      }
-    }
+    this.props.signOut(this.props.jwt)
+      .then((success) => {
+        if (success) {
+          // if we are on a private list, we'll need to go to a public one
+          if (this.props.params.id) {
+            const list = Lists.findOne(this.props.params.id);
+            if (list.userId) {
+              const publicList = Lists.findOne({ userId: { $exists: false } });
+              this.context.router.push(`/lists/${ publicList._id }`{:.language-javascript});
+            }
+          }
+        }
+      });
   }
 ...
 };
+
+export default connect(
+  (state) => state,
+  (dispatch) => ({
+    signOut: (jwt) => {
+      return dispatch(signOut(jwt));
+   }
+  })
+)(App);
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/reducers/index.js</p><code class='language-javascriptDiff'>
 ...
   SIGN_UP_FAILURE,
+  SIGN_OUT_REQUEST,
+  SIGN_OUT_SUCCESS,
+  SIGN_OUT_FAILURE,
 } from "../actions";
 ...
 });
+
+  case SIGN_OUT_REQUEST:
+    return state;
+  case SIGN_OUT_SUCCESS:
+    return Object.assign({}, state, {
+      user: undefined,
+      jwt: undefined
+    });
+  case SIGN_OUT_FAILURE:
+    return Object.assign({}, state, {
+      errors: action.errors
+    });
   default:
</code></pre>



# [Persisting Users]({{page.repo}}/commit/4a00803239a6c092716e2ce1f6a1c01b3ad731a8)

Unfortunately, if a user refreshes the page after signing up, they'll
lose their authenticated status. This means a user would have to sign-in
every time they load the application.

This issue is caused by the fact that we're saving the `user`{:.language-javascript} and
`jwt`{:.language-javascript} objects exclusively in our in-memory application state. When we
reload the page, that state is reset.

Thankfully, we can fix this issue fairly quickly.

In our `signUp`{:.language-javascript} thunk, once we recieve a successful response from the
server, we can store the `user`{:.language-javascript} and `jwt`{:.language-javascript} objects into local storage.

<pre class='language-javascript'><code class='language-javascript'>
localStorage.setItem("user", JSON.stringify(res.user));
localStorage.setItem("jwt", res.jwt);
</code></pre>

Similarly, when a user signs out we'll clear these local storage
entries:

<pre class='language-javascript'><code class='language-javascript'>
localStorage.removeItem("user");
localStorage.removeItem("jwt");
</code></pre>

Now we can popoulate our `initialState`{:.language-javascript} with these `user`{:.language-javascript} and `jwt`{:.language-javascript}
values, if they exist in local storage:

<pre class='language-javascript'><code class='language-javascript'>
const user = localStorage.getItem("user");
const jwt = localStorage.getItem("jwt");
</code></pre>

<pre class='language-javascript'><code class='language-javascript'>
const initialState = {
  user: user ? JSON.parse(user) : user,
  jwt,
  ...
</code></pre>

And now when a authenticated user refreshes the page, they'll stay
authenticated.


<pre class='language-javascriptDiff'><p class='information'>web/static/js/actions/index.js</p><code class='language-javascriptDiff'>
 ...
         else {
+          localStorage.setItem("user", JSON.stringify(res.user));
+          localStorage.setItem("jwt", res.jwt);
           dispatch(signUpSuccess(res.user, res.jwt));
 ...
         else {
+          localStorage.removeItem("user");
+          localStorage.removeItem("jwt");
           dispatch(signOutSuccess());
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/reducers/index.js</p><code class='language-javascriptDiff'>
 ...
 
+const user = localStorage.getItem("user");
+const jwt = localStorage.getItem("jwt");
+
 const initialState = {
-  user: undefined,
-  jwt: undefined,
+  user: user ? JSON.parse(user) : user,
+  jwt,
   loading: false,
</code></pre>



# [Sign In Front-end]({{page.repo}}/commit/7995365aa443b01a80244255daa97f7c528fde0d)

Finally, we can continue the same pattern we've been following and
implement our sign-in functionality.

We'll start by copying over the `SignInPage`{:.language-javascript} component from our Meteor
application. Next, we'll make three new actions: `SIGN_IN_REQUEST`{:.language-javascript},
`SIGN_IN_SUCCESS`{:.language-javascript}, and `SIGN_IN_FAILURE`{:.language-javascript}.

In addition to our actions, we'll make an asynchronous action creator
that sends a `POST`{:.language-javascript} request to `/api/sessions`{:.language-javascript} to initiate a sign-in.

The reducers for our new actions will be identical to our sign-up
reducers, so we'll save some typing and re-use them:

<pre class='language-javascript'><code class='language-javascript'>
case SIGN_IN_SUCCESS:
case SIGN_UP_SUCCESS:
  return Object.assign({}, state, {
    user: action.user,
    jwt: action.jwt
  });
...
</code></pre>

Lastly, we can replace the call to `Meteor.loginWithPassword`{:.language-javascript} with a
call to our `signIn`{:.language-javascript} helper. If this call is successful, we'll redirect
to `/`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
this.state.signIn(email, password)
  .then((success) => {
    if (success) {
      this.context.router.push('/');
    }
  });
</code></pre>

Otherwise, we'll render any errors we find in `this.props.errors`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
const errors = (this.props.errors || []).reduce((errors, error) => {
  return Object.assign(errors, error);
}, {});
</code></pre>

And with those changes, a user can now sign up, log out, and sign into
our application!


<pre class='language-javascriptDiff'><p class='information'>web/static/js/actions/index.js</p><code class='language-javascriptDiff'>
 ...
 
+export const SIGN_IN_REQUEST = "SIGN_IN_REQUEST";
+export const SIGN_IN_SUCCESS = "SIGN_IN_SUCCESS";
+export const SIGN_IN_FAILURE = "SIGN_IN_FAILURE";
+
 export function signUpRequest() {
 ...
 
+export function signInRequest() {
+  return { type: SIGN_IN_REQUEST };
+}
+
+export function signInSuccess() {
+  return { type: SIGN_IN_SUCCESS };
+}
+
+export function signInFailure(errors) {
+  return { type: SIGN_IN_FAILURE, errors };
+}
+
 export function signUp(email, password, password_confirm) {
 ...
 }
+
+export function signIn(email, password) {
+  return (dispatch) => {
+    dispatch(signInRequest());
+
+    let errors = [];
+    if (!email) {
+      errors.push({ email: "Email required" });
+    }
+    if (!password) {
+      errors.push({ password: "Password required" });
+    }
+    if (errors.length) {
+      return Promise.resolve(dispatch(signInFailure(errors)));
+    }
+
+    return fetch("/api/sessions", {
+      method: "post",
+      headers: {
+        "Accept": "application/json",
+        "Content-Type": "application/json",
+      },
+      body: JSON.stringify({ email, password })
+    })
+      .then((res) => res.json())
+      .then((res) => {
+        if (res.errors) {
+          dispatch(signInFailure(res.errors));
+          return false;
+        }
+        else {
+          localStorage.setItem("user", JSON.stringify(res.user));
+          localStorage.setItem("jwt", res.jwt);
+          dispatch(signInSuccess(res.user, res.jwt));
+          return true;
+        }
+      });
+  }
+}
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/pages/AuthPageSignIn.jsx</p><code class='language-javascriptDiff'>
+import React from 'react';
+import AuthPage from './AuthPage.jsx';
+import { Link } from 'react-router';
+import { connect } from "react-redux";
+import { signIn } from "../actions";
+
+class SignInPage extends React.Component {
+  constructor(props) {
+    super(props);
+    this.state = {
+      signIn: props.signIn
+    };
+    this.onSubmit = this.onSubmit.bind(this);
+  }
+
+  onSubmit(event) {
+    event.preventDefault();
+    const email = this.refs.email.value;
+    const password = this.refs.password.value;
+
+    this.state.signIn(email, password)
+      .then((success) => {
+        if (success) {
+          this.context.router.push('/');
+        }
+      });
+  }
+
+  render() {
+    const errors = (this.props.errors || []).reduce((errors, error) => {
+      return Object.assign(errors, error);
+    }, {});
+    const errorMessages = Object.keys(errors).map(key => errors[key]);
+    const errorClass = key => errors[key] && 'error';
+
+    const content = (
+      <div className="wrapper-auth">
+        <h1 className="title-auth">Sign In.</h1>
+        <p className="subtitle-auth" >Signing in allows you to view private lists</p>
+        <form onSubmit={this.onSubmit}>
+          <div className="list-errors">
+            {errorMessages.map(msg => (
+              <div className="list-item" key={msg}>{msg}</div>
+            ))}
+          </div>
+          <div className={`input-symbol ${errorClass('email')}`{:.language-javascript}}>
+            <input type="email" name="email" ref="email" placeholder="Your Email"/>
+            <span className="icon-email" title="Your Email"></span>
+          </div>
+          <div className={`input-symbol ${errorClass('password')}`{:.language-javascript}}>
+            <input type="password" name="password" ref="password" placeholder="Password"/>
+            <span className="icon-lock" title="Password"></span>
+          </div>
+          <button type="submit" className="btn-primary">Sign in</button>
+        </form>
+      </div>
+    );
+
+    const link = <Link to="/join" className="link-auth-alt">Need an account? Join Now.</Link>;
+
+    return <AuthPage content={content} link={link}/>;
+  }
+}
+
+SignInPage.contextTypes = {
+  router: React.PropTypes.object,
+};
+
+export default connect(
+  (state) => {
+    return {
+      errors: state.errors
+    }
+  },
+  (dispatch) => {
+    return {
+      signIn: (email, password) => {
+        return dispatch(signIn(email, password));
+      }
+    };
+  }
+)(SignInPage);
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/reducers/index.js</p><code class='language-javascriptDiff'>
 ...
   SIGN_OUT_FAILURE,
+  SIGN_IN_REQUEST,
+  SIGN_IN_SUCCESS,
+  SIGN_IN_FAILURE,
 } from "../actions";
 ...
   switch (action.type) {
+  case SIGN_IN_REQUEST:
   case SIGN_UP_REQUEST:
     return state;
+  case SIGN_IN_SUCCESS:
   case SIGN_UP_SUCCESS:
 ...
     });
+  case SIGN_IN_FAILURE:
   case SIGN_UP_FAILURE:
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/routes.jsx</p><code class='language-javascriptDiff'>
 ...
 import AppContainer from './containers/AppContainer.jsx';
+import AuthPageSignIn from './pages/AuthPageSignIn.jsx';
 import AuthPageJoin from './pages/AuthPageJoin.jsx';
 ...
         <Route path="/" component={AppContainer}>
+        <Route path="signin" component={AuthPageSignIn}/>
         <Route path="join" component={AuthPageJoin}/>
</code></pre>


# Final Thoughts

Now that we’re getting more comfortable with React, it’s becoming more and more enjoyable to use.

The concept of a single application state, while undeniably weird at first, really simplifies a lot of complexities that can show up in more complicated applications. For example, having a single, canonical `errors`{:.language-javascript} array that holds any error messages that might currently exist is amazing!

Coming from [Blaze](http://blazejs.org/), the incredibly explicit data flow in a Redux-style application is comforting. It’s completely clear where each action is initiated and how it effects the application’s state.

Gone are the days of racking your brain trying to conceptualize a tree of reactive updates that brought your application into its current state.

Now that the authentication piece is finished (finally), next week we’ll move onto implementing the meat of our application!
