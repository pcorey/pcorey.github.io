---
layout: post
title:  "Animating a Canvas with Phoenix LiveView: An Update"
excerpt: "Things are moving fast in the LiveView world. If you're using LiveView to animate an HTML5 canvas, like we did last month, you'll want to read about this breaking change and its corresponding workaround."
author: "Pete Corey"
date:   2019-10-01
tags: ["Elixir", "Phoenix", "LiveView"]
related: ["/2019/09/02/animating-a-canvas-with-phoenix-liveview"]
image: "/img/2019-09-02-animating-a-canvas-with-phoenix-liveview/particles.png"
---

In my previous post on [animating an HTML5 canvas using Phoenix LiveView](/2019/09/02/animating-a-canvas-with-phoenix-liveview), we used both a `phx-hook`{:.language-javascript} attribute and a `phx-update="ignore"`{:.language-javascript} attribute simultaneously on a single DOM element. The goal was to ignore DOM updates (`phx-update="ignore"`{:.language-javascript}), while still receiving updated data from our server (`phx-hook`{:.language-javascript}) via our `data-particles`{:.language-javascript} attribute.

Unfortunately, the technique of using both `phx-hook`{:.language-javascript} and `phx-update="ignore"`{:.language-javascript} on a single component no longer works as of `phoenix_live_view`{:.language-javascript} version `0.2.0`{:.language-javascript}. The `"ignore"`{:.language-javascript} update rule causes our hook's `updated`{:.language-javascript} callback to not be called with updates. In hindsight, the previous behavior doesn't even make sense, and the new behavior seems much more consistent with the metaphors in play.

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

And that's all there is to it! Our LiveView-powered confetti generator is back up and running with the addition of a small layer of markup.

<div style="width: 100%; margin: 2em auto;">
  <img src="/img/2019-09-02-animating-a-canvas-with-phoenix-liveview/particles.png" style=" width: 100%;"/>
</div>

For more information on this update, [be sure to check out this issue I filed](https://github.com/phoenixframework/phoenix_live_view/issues/388) to try to get clarity on the situation. And I'd like to give a huge thanks to Joxy for doing all the hard work in putting this fix together!
