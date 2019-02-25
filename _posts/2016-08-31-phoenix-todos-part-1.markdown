---
layout: post
title:  "Phoenix Todos - Static Assets"
description: "Part one of our 'Phoenix Todos' Literate Commits series. Transplanting static assets to kick off our project."
author: "Pete Corey"
date:   2016-08-31
repo: "https://github.com/pcorey/phoenix_todos"
literate: true
tags: ["Elixir", "Phoenix", "Literate Commits", "Phoenix Todos"]
---


## [Mix Phoenix.New]({{page.repo}}/commit/8ee386eba1915ced0430be1a25f62fc0d1c83332)

For this project we'll be recreating Meteor's
[Todos](https://github.com/meteor/todos/tree/react/) application using a
[React](https://facebook.github.io/react/) front-end and an
[Elixir](http://elixir-lang.org/)/[Phoenix](http://www.phoenixframework.org/)
powered backend. With limited experience with both React and
Elixir/Phoenix, this should definitely be an interesting leaning
experience.

This will be the largest [literate
commits](http://www.east5th.co/blog/2016/07/11/literate-commits/)
project we've done to date, and will span several articles published
over the upcoming weeks. Be sure to stay tuned for future posts!

This first commit creates a new Phoenix project called `phoenix_todos`{:.language-javascript}.


## [Adding mix_test_watch]({{page.repo}}/commit/e3a4d8aca5b6299aeef7a2b7130012522624f27f)

Moving forward, we'll be writing tests for the Elixir code we create.
Being the good developers that we are, we should test this code.

To make testing a more integrated process, we'll add the
`mix_text_watch`{:.language-javascript} dependency, which lets us run the `mix test.watch`{:.language-javascript} command
to continuously watch our project for changes and re-run our test suite.


<pre class='language-elixirDiff'><p class='information'>mix.exs</p><code class='language-elixirDiff'>
 ...
      {:gettext, "~> 0.9"},
-     {:cowboy, "~> 1.0"}]
+     {:cowboy, "~> 1.0"},
+     {:mix_test_watch, "~> 0.2", only: :dev}]
   end
</code></pre>

<pre class='language-elixirDiff'><p class='information'>mix.lock</p><code class='language-elixirDiff'>
   "mime": {:hex, :mime, "1.0.1"},
+  "mix_test_watch": {:hex, :mix_test_watch, "0.2.6"},
   "phoenix": {:hex, :phoenix, "1.1.6"},
</code></pre>



## [Hello React]({{page.repo}}/commit/115384f2fe63dabd9d758a29e75262633216af22)

Laying the groundwork for using React in a Phoenix project is fairly
straight-forward.

We kick things off by installing our necessary NPM dependencies (`react`{:.language-javascript}, `react-dom`{:.language-javascript}, and `babel-preset-react`{:.language-bash}), and then updating our
`brunch-config.js`{:.language-javascript} to use the required Babel preset, and whitelisting our
React NPM modules.

Once that's finished, we can test the waters by replacing our
`app.html.eex`{:.language-javascript} layout template with a simple React attachment point:

<pre class='language-markup'><code class='language-markup'>
&lt;div id="hello-world"&gt;&lt;/div&gt;
</code></pre>

Finally, we can update our `app.js`{:.language-javascript} to create and render a `HelloWorld`{:.language-javascript}
component within this new element:

<pre class="language-javascript"><code class="language-javascript">
class HelloWorld extends React.Component {
  render() {
    return (&lt;h1&gt;Hello World!&lt;/h1&gt;)
  }
}
 
ReactDOM.render(
  &lt;HelloWorld/&gt;,
  document.getElementById("hello-world")
)
</code></pre>

For a more detailed rundown of this setup process, be sure to read this
[fantastic
article](https://medium.com/@diamondgfx/phoenix-v1-1-2-and-react-js-3dbd195a880a#.crvvk8pyb)
by Brandon Richey that walks you throw the process step by step.


<pre class='language-javascriptDiff'><p class='information'>brunch-config.js</p><code class='language-javascriptDiff'>
 ...
     babel: {
+      presets: ["es2015", "react"],
       // Do not use ES6 compiler in vendor code
 ...
   npm: {
-    enabled: true
+    enabled: true,
+    whitelist: ["phoenix", "phoenix_html", "react", "react-dom"]
   }
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>package.json</p><code class='language-javascriptDiff'>
 {
-  "repository": {
-  },
+  "repository": {},
   "dependencies": {
     "babel-brunch": "^6.0.0",
+    "babel-preset-react": "^6.11.1",
     "brunch": "^2.0.0",
     "javascript-brunch": ">= 1.0 < 1.8",
+    "react": "^15.3.1",
+    "react-dom": "^15.3.1",
     "uglify-js-brunch": ">= 1.0 < 1.8"
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/app.js</p><code class='language-javascriptDiff'>
-// Brunch automatically concatenates all files in your
-// watched paths. Those paths can be configured at
-// config.paths.watched in "brunch-config.js".
-//
-// However, those files will only be executed if
-// explicitly imported. The only exception are files
-// in vendor, which are never wrapped in imports and
-// therefore are always executed.
+import React from "react"
+import ReactDOM from "react-dom"
 
-// Import dependencies
-//
-// If you no longer want to use a dependency, remember
-// to also remove its path from "config.paths.watched".
-import "deps/phoenix_html/web/static/js/phoenix_html"
+class HelloWorld extends React.Component {
+  render() {
+    return (<h1>Hello World!</h1>)
+  }
+}
 
-// Import local files
-//
-// Local files can be imported directly using relative
-// paths "./socket" or full ones "web/static/js/socket".
-
-// import socket from "./socket"
+ReactDOM.render(
+  <HelloWorld/>,
+  document.getElementById("hello-world")
+)
</code></pre>

<pre class='language-markupDiff'><p class='information'>web/templates/layout/app.html.eex</p><code class='language-markupDiff'>
   &lt;body&gt;
-    &lt;div class="container"&gt;
-      &lt;header class="header"&gt;
-        &lt;nav role="navigation"&gt;
-          &lt;ul class="nav nav-pills pull-right"&gt;
-            &lt;li&gt;&lt;a href="http://www.phoenixframework.org/docs"&gt;Get Started&lt;/a&gt;&lt;/li&gt;
-          &lt;/ul&gt;
-        &lt;/nav&gt;
-        &lt;span class="logo"&gt;&lt;/span&gt;
-      &lt;/header&gt;
-
-      &lt;p class="alert alert-info" role="alert"&gt;&lt;%= get_flash(@conn, :info) %&gt;&lt;/p&gt;
-      &lt;p class="alert alert-danger" role="alert"&gt;&lt;%= get_flash(@conn, :error) %&gt;&lt;/p&gt;
-
-      &lt;main role="main"&gt;
-        &lt;%= render @view_module, @view_template, assigns %&gt;
-      &lt;/main&gt;
-
-    &lt;/div&gt; &lt;!-- /container --&gt;
+    &lt;div id="hello-world"&gt;&lt;/div&gt;
     &lt;script src="<%= static_path(@conn, "/js/app.js") %&gt;"&gt;&lt;/script&gt;
</code></pre>



## [Static Assets]({{page.repo}}/commit/fcb8f9e138b1e6ce670231a7d843fb5af02979e0)

Now we can start working in broad strokes. Since this project is a
direct clone of the Meteor Todos application, we're not planning on
modifying the application's stylesheets.

This means that we can wholesale copy the contents of
`~/todos/.meteor/.../merged-stylesheets.css`{:.language-bash}
into our `web/static/css/app.css`{:.language-bash} file.

We can also copy all of the Meteor application's static assets into our
`web/static/assets`{:.language-bash} folder, and update our Phoenix `Endpoint`{:.language-javascript} to make
them accessible.

Reloading our application should show us a nice gradient background, and
we shouldn't see any `Phoenix.Router.NoRouteError`{:.language-javascript} errors when trying to
access our static assets.


<pre class='language-elixirDiff'><p class='information'>lib/phoenix_todos/endpoint.ex</p><code class='language-elixirDiff'>
 ...
     at: "/", from: :phoenix_todos, gzip: false,
-    only: ~w(css fonts images js favicon.ico robots.txt)
+    only: ~w(css font js icon favicon.ico favicon.png apple-touch-icon-precomposed.png logo-todos.svg)
</code></pre>


## [Layouts and Containers]({{page.repo}}/commit/b174f08f0440047974dd312ddbae4c8e2f20a034)

Now that we have our basic React functionality set up and our static
assets being served, it's time to start migrating the React components
from the Meteor Todos application into our new Phoenix application.

We'll start this process by changing our `app.html.eex`{:.language-javascript} file to use the
expected `"app"`{:.language-javascript} ID on its container element.

<pre class='language-markup'><code class='language-markup'>
&lt;div id="app"&gt;&lt;/div&gt;
</code></pre>

Next, we can update our `app.js`{:.language-javascript} file, removing our `HelloWorld`{:.language-javascript}
component, and replacing it with the setup found in the Todos
application. We need to be sure to remove the `Meteor.startup`{:.language-javascript}
callback wrapper, as we won't be using Meteor:

<pre class='language-javascript'><code class='language-javascript'>
import { render } from "react-dom";
import { renderRoutes } from "./routes.jsx";

render(renderRoutes(), document.getElementById("app"));
</code></pre>

Now we port over the `routes.jsx`{:.language-javascript} file. We'll put this directly into our
`web/static/js`{:.language-javascript} folder, next to our `app.js`{:.language-javascript} file.

We'll keep things simple at first by only defining routes for the
`AppContainer`{:.language-javascript} and the `NotFoundPage`{:.language-javascript}.

<pre class='language-javascript'><code class='language-javascript'>
import AppContainer from './containers/AppContainer.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
</code></pre>

<pre class='language-javascript'><code class='language-javascript'>
export const renderRoutes = () => (
  &lt;Router history={browserHistory}&gt;
    &lt;Route path="/" component={AppContainer}&gt;
      &lt;Route path="*" component={NotFoundPage}/&gt;
    &lt;/Route&gt;
  &lt;/Router&gt;
);
</code></pre>

The `AppContainer`{:.language-javascript} in the Meteor application defines a [reactive
container](https://guide.meteor.com/react.html#using-createContainer) around an `App`{:.language-javascript} component. This is very Meteor-specific, so
we'll gut this for now and replace it with a simple container that sets
up our initial application state and passes it down to the `App`{:.language-javascript}
component.

Next comes the process of migrating the `App`{:.language-javascript} component and all of its
children components (`UserMenu`{:.language-javascript}, `ListList`{:.language-javascript}, `ConnectionNotification`{:.language-javascript},
etc...).

This migration is fairly painless. We just need to be sure to
remove references to Meteor-specific functionality. We'll replace all of the
functionality we remove in future commits.

After all of these changes, we're greeted with a beautifully styled
loading screen when we refresh our application.


<pre class='language-javascriptDiff'><p class='information'>package.json</p><code class='language-javascriptDiff'>
     "react": "^15.3.1",
+    "react-addons-css-transition-group": "^15.3.1",
     "react-dom": "^15.3.1",
+    "react-router": "^2.7.0",
     "uglify-js-brunch": ">= 1.0 < 1.8"
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/app.js</p><code class='language-javascriptDiff'>
-import React from "react"
-import ReactDOM from "react-dom"
+import { render } from "react-dom";
+import { renderRoutes } from "./routes.jsx";
 
-class HelloWorld extends React.Component {
-  render() {
-    return (&lt;h1>Hello World!&lt;/h1>)
-  }
-}
-
-ReactDOM.render(
-  &lt;HelloWorld/>,
-  document.getElementById("hello-world")
-)
+render(renderRoutes(), document.getElementById("app"));
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/components/ConnectionNotification.jsx</p><code class='language-javascriptDiff'>
+import React from 'react';
+
+const ConnectionNotification = () => (
+  &lt;div className="notifications">
+    &lt;div className="notification">
+      &lt;span className="icon-sync">&lt;/span>
+      &lt;div className="meta">
+        &lt;div className="title-notification">Trying to connect&lt;/div>
+        &lt;div className="description">There seems to be a connection issue&lt;/div>
+      &lt;/div>
+    &lt;/div>
+  &lt;/div>
+);
+
+export default ConnectionNotification;
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/components/ListList.jsx</p><code class='language-javascriptDiff'>
+import React from 'react';
+import { Link } from 'react-router';
+
+export default class ListList extends React.Component {
+  constructor(props) {
+    super(props);
+
+    this.createNewList = this.createNewList.bind(this);
+  }
+
+  createNewList() {
+    const { router } = this.context;
+    // TODO: Create new list
+  }
+
+  render() {
+    const { lists } = this.props;
+    return (
+      &lt;div className="list-todos">
+        &lt;a className="link-list-new" onClick={this.createNewList}>
+          &lt;span className="icon-plus">&lt;/span>
+          New List
+        &lt;/a>
+        {lists.map(list => (
+          &lt;Link
+            to={`/lists/${ list._id }`}
+            key={list._id}
+            title={list.name}
+            className="list-todo"
+            activeClassName="active"
+          >
+            {list.userId
+              ? &lt;span className="icon-lock">&lt;/span>
+              : null}
+            {list.incompleteCount
+              ? &lt;span className="count-list">{list.incompleteCount}&lt;/span>
+              : null}
+            {list.name}
+          &lt;/Link>
+        ))}
+      &lt;/div>
+    );
+  }
+}
+
+ListList.propTypes = {
+  lists: React.PropTypes.array,
+};
+
+ListList.contextTypes = {
+  router: React.PropTypes.object,
+};
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/components/Loading.jsx</p><code class='language-javascriptDiff'>
+import React from 'react';
+
+const Loading = () => (
+  &lt;img src="/logo-todos.svg" className="loading-app" />
+);
+
+export default Loading;
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/components/Message.jsx</p><code class='language-javascriptDiff'>
+import React from 'react';
+
+const Message = ({ title, subtitle }) => (
+  &lt;div className="wrapper-message">
+    {title ? &lt;div className="title-message">{title}&lt;/div> : null}
+    {subtitle ? &lt;div className="subtitle-message">{subtitle}&lt;/div> : null}
+  &lt;/div>
+);
+
+Message.propTypes = {
+  title: React.PropTypes.string,
+  subtitle: React.PropTypes.string,
+};
+
+export default Message;
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/components/MobileMenu.jsx</p><code class='language-javascriptDiff'>
+import React from 'react';
+
+function toggleMenu() {
+  // TODO: Toggle menu
+}
+
+const MobileMenu = () => (
+  &lt;div className="nav-group">
+    &lt;a href="#" className="nav-item" onClick={toggleMenu}>
+      &lt;span className="icon-list-unordered" title="Show menu">&lt;/span>
+    &lt;/a>
+  &lt;/div>
+);
+
+export default MobileMenu;
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/components/UserMenu.jsx</p><code class='language-javascriptDiff'>
+import React from 'react';
+import { Link } from 'react-router';
+
+export default class UserMenu extends React.Component {
+  constructor(props) {
+    super(props);
+    this.state = {
+      open: false,
+    };
+    this.toggle = this.toggle.bind(this);
+  }
+
+  toggle(e) {
+    e.stopPropagation();
+    this.setState({
+      open: !this.state.open,
+    });
+  }
+
+  renderLoggedIn() {
+    const { open } = this.state;
+    const { user, logout } = this.props;
+    const email = user.emails[0].address;
+    const emailLocalPart = email.substring(0, email.indexOf('@'));
+
+    return (
+      &lt;div className="user-menu vertical">
+        &lt;a href="#" className="btn-secondary" onClick={this.toggle}>
+          {open
+            ? &lt;span className="icon-arrow-up">&lt;/span>
+            : &lt;span className="icon-arrow-down">&lt;/span>}
+          {emailLocalPart}
+        &lt;/a>
+        {open
+          ? &lt;a className="btn-secondary" onClick={logout}>Logout&lt;/a>
+          : null}
+      &lt;/div>
+    );
+  }
+
+  renderLoggedOut() {
+    return (
+      &lt;div className="user-menu">
+        &lt;Link to="/signin" className="btn-secondary">Sign In&lt;/Link>
+        &lt;Link to="/join" className="btn-secondary">Join&lt;/Link>
+      &lt;/div>
+    );
+  }
+
+  render() {
+    return this.props.user
+      ? this.renderLoggedIn()
+      : this.renderLoggedOut();
+  }
+}
+
+UserMenu.propTypes = {
+  user: React.PropTypes.object,
+  logout: React.PropTypes.func,
+};
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/containers/AppContainer.jsx</p><code class='language-javascriptDiff'>
+import App from '../layouts/App.jsx';
+import React from 'react';
+
+export default class AppContainer extends React.Component {
+  constructor(props) {
+    super(props);
+    this.state = {
+      user: undefined,
+      loading: true,
+      connected: true,
+      menuOpen: false,
+      lists: []
+    };
+  }
+
+  render() {
+    return (&lt;App {...this.state}/>);
+  }
+};
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/layouts/App.jsx</p><code class='language-javascriptDiff'>
+import React from 'react';
+import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
+import UserMenu from '../components/UserMenu.jsx';
+import ListList from '../components/ListList.jsx';
+import ConnectionNotification from '../components/ConnectionNotification.jsx';
+import Loading from '../components/Loading.jsx';
+
+const CONNECTION_ISSUE_TIMEOUT = 5000;
+
+export default class App extends React.Component {
+  constructor(props) {
+    super(props);
+    this.state = {
+      menuOpen: false,
+      showConnectionIssue: false,
+    };
+    this.toggleMenu = this.toggleMenu.bind(this);
+    this.logout = this.logout.bind(this);
+  }
+
+  componentDidMount() {
+    setTimeout(() => {
+      /* eslint-disable react/no-did-mount-set-state */
+      this.setState({ showConnectionIssue: true });
+    }, CONNECTION_ISSUE_TIMEOUT);
+  }
+
+  componentWillReceiveProps({ loading, children }) {
+    // redirect / to a list once lists are ready
+    if (!loading && !children) {
+      const list = Lists.findOne();
+      this.context.router.replace(`/lists/${ list._id }`{:.language-javascript});
+    }
+  }
+
+  toggleMenu(menuOpen = !Session.get('menuOpen')) {
+    Session.set({ menuOpen });
+  }
+
+  logout() {
+    Meteor.logout();
+
+    // if we are on a private list, we'll need to go to a public one
+    if (this.props.params.id) {
+      const list = Lists.findOne(this.props.params.id);
+      if (list.userId) {
+        const publicList = Lists.findOne({ userId: { $exists: false } });
+        this.context.router.push(`/lists/${ publicList._id }`{:.language-javascript});
+      }
+    }
+  }
+
+  render() {
+    const { showConnectionIssue } = this.state;
+    const {
+      user,
+      connected,
+      loading,
+      lists,
+      menuOpen,
+      children,
+      location,
+    } = this.props;
+
+    const closeMenu = this.toggleMenu.bind(this, false);
+
+    // clone route components with keys so that they can
+    // have transitions
+    const clonedChildren = children && React.cloneElement(children, {
+      key: location.pathname,
+    });
+
+    return (
+      &lt;div id="container" className={menuOpen ? 'menu-open' : ''}>
+        &lt;section id="menu">
+          &lt;UserMenu user={user} logout={this.logout}/>
+          &lt;ListList lists={lists}/>
+        &lt;/section>
+        {showConnectionIssue && !connected
+          ? &lt;ConnectionNotification/>
+          : null}
+        &lt;div className="content-overlay" onClick={closeMenu}>&lt;/div>
+        &lt;div id="content-container">
+          &lt;ReactCSSTransitionGroup
+            transitionName="fade"
+            transitionEnterTimeout={200}
+            transitionLeaveTimeout={200}
+          >
+            {loading
+              ? &lt;Loading key="loading"/>
+              : clonedChildren}
+          &lt;/ReactCSSTransitionGroup>
+        &lt;/div>
+      &lt;/div>
+    );
+  }
+}
+
+App.propTypes = {
+  user: React.PropTypes.object,      // current meteor user
+  connected: React.PropTypes.bool,   // server connection status
+  loading: React.PropTypes.bool,     // subscription status
+  menuOpen: React.PropTypes.bool,    // is side menu open?
+  lists: React.PropTypes.array,      // all lists visible to the current user
+  children: React.PropTypes.element, // matched child route component
+  location: React.PropTypes.object,  // current router location
+  params: React.PropTypes.object,    // parameters of the current route
+};
+
+App.contextTypes = {
+  router: React.PropTypes.object,
+};
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/pages/NotFoundPage.jsx</p><code class='language-javascriptDiff'>
+import React from 'react';
+import MobileMenu from '../components/MobileMenu.jsx';
+import Message from '../components/Message.jsx';
+
+const NotFoundPage = () => (
+  &lt;div className="page not-found">
+    &lt;nav>
+      &lt;MobileMenu/>
+    &lt;/nav>
+    &lt;div className="content-scrollable">
+      &lt;Message title="Page not found"/>
+    &lt;/div>
+  &lt;/div>
+);
+
+export default NotFoundPage;
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/static/js/routes.jsx</p><code class='language-javascriptDiff'>
+import React from 'react';
+import { Router, Route, browserHistory } from 'react-router';
+
+// route components
+import AppContainer from './containers/AppContainer.jsx';
+import NotFoundPage from './pages/NotFoundPage.jsx';
+
+export const renderRoutes = () => (
+  &lt;Router history={browserHistory}>
+    &lt;Route path="/" component={AppContainer}>
+      &lt;Route path="*" component={NotFoundPage}/>
+    &lt;/Route>
+  &lt;/Router>
+);
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>web/templates/layout/app.html.eex</p><code class='language-javascriptDiff'>
   &lt;body>
-    &lt;div id="hello-world">&lt;/div>
+    &lt;div id="app">&lt;/div>
     &lt;script src="&lt;%= static_path(@conn, "/js/app.js") %>">&lt;/script>
</code></pre>


## Final Thoughts

This first installment of “Phoenix Todos” mostly consisted of [“coding by the numbers”](https://en.wiktionary.org/wiki/paint-by-numbers). Migrating over the styles, static assets, and front-end components of our Meteor application into our Phoenix application is tedious work to say the least.

Expect the excitement levels to ramp up in future posts. We’ll be implementing a Phoenix-style authentication system, replacing Meteor publications with Phoenix Channels, and re-implementing Meteor methods as REST endpoints in our Phoenix application.

This conversion process will open some very interesting avenues of comparison and exploration, which I’m eager to dive into.

Be sure to check back next week for Phoenix Todos - Part 2!
