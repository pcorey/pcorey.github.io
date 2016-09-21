---
layout: post
title:  "Phoenix Todos - Transition to Redux"
date:   2016-09-21
repo: "https://github.com/pcorey/phoenix_todos"
tags: ["literate-commits"]
---

# [Front-end Join]({{page.repo}}/commit/49c4d2b33507d1397be968699f8cf4505be88eb8)

Now that our back-end is shored up, we can turn our attention to the
front-end side of the sign-up functionality.

The first thing we need to do is add the `"join"`{:.language-javascript} route to our router:

<pre class='language-javascript'><code class='language-javascript'>
<Route path="join" component={AuthPageJoin}/>
</code></pre>

We can copy the majority of the `AuthPageJoin`{:.language-javascript} component from the [Meteor Todos](https://github.com/meteor/todos/tree/react) project.

One small change we need to make is to rename all references to
`confirm`{:.language-javascript} to `password_confirm`{:.language-javascript} to match what our `User.changeset`{:.language-elixir}
expects.

We'll also need to refactor how we create the user's account. Instead of
using Meteor's `Accounts`{:.language-javascript} system, we'll need to manually make a `POST`{:.language-javascript}
request to `"/api/users"`{:.language-javascript}, passing the user provided `email`{:.language-javascript},
`password`{:.language-javascript}, and `password_confirm`{:.language-javascript} fields:

<pre class='language-javascript'><code class='language-javascript'>
fetch("/api/users", {
  method: "post",
  headers: {
    "Accept": "application/json",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    user: {
      email,
      password,
      password_confirm
    }
  })
})
</code></pre>

If we receive any `errors`{:.language-javascript} from the server, we can drop them directly
into the `errors`{:.language-javascript} field of our component's state:

<pre class='language-javascript'><code class='language-javascript'>
let errors = json.errors.reduce((errors, error) => {
  return Object.assign(errors, error);
});
this.setState({errors});
</code></pre>

Otherwise, if everything went well we'll recieve the newly signed up
user's JWT and user object in the `json.jwt`{:.language-javascript} and `json.user`{:.language-javascript} fields.


<pre class='language-javascriptDiff'><p class='information'>web/static/js/pages/AuthPage.jsx</p><code class='language-javascriptDiff'>
+import React from 'react';
+import MobileMenu from '../components/MobileMenu.jsx';
+
+// a common layout wrapper for auth pages
+const AuthPage = ({ content, link }) => (
+  &lt;div className="page auth">
+    &lt;nav>
+      &lt;MobileMenu/>
+    &lt;/nav>
+    &lt;div className="content-scrollable">
+      {content}
+      {link}
+    &lt;/div>
+  &lt;/div>
+);
+
+AuthPage.propTypes = {
+  content: React.PropTypes.element,
+  link: React.PropTypes.element,
+};
+
+export default AuthPage;
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/pages/AuthPageJoin.jsx</p><code class='language-javascriptDiff'>
+import React from 'react';
+import AuthPage from './AuthPage.jsx';
+import { Link } from 'react-router';
+
+export default class JoinPage extends React.Component {
+  constructor(props) {
+    super(props);
+    this.state = { errors: {} };
+    this.onSubmit = this.onSubmit.bind(this);
+  }
+
+  onSubmit(event) {
+    event.preventDefault();
+    const email = this.refs.email.value;
+    const password = this.refs.password.value;
+    const password_confirm = this.refs.password_confirm.value;
+    const errors = {};
+
+    if (!email) {
+      errors.email = 'Email required';
+    }
+    if (!password) {
+      errors.password = 'Password required';
+    }
+    if (password_confirm !== password) {
+      errors.password_confirm = 'Please confirm your password';
+    }
+
+    this.setState({ errors });
+    if (Object.keys(errors).length) {
+      return;
+    }
+
+    fetch("/api/users", {
+      method: "post",
+      headers: {
+        "Accept": "application/json",
+        "Content-Type": "application/json",
+      },
+      body: JSON.stringify({
+        user: {
+          email,
+          password,
+          password_confirm
+        }
+      })
+    })
+      .then((res) => {
+        res
+          .json()
+          .then((json) => {
+            if (json.errors) {
+              let errors = json.errors.reduce((errors, error) => {
+                return Object.assign(errors, error);
+              });
+              this.setState({errors});
+            }
+            else {
+              // TODO: Save `json.user`{:.language-javascript} and `json.jwt`{:.language-javascript} to state
+              this.context.router.push('/');
+            }
+          });
+      });
+  }
+
+  render() {
+    const { errors } = this.state;
+    const errorMessages = Object.keys(errors).map(key => errors[key]);
+    const errorClass = key => errors[key] && 'error';
+
+    const content = (
+      &lt;div className="wrapper-auth">
+        &lt;h1 className="title-auth">Join.&lt;/h1>
+        &lt;p className="subtitle-auth" >Joining allows you to make private lists&lt;/p>
+        &lt;form onSubmit={this.onSubmit}>
+          &lt;div className="list-errors">
+            {errorMessages.map(msg => (
+              &lt;div className="list-item" key={msg}>{msg}&lt;/div>
+            ))}
+          &lt;/div>
+          &lt;div className={`input-symbol ${errorClass('email')}`{:.language-javascript}}>
+            &lt;input type="email" name="email" ref="email" placeholder="Your Email"/>
+            &lt;span className="icon-email" title="Your Email">&lt;/span>
+          &lt;/div>
+          &lt;div className={`input-symbol ${errorClass('password')}`{:.language-javascript}}>
+            &lt;input type="password" name="password" ref="password" placeholder="Password"/>
+            &lt;span className="icon-lock" title="Password">&lt;/span>
+          &lt;/div>
+          &lt;div className={`input-symbol ${errorClass('password_confirm')}`{:.language-javascript}}>
+            &lt;input type="password" name="password_confirm" ref="password_confirm" placeholder="Confirm Password"/>
+            &lt;span className="icon-lock" title="Confirm Password">&lt;/span>
+          &lt;/div>
+          &lt;button type="submit" className="btn-primary">Join Now&lt;/button>
+        &lt;/form>
+      &lt;/div>
+    );
+
+    const link = &lt;Link to="/signin" className="link-auth-alt">Have an account? Sign in&lt;/Link>;
+
+    return &lt;AuthPage content={content} link={link}/>;
+  }
+}
+
+JoinPage.contextTypes = {
+  router: React.PropTypes.object,
+};
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/routes.jsx</p><code class='language-javascriptDiff'>
 ...
 import AppContainer from './containers/AppContainer.jsx';
+import AuthPageJoin from './pages/AuthPageJoin.jsx';
 import NotFoundPage from './pages/NotFoundPage.jsx';
 ...
     &lt;Route path="/" component={AppContainer}>
+      &lt;Route path="join" component={AuthPageJoin}/>
       &lt;Route path="*" component={NotFoundPage}/>
</code></pre>



# [Enter Redux]({{page.repo}}/commit/166cc7713a563707760c115ccf5ba43f4b76a292)

Now that we're receiving the newly signed up user and JWT from the
server, we'll need some way of updating our client-side application
state.

Previously, we were doing this reactively with [Meteor's
`createContainer`{:.language-javascript}](https://guide.meteor.com/react.html#using-createContainer)
function. Since we're not using Meteor, this is no longer an option.

Instead, we'll switch to [Redux](http://redux.js.org/) for all of our state management needs.

The first thing we need to do to get started with Redux is to install our
NPM dependencies:

<pre class='language-bash'><code class='language-bash'>
npm install --save redux react-redux
</code></pre>

Now we need to think about the ["shape" of our application's state](http://redux.js.org/docs/basics/Reducers.html#designing-the-state-shape).
Thankfully, we don't have to think too hard. The shape has been
[decided for us](https://github.com/meteor/todos/blob/react/imports/ui/containers/AppContainer.jsx#L13-L20) in the old `AppContainer`{:.language-javascript} component. We'll define this
"state shape" in a new file, `/web/static/js/reducers.js`{:.language-bash}:

<pre class='language-javascript'><code class='language-javascript'>
const initialState = {
  user: undefined,
  jwt: undefined,
  loading: false,
  connected: true,
  menuOpen: false,
  lists: []
};
</code></pre>

Notice that we slipped in a new field: `jwt`{:.language-javascript}. We'll use this field to
hold the JWT we get as a response from our server when signing in or
signing up.

Now we need to define our
[reducer](http://redux.js.org/docs/basics/Reducers.html):

<pre class='language-javascript'><code class='language-javascript'>
export default (state = initialState, action) => {
  switch(action.type) {
    default:
      return state;
  }
}
</code></pre>

Since we don't have any
[actions](http://redux.js.org/docs/basics/Actions.html) defined yet, our
reducer is as simple as it gets.

Now that we have our reducer defined, we can create our
[store](http://redux.js.org/docs/basics/Store.html) in `app.js`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
const store = createStore(reducers);
</code></pre>

We'll pass our store into our `renderRoutes`{:.language-javascript} function so we can wrap our
router in a `<Provider>`{:.language-javascript} component:

<pre class='language-javascript'><code class='language-javascript'>
&lt;Provider store={store}>
  &lt;Router ...>
    ...
  &lt;/Router>
&lt;/Provider>
</code></pre>

Lastly, we'll use `subscribe`{:.language-javascript} to trigger a re-render any time our
`store`{:.language-javascript} changes.

Now that our Redux store is all wired up, we can pull the state
initialization out of our `AppContainer`{:.language-javascript} component and connect it to our
Redux store:

<pre class='language-javascript'><code class='language-javascript'>
const AppContainer = connect(state => state)(App);
</code></pre>

Now our application state is passed from our store, into our
`AppContainer`{:.language-javascript}, and down into the `App`{:.language-javascript} component.


<pre class='language-javascriptDiff'><p class='information'>package.json</p><code class='language-javascriptDiff'>
     "react-dom": "^15.3.1",
+    "react-redux": "^4.4.5",
     "react-router": "^2.7.0",
+    "redux": "^3.6.0",
     "uglify-js-brunch": ">= 1.0 &lt; 1.8"
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/app.js</p><code class='language-javascriptDiff'>
-import { render } from "react-dom";
+import ReactDOM from "react-dom";
+import reducers from "./reducers";
+import { createStore } from "redux";
 import { renderRoutes } from "./routes.jsx";
 
-render(renderRoutes(), document.getElementById("app"));
+const store = createStore(reducers);
+const el = document.getElementById("app");
+
+function render() {
+  ReactDOM.render(renderRoutes(store), el);
+}
+
+render();
+store.subscribe(render);
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/containers/AppContainer.jsx</p><code class='language-javascriptDiff'>
 import App from '../layouts/App.jsx';
-import React from 'react';
+import { connect } from "react-redux";
 
-export default class AppContainer extends React.Component {
-  constructor(props) {
-    super(props);
-    this.state = {
-      user: undefined,
-      loading: false,
-      connected: true,
-      menuOpen: false,
-      lists: []
-    };
-  }
+const AppContainer = connect(state => state)(App);
 
-  render() {
-    return (&lt;App {...this.state} {...this.props}/>);
-  }
-};
+export default AppContainer;
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/reducers/index.js</p><code class='language-javascriptDiff'>
+const initialState = {
+  user: undefined,
+  jwt: undefined,
+  loading: false,
+  connected: true,
+  menuOpen: false,
+  lists: []
+};
+
+export default (state = initialState, action) => {
+  switch (action.type) {
+    default:
+      return state;
+  }
+}
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/routes.jsx</p><code class='language-javascriptDiff'>
 ...
 import { Router, Route, browserHistory } from 'react-router';
+import { Provider } from "react-redux";
 
 ...
 
-export const renderRoutes = () => (
-  &lt;Router history={browserHistory}>
-    &lt;Route path="/" component={AppContainer}>
-      &lt;Route path="join" component={AuthPageJoin}/>
-      &lt;Route path="*" component={NotFoundPage}/>
-    &lt;/Route>
-  &lt;/Router>
+export const renderRoutes = (store) => (
+  &lt;Provider store={store}>
+    &lt;Router history={browserHistory}>
+        &lt;Route path="/" component={AppContainer}>
+        &lt;Route path="join" component={AuthPageJoin}/>
+        &lt;Route path="*" component={NotFoundPage}/>
+        &lt;/Route>
+    &lt;/Router>
+  &lt;/Provider>
 );
</code></pre>



# [Sign Up Actions]({{page.repo}}/commit/5211d73d1214a5e139138b48998ae344c73d93fb)

Now that we're using Redux, we'll want to create actions that describe
the sign-up process. Because sign-up is an [asynchronous process](http://redux.js.org/docs/advanced/AsyncActions.html), we'll need three actions: `SIGN_UP_REQUEST`{:.language-javascript},
`SIGN_UP_SUCCESS`{:.language-javascript}, and `SIGN_UP_FAILURE`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
export function signUpRequest() {
  return { type: SIGN_UP_REQUEST };
}

export function signUpSuccess(user, jwt) {
  return { type: SIGN_UP_SUCCESS, user, jwt };
}

export function signUpFailure(errors) {
  return { type: SIGN_UP_FAILURE, errors };
}
</code></pre>

We'll also pull the `fetch`{:.language-javascript} call that we're using to hit our
`/api/users`{:.language-javascript} endpoint into a helper method called `signUp`{:.language-javascript}. `signUp`{:.language-javascript}
will dispatch a `SIGN_UP_REQUEST`{:.language-javascript} action, followed by either a
`SIGN_UP_SUCCESS`{:.language-javascript} or `SIGN_UP_FAILURE`{:.language-javascript}, depending on the result of our
`fetch`{:.language-javascript}.

Because we're using asynchronous actions, we'll need to pull in the
[Redux Thunk](https://github.com/gaearon/redux-thunk) middleware:

<pre class='language-javascript'><code class='language-javascript'>
npm install --save redux-thunk
</code></pre>

And then wire it into our store:

<pre class='language-javascript'><code class='language-javascript'>
const store = createStore(
  reducers,
  applyMiddleware(thunkMiddleware)
);
</code></pre>

Now that our actions are defined, we'll need to create a matching set of
reducers. The `SIGN_UP_REQUEST`{:.language-javascript} reducer does nothing:

<pre class='language-javascript'><code class='language-javascript'>
case SIGN_UP_REQUEST:
  return state;
</code></pre>

The `SIGN_UP_SUCCESS`{:.language-javascript} reducer stores the returned `user`{:.language-javascript} and `jwt`{:.language-javascript}
object in our application state:

<pre class='language-javascript'><code class='language-javascript'>
case SIGN_UP_SUCCESS:
  return Object.assign({}, state, {
    user: action.user,
    jwt: action.jwt
  });
</code></pre>

And the `SIGN_UP_FAILURE`{:.language-javascript} reducer stores the returned `errors`{:.language-javascript} (you'll
also notice that we added an `errors`{:.language-javascript} field to our `initialState`{:.language-javascript}):

<pre class='language-javascript'><code class='language-javascript'>
case SIGN_UP_FAILURE:
  return Object.assign({}, state, {
    errors: action.errors
  });
</code></pre>

Great. Now we can wrap our `JoinPage`{:.language-javascript} component in a Redux `connect`{:.language-javascript}
wrapper and pull in `errors`{:.language-javascript} from our application state:

<pre class='language-javascript'><code class='language-javascript'>
(state) => {
  return {
    errors: state.errors
  }
}
</code></pre>

And create a helper that dispatches our `signUp`{:.language-javascript} asynchronous action:

<pre class='language-javascript'><code class='language-javascript'>
(dispatch) => {
  return {
    signUp: (email, password, password_confirm) => {
      return dispatch(signUp(email, password, password_confirm));
    }
  };
}
</code></pre>

Now that `JoinPage`{:.language-javascript} is subscribed to changes to our store, we'll need to
move the logic that transforms our `errors`{:.language-javascript} into a usable form from its
`constructor`{:.language-javascript} into the `render`{:.language-javascript} function, and replace the old `fetch`{:.language-javascript}
logic with a call to `signUp`{:.language-javascript}.

After trying to sign up with these changes, we'll see a runtime error in
our `UserMenu`{:.language-javascript} component. It's expecting the newly signed-in user's
email address to be in `user.emails[0].address`{:.language-javascript}. Changing this component
to pull the address from `user.email`{:.language-javascript} fixes the errors.

The sign-up functionality is complete!


<pre class='language-javascriptDiff'><p class='information'>package.json</p><code class='language-javascriptDiff'>
     "redux": "^3.6.0",
+    "redux-thunk": "^2.1.0",
     "uglify-js-brunch": ">= 1.0 &lt; 1.8"
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/actions/index.js</p><code class='language-javascriptDiff'>
+export const SIGN_UP_REQUEST = "SIGN_UP_REQUEST";
+export const SIGN_UP_SUCCESS = "SIGN_UP_SUCCESS";
+export const SIGN_UP_FAILURE = "SIGN_UP_FAILURE";
+
+export function signUpRequest() {
+  return { type: SIGN_UP_REQUEST };
+}
+
+export function signUpSuccess(user, jwt) {
+  return { type: SIGN_UP_SUCCESS, user, jwt };
+}
+
+export function signUpFailure(errors) {
+  return { type: SIGN_UP_FAILURE, errors };
+}
+
+export function signUp(email, password, password_confirm) {
+  return (dispatch) => {
+    dispatch(signUpRequest());
+    return fetch("/api/users", {
+      method: "post",
+      headers: {
+        "Accept": "application/json",
+        "Content-Type": "application/json",
+      },
+      body: JSON.stringify({
+        user: {
+          email,
+          password,
+          password_confirm
+        }
+      })
+    })
+      .then((res) => res.json())
+      .then((res) => {
+        if (res.errors) {
+          dispatch(signUpFailure(res.errors));
+          return false;
+        }
+        else {
+          dispatch(signUpSuccess(res.user, res.jwt));
+          return true;
+        }
+      });
+  }
+}
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/app.js</p><code class='language-javascriptDiff'>
 ...
 import reducers from "./reducers";
-import { createStore } from "redux";
+import { createStore, applyMiddleware } from "redux";
 import { renderRoutes } from "./routes.jsx";
+import thunkMiddleware from "redux-thunk";
 
-const store = createStore(reducers);
+const store = createStore(
+  reducers,
+  applyMiddleware(thunkMiddleware)
+);
 const el = document.getElementById("app");
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/components/UserMenu.jsx</p><code class='language-javascriptDiff'>
 ...
     const { user, logout } = this.props;
-    const email = user.emails[0].address;
+    const email = user.email;
     const emailLocalPart = email.substring(0, email.indexOf('@'));
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/pages/AuthPageJoin.jsx</p><code class='language-javascriptDiff'>
 ...
 import { Link } from 'react-router';
+import { connect } from "react-redux";
+import { signUp } from "../actions";
 
-export default class JoinPage extends React.Component {
+class JoinPage extends React.Component {
   constructor(props) {
     super(props);
-    this.state = { errors: {} };
+    this.state = {
+      signUp: props.signUp
+    };
     this.onSubmit = this.onSubmit.bind(this);
 ...
 
-    fetch("/api/users", {
-      method: "post",
-      headers: {
-        "Accept": "application/json",
-        "Content-Type": "application/json",
-      },
-      body: JSON.stringify({
-        user: {
-          email,
-          password,
-          password_confirm
+    this.state.signUp(email, password, password_confirm)
+      .then((success) => {
+        if (success) {
+          this.context.router.push('/');
         }
-      })
-    })
-      .then((res) => {
-        res
-          .json()
-          .then((json) => {
-            if (json.errors) {
-              let errors = json.errors.reduce((errors, error) => {
-                return Object.assign(errors, error);
-              });
-              this.setState({errors});
-            }
-            else {
-              // TODO: Save `json.user`{:.language-javascript} and `json.jwt`{:.language-javascript} to state
-              this.context.router.push('/');
-            }
-          });
       });
 ...
   render() {
-    const { errors } = this.state;
+    const errors = (this.props.errors || []).reduce((errors, error) => {
+      return Object.assign(errors, error);
+    }, {});
     const errorMessages = Object.keys(errors).map(key => errors[key]);
 ...
 };
+
+export default connect(
+  (state) => {
+    return {
+      errors: state.errors
+    }
+  },
+  (dispatch) => {
+    return {
+      signUp: (email, password, password_confirm) => {
+        return dispatch(signUp(email, password, password_confirm));
+      }
+    };
+  }
+)(JoinPage);
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/reducers/index.js</p><code class='language-javascriptDiff'>
+import {
+  SIGN_UP_REQUEST,
+  SIGN_UP_SUCCESS,
+  SIGN_UP_FAILURE,
+} from "../actions";
+
 const initialState = {
-    user: undefined,
-    jwt: undefined,
-    loading: false,
-    connected: true,
-    menuOpen: false,
-    lists: []
+  user: undefined,
+  jwt: undefined,
+  loading: false,
+  connected: true,
+  menuOpen: false,
+  lists: [],
+  errors: []
 };
 ...
 export default (state = initialState, action) => {
-    switch (action.type) {
-        default:
-            return state;
-    }
+  switch (action.type) {
+  case SIGN_UP_REQUEST:
+    return state;
+  case SIGN_UP_SUCCESS:
+    return Object.assign({}, state, {
+      user: action.user,
+      jwt: action.jwt
+    });
+  case SIGN_UP_FAILURE:
+    return Object.assign({}, state, {
+      errors: action.errors
+    });
+  default:
+    return state;
+  }
 }
</code></pre>


## Final Thoughts

Transitioning away from the `react-meteor-data`{:.language-javascript} package’s `createContainer`{:.language-javascript}-based container components to a more generalized stat management system like Redux can be a lot of work.

It’s easy to take for granted how simple Meteor makes things.

However, it’s arguable that transitioning to a more predictable state management system is worth the up-front effort. Spending time designing your application’s state, actions, and reducers will leave you with a much more maintainable and predictable system down the road.

Next week we’ll (finally) finish the authentication portion of this project by wiring up our sign-in and sign-out back-end functionality to our Redux-powered front-end.
