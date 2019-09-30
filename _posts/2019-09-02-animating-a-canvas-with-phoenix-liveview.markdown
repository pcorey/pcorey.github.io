---
layout: post
title:  "Animating a Canvas with Phoenix LiveView"
excerpt: "LiveView's new hook functinality has opened the doors to a whole new world of possibilities. Get a taste of what's possible by checking out how we can animate an HTML5 canvas based on real-time data provided by the server."
author: "Pete Corey"
date:   2019-09-02
tags: ["Elixir", "Phoenix", "LiveView"]
related: []
image: "/img/2019-09-02-animating-a-canvas-with-phoenix-liveview/particles.png"
---

[Phoenix LiveView](https://hexdocs.pm/phoenix_live_view/Phoenix.LiveView.html) recently released a new feature called "hooks" that introduces [Javascript interoperability into the LiveView lifecycle](https://hexdocs.pm/phoenix_live_view/Phoenix.LiveView.html#module-js-interop-and-client-controlled-dom). Put simply, we can now run arbitrary Javascript every time a DOM node is changed by LiveView! __LiveView hooks are a complete game changer__, and open the doors to a whole new world of applications that can be built with this amazing technology.

As a proof of concept, let's use LiveView hooks to animate an HTML5 canvas in real time using data provided by the server!

## Getting Set Up

To keep this article short(er), we'll skip the rigmarole of configuring your application to use LiveView. If you need help with this step, I highly recommend you [check out Sophie DeBenedetto's thorough walkthrough](https://elixirschool.com/blog/phoenix-live-view/). Be sure to cross reference with [the official documentation](https://hexdocs.pm/phoenix_live_view/Phoenix.LiveView.html), as things are moving quickly in the LiveView world.

Moving forward, let's assume that you have a bare-bones LiveView component attached to a route that looks something like this:

<pre class='language-elixir'><code class='language-elixir'>
defmodule LiveCanvasWeb.PageLive do
  use Phoenix.LiveView
  
  def render(assigns) do
    ~L"""
    &lt;canvas>
      Canvas is not supported!
    &lt;/canvas>
    """
  end
  
  def mount(_session, socket) do
    {:ok, socket}
  end
end
</code></pre>

We'll also assume that your `assets/js/app.js`{:.language-elixir} file is creating a LiveView connection:

<pre class='language-javascript'><code class='language-javascript'>
import LiveSocket from "phoenix_live_view";

let liveSocket = new LiveSocket("/live");

liveSocket.connect();
</code></pre>

Now that we're on the same page, let's get started!

## Generating Data to Animate

Before we start animating on the client, we should have some data to animate. We'll start by storing a numeric value called `i`{:.language-elixir} in our LiveView process' `assigns`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
def mount(_session, socket) do
  {:ok, assign(socket, :i, 0)}
end
</code></pre>

Next, we'll increase `i`{:.language-elixir} by instructing our LiveView process to send an `:update`{:.language-elixir} message to itself after a delay of `16`{:.language-elixir} milliseconds:

<pre class='language-elixir'><code class='language-elixir'>
def mount(_session, socket) do
  Process.send_after(self(), :update, 16)
  {:ok, assign(socket, :i, 0)}
end
</code></pre>

When we handle the `:udpate`{:.language-elixir} message in our process, we'll schedule another recursive call to `:update`{:.language-elixir} and increment the value of `i`{:.language-elixir} in our socket's `assigns`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
def handle_info(:update, %{assigns: %{i: i}} = socket) do
  Process.send_after(self(), :update, 16)
  {:noreply, assign(socket, :i, i + 0.05)}
end
</code></pre>

Our LiveView process now has an `i`{:.language-elixir} value that's slowly increasing by `0.05`{:.language-elixir} approximately sixty times per second.

Now that we have some data to animate, let's add a `canvas`{:.language-elixir} to our LiveView's template to hold our animation:

<pre class='language-elixir'><code class='language-elixir'>
def render(assigns) do
  ~L"""
  &lt;canvas data-i="<%= @i %>">
    Canvas is not supported!
  &lt;/canvas>
  """
end
</code></pre>

Notice that we're associating the value of `i`{:.language-elixir} with our canvas by assigning it to a data attribute on the DOM element. Every time `i`{:.language-elixir} changes in our process' state, LiveView will update our `canvas`{:.language-elixir} and set the value of `data-i`{:.language-elixir} to the new value of `i`{:.language-elixir}.

This is great, but to render an animation in our `canvas`{:.language-elixir}, we need some way of executing client-side Javascript every time our `canvas`{:.language-elixir} updates. Thankfully, LiveView's new hook functionality lets us do exactly that!

## Hooking Into LiveView

LiveView hooks lets us execute Javascript [at various points in a DOM node's lifecycle](https://hexdocs.pm/phoenix_live_view/Phoenix.LiveView.html#module-js-interop-and-client-controlled-dom), such as when the node is first `mounted`{:.language-elixir}, when it's `updated`{:.language-elixir} by LiveView, when it's `destroyed`{:.language-elixir} and removed from the DOM, and when it becomes `disconnected`{:.language-elixir} or `reconnected`{:.language-elixir} to our Phoenix server.

To hook into LiveView's client-side lifecycle, we need to create a set of `hooks`{:.language-elixir} and pass them into our `LiveSocket`{:.language-elixir} constructor. Let's create a hook that initializes our `canvas`{:.language-elixir}' rendering context when the element mounts, and renders a static circle every time the element updates:

<pre class='language-javascript'><code class='language-javascript'>
let hooks = {
  canvas: {
    mounted() {
      let canvas = this.el;
      let context = canvas.getContext("2d");
      
      Object.assign(this, { canvas, context });
    },
    updated() {
      let { canvas, context } = this;
      
      let halfHeight = canvas.height / 2;
      let halfWidth = canvas.width / 2;
      let smallerHalf = Math.min(halfHeight, halfWidth);
      
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "rgba(128, 0, 255, 1)";
      context.beginPath();
      context.arc(
        halfWidth,
        halfHeight,
        smallerHalf / 16,
        0,
        2 * Math.PI
      );
      context.fill();
    }
  }
};

let liveSocket = new LiveSocket("/live", { hooks });

liveSocket.connect();
</code></pre>

Notice that we're storing a reference to our `canvas`{:.language-elixir} and our newly created rendering `context`{:.language-elixir} on `this`{:.language-elixir}. When LiveView calls our lifecycle callbacks, [`this`{:.language-elixir} points to an instance of a `ViewHook`{:.language-elixir} class](https://github.com/phoenixframework/phoenix_live_view/blob/140cfb3f2924cb6595b9bb2979a1963ac0de6eb8/assets/js/phoenix_live_view.js#L904-L906). A `ViewHook`{:.language-elixir} instance holds references to our provided lifecycle methods, a reference to the current DOM node in `el`{:.language-elixir}, [and various other pieces of data related to the current set of hooks](https://github.com/phoenixframework/phoenix_live_view/blob/140cfb3f2924cb6595b9bb2979a1963ac0de6eb8/assets/js/phoenix_live_view.js#L1100-L1104). As long as we're careful and we don't overwrite these fields, we're safe to store our own data in `this`{:.language-elixir}.

Next, we need to instruct LiveView to attach this new set of `canvas`{:.language-elixir} hooks to our `canvas`{:.language-elixir} DOM element. We can do that with the `phx-hook`{:.language-elixir} attribute:

<pre class='language-markup'><code class='language-markup'>
&lt;canvas
  data-i="<%= @i %>"
  phx-hook="canvas"
>
  Canvas is not supported!
&lt;/canvas>
</code></pre>

When our page reloads, we should see our circle rendered gloriously in the center of our canvas.

## Resizing the Canvas

On some displays, our glorious circle may appear to be fuzzy or distorted. This can be fixed by scaling our canvas to match the pixel density of our display. While we're at it, we might want to resize our canvas to fill the entire available window space.

<div style="width: 100%; margin: 2em auto;">
  <img src="/img/2019-09-02-animating-a-canvas-with-phoenix-liveview/blurry.png" style=" width: 100%;"/>
</div>

We can accomplish both of these in our `mounted`{:.language-elixir} callback:

<pre class='language-javascript'><code class='language-javascript'>
mounted() {
  let canvas = this.el;
  let context = canvas.getContext("2d");
  let ratio = getPixelRatio(context);
  
  resize(canvas, ratio);
  
  Object.assign(this, { canvas, context });
}
</code></pre>

Where `getPixelRatio`{:.language-elixir} is a helper function that determines the ratio of physical pixels in the current device's screen to "CSS pixels" which are used within the rendering context of our `canvas`{:.language-elixir}:

<pre class='language-javascript'><code class='language-javascript'>
const getPixelRatio = context => {
  var backingStore =
    context.backingStorePixelRatio ||
    context.webkitBackingStorePixelRatio ||
    context.mozBackingStorePixelRatio ||
    context.msBackingStorePixelRatio ||
    context.oBackingStorePixelRatio ||
    context.backingStorePixelRatio ||
    1;
  
  return (window.devicePixelRatio || 1) / backingStore;
};
</code></pre>

And `resize`{:.language-elixir} is a helper function that modifies the `canvas`{:.language-elixir}' width and height attributes in order to resize our canvas to fit the current window, while fixing any pixel density issues we may be experiencing:

<pre class='language-javascript'><code class='language-javascript'>
const resize = (canvas, ratio) => {
  canvas.width = window.innerWidth * ratio;
  canvas.height = window.innerHeight * ratio;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
};
</code></pre>

Unfortunately, our `canvas`{:.language-elixir} doesn't seem to be able to hold onto these changes. Subsequent calls to our `updated`{:.language-elixir} callback seem to lose our `resize`{:.language-elixir} changes, and the canvas reverts back to its original, blurry self. This is because when LiveView updates our `canvas`{:.language-elixir} DOM node, it resets our `width`{:.language-elixir} and `height`{:.language-elixir} attributes. Not only does this revert our pixel density fix, it also forcefully clears the canvas' rendering context.

LiveView has a quick fix for getting around this problem. By setting `phx-update`{:.language-elixir} to `"ignore"`{:.language-elixir} on our `canvas`{:.language-elixir} element, we can instruct LiveView to leave our `canvas`{:.language-elixir} element alone after its initial mount.

<pre class='language-markup'><code class='language-markup'>
&lt;canvas
  data-i="<%= @i %>"
  phx-hook="canvas" 
  phx-update="ignore"
>
  Canvas is not supported!
&lt;/canvas>
</code></pre>

Now our circle should be rendered crisply in the center of our screen.

<div style="width: 100%; margin: 2em auto;">
  <img src="/img/2019-09-02-animating-a-canvas-with-phoenix-liveview/crisp.png" style=" width: 100%;"/>
</div>

## Animating Our Circle

We didn't go all this way to render a static circle in our `canvas`{:.language-elixir}. Let's tie everything together and animate our circle based on the ever-changing values of `i`{:.language-elixir} provided by the server!

The first thing we'll need to do is update our `updated`{:.language-elixir} callback to grab the current value of the `data-i`{:.language-elixir} attribute:

<pre class='language-javascript'><code class='language-javascript'>
let i = JSON.parse(canvas.dataset.i);
</code></pre>

The value of `canvas.dataset.i`{:.language-elixir} will reflect the contents of our `data-i`{:.language-elixir} attribute. All data attributes are stored as strings, so a call to `JSON.parse`{:.language-elixir} will convert a value of `"0.05"`{:.language-elixir} to its numeric counterpart.

Next, we can update our rendering code to move our circle based on the value of `i`{:.language-elixir}:

<pre class='language-javascript'><code class='language-javascript'>
context.arc(
  halfWidth + (Math.cos(i) * smallerHalf) / 2,
  halfHeight + (Math.sin(i) * smallerHalf) / 2,
  smallerHalf / 16,
  0,
  2 * Math.PI
);
</code></pre>

That's it! With those two changes, our circle will rotate around the center of our canvas based entirely on real-time data provided by our server!

<div style="width: 100%; margin: 2em auto;">
  <img src="/img/2019-09-02-animating-a-canvas-with-phoenix-liveview/spinning.png" style=" width: 100%;"/>
</div>

## Requesting Animation Frames

Our solution works, but by forcing re-renders on the browser, we're being bad net citizens. Our client may be forcing re-renders when its tab is out of focus, or it may be re-rendering more than sixty times per second, wasting CPU cycles.

Instead of telling the browser to re-render our `canvas`{:.language-elixir} on every LiveView update, we should invert our control over rendering and [request an animation frame from the browser](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame) on every update.

{% include newsletter.html %}

The process for this is straight forward. In our `updated`{:.language-elixir} callback, we'll wrap our rendering code in a lambda passed into `requestAnimationFrame`{:.language-elixir}. We'll save the resulting request reference to `this.animationFrameRequest`{:.language-elixir}:

<pre class='language-javascript'><code class='language-javascript'>
this.animationFrameRequest = requestAnimationFrame(() => {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.beginPath();
  context.arc(
    halfWidth + (Math.cos(i) * smallerHalf) / 2,
    halfHeight + (Math.sin(i) * smallerHalf) / 2,
    smallerHalf / 16,
    0,
    2 * Math.PI
  );
  context.fill();
});
</code></pre>

It's conceivable that our LiveView component may update multiple times before our browser is ready to re-render our `canvas`{:.language-elixir}. In those situations, we'll need to cancel any previously requested animation frames, and re-request a new frame. We can do this by placing a guard just above our call to `requestAnimationFrame`{:.language-elixir}:

<pre class='language-javascript'><code class='language-javascript'>
if (this.animationFrameRequest) {
  cancelAnimationFrame(this.animationFrameRequest);
}
</code></pre>

With those two changes, our LiveView hooks will now politely request animation frames from the browser, resulting in a smoother experience for everyone involved.

## Taking it Further

Using a canvas to animate a numeric value updated in real-time by a LiveView process running on the server demonstrates the huge potential power of LiveView hooks, but it's not much to look at.

We can take things further by generating and animating a much larger set of data on the server. [Check out this example project](https://frozen-coast-73544.herokuapp.com/) that simulates over two hundred simple particles, and renders them on the client at approximately sixty frames per second:

<div style="width: 100%; margin: 2em auto;">
  <img src="/img/2019-09-02-animating-a-canvas-with-phoenix-liveview/particles.png" style=" width: 100%;"/>
</div>

Is it a good idea to take this approach if your goal is to animate a bunch of particles on the client? __Probably not.__ Is it amazing that LiveView gives us the tools to do this? __Absolutely, yes!__ Be sure to [check out the entire source for this example on Github](https://github.com/pcorey/live_canvas)!

Hooks have opened the doors to a world of new possibilities for LiveView-based applications. I hope this demonstration has given you a taste of those possibilities, and I hope you're as eager as I am to explore what we can do with LiveView moving forward.

## Update: 9/30/2019

The technique of using both `phx-hook`{:.language-javascript} and `phx-update="ignore"`{:.language-javascript} on a single component no longer works as of `phoenix_live_view`{:.language-javascript} version `0.2.0`{:.language-javascript}. The `"ignore"`{:.language-javascript} update rule causes our hook's `updated`{:.language-javascript} callback to not be called with updates.

[Joxy](https://twitter.com/joxyandsuch) pointed this issue out to me, and helped me come up with a workaround. The solution we landed on is to wrap our `canvas`{:.language-javascript} component in another DOM element, like a `div`{:.language-javascript}. We leave our `phx-update="ignore"`{:.language-javascript} on our canvas to preserve our computed width and height attributes, but move our `phx-hook`{:.language-javascript} and data attributes to the wrapping `div`{:.language-javascript}:

<pre class="language-markup"><code class="language-markup">
&lt;div
  phx-hook="canvas"
  data-particles="&lt;%= Jason.encode!(@particles) %>"
>
  &lt;canvas phx-update="ignore">
    Canvas is not supported!
  &lt;/canvas>
&lt;/div>
</code></pre>

In the `mounted`{:.language-javascript} callback of our `canvas`{:.language-javascript} hook, we need to look to the first child of our `div`{:.language-javascript} to find our `canvas`{:.language-javascript} element:

<pre class="language-javascript"><code class="language-javascript">
mounted() {
  let canvas = this.el.firstElementChild;
  ...
}
</code></pre>

Finally, we need to pass a reference to a Phoenix `Socket`{:.language-javascript} directly into our `LiveSocket`{:.language-javascript} constructor to be compatible with our new version of `phoenix_live_view`{:.language-javascript}:

<pre class="language-javascript"><code class="langauge-javascript">
import { Socket } from "phoenix";
let liveSocket = new LiveSocket("/live", Socket, { hooks });
</code></pre>

And that's all there is to it! Our LiveView-powered confetti generator is back up and running with the addition of a small layer of markup. For more information on this update, [be sure to check out this issue I filed](https://github.com/phoenixframework/phoenix_live_view/issues/388) to try to get clarity on the situation. And I'd like to give a huge thanks to Joxy for doing all the hard work on putting this fix together!
