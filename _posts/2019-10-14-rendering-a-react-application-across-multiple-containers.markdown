---
layout: post
title:  "Rendering a React Application Across Multiple Containers"
excerpt: "Lately I've been embedding React applications into existing static pages, and I've had the need to render single applications across multiple containers."
author: "Pete Corey"
date:   2019-10-14
tags: ["Javascript", "React"]
related: []
---

A few of my recent articles have been embedding limited builds of [Glorious Voice Leader](https://www.gloriousvoiceleader.com/) directly into the page. At first, this presented an interesting challenge. How could I render a single React application across multiple container nodes, while maintaining shared state between all of them?

While the solution I came up with probably isn't _best practice_, it works!

As a quick example, imagine you have a simple React component that manages a single piece of state. The user can change that state by pressing one of two buttons:

<pre class='language-javascript'><code class='language-javascript'>
const App = () => {
  let [value, setValue] = useState("foo");
  return (
    &lt;div>
      &lt;button onClick={() => setValue("foo")}>
        Value is "{value}". Click to change to "foo"!
      &lt;/button>
      &lt;button onClick={() => setValue("bar")}>
        Value is "{value}". Click to change to "bar"!
      &lt;/button>
    &lt;/div>
  );
};
</code></pre>

Normally, we'd render our `App`{:.language-javascript} component into a container in the DOM using `ReactDOM.render`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
ReactDOM.render(&lt;App />, document.getElementById('root'));
</code></pre>

But what if we want to render our buttons in two different `div`{:.language-javascript} elements, spread across the page? Obviously, we could build out two different components, one for each button, and render these components in two different DOM containers:

<pre class='language-javascript'><code class='language-javascript'>
const Foo = () => {
  let [value, setValue] = useState("foo");
  return (
    &lt;button onClick={() => setValue("foo")}>
      Value is "{value}". Click to change to "foo"!
    &lt;/button>
  );
};

const Bar = () => {
  let [value, setValue] = useState("foo");
  return (
    &lt;button onClick={() => setValue("bar")}>
      Value is "{value}". Click to change to "bar"!
    &lt;/button>
  );
};

ReactDOM.render(&lt;Foo />, document.getElementById('foo'));
ReactDOM.render(&lt;Bar />, document.getElementById('bar'));
</code></pre>

But this solution has a problem. Our `Foo`{:.language-javascript} and `Bar`{:.language-javascript} components maintain their own versions of `value`{:.language-javascript}, so a change in one component won't affect the other.

Amazingly, it turns out that we can create an `App`{:.language-javascript} component which maintains our shared state, render that component into our `#root`{:.language-javascript} container, and within `App`{:.language-javascript} we can make additional calls to `ReactDOM.render`{:.language-javascript} to render our `Foo`{:.language-javascript} and `Bar`{:.language-javascript} components. When we call `ReactDOM.render`{:.language-javascript} we can pass down our state value and setters for later use in `Foo`{:.language-javascript} and `Bar`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
const App = () => {
  let [value, setValue] = useState("foo");
  return (
    &lt;>
      {ReactDOM.render(
        &lt;Foo value={value} setValue={setValue} />,
        document.getElementById("foo")
      )}
      {ReactDOM.render(
        &lt;Bar value={value} setValue={setValue} />,
        document.getElementById("bar")
      )}
    &lt;/>
  );
};
</code></pre>

Our `Foo`{:.language-javascript} and `Bar`{:.language-javascript} components can now use the `value`{:.language-javascript} and `setValue`{:.language-javascript} props provided to them instead of maintaining their own isolated state:

<pre class='language-javascript'><code class='language-javascript'>
const Foo = ({ value, setValue }) => {
  return (
    &lt;button onClick={() => setValue("foo")}>
      Value is "{value}". Click to change to "foo"!
    &lt;/button>
  );
};

const Bar = ({ value, setValue }) => {
  return (
    &lt;button onClick={() => setValue("bar")}>
      Value is "{value}". Click to change to "bar"!
    &lt;/button>
  );
};
</code></pre>

And everything works! Our `App`{:.language-javascript} is "rendered" to our `#root`{:.language-javascript} DOM element, though nothing actually appears there, and our `Foo`{:.language-javascript} and `Bar`{:.language-javascript} components are rendered into `#foo`{:.language-javascript} and `#bar`{:.language-javascript} respectively.

Honestly, I'm amazed this works at all. I can't imagine this is an intended use case of React, but the fact that it's still a possibility made my life much easier.

Happy hacking.
