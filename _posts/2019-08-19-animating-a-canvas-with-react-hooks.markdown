---
layout: post
title:  "Animating a Canvas with React Hooks"
excerpt: "The new React hooks API gives us a really slick way of introducing side effects into our pure, functional components. Let's use that to interact with and animate an HTML5 cavnas."
author: "Pete Corey"
date:   2019-08-19
tags: ["Javascript", "React", "Canvas"]
related: []
image: "/img/2019-08-19-animating-a-canvas-with-react-hooks/circle.png"
---

A recent React-based client project of mine required an [HTML5 canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) animation. Already knee-deep in the new [React hooks API](https://reactjs.org/docs/hooks-intro.html), I decided to forgo the "traditional" (can something be "traditional" after just five years?) technique of using `componentDidMount`{:.language-javascript} and `componentWillUnmount`{:.language-javascript} in a class-based component, and try my hand at rendering and animating a canvas using React's new `useEffect`{:.language-javascript} hook.

Let's dig into it!

---- 

Let's set the scene by creating a new React component that we want to add our canvas to. We'll assume that we're trying to render a circle, so we'll call our new component, `Circle`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
import React from 'react';

const Circle = () => {
    return (
        <canvas
            style=&#123;&#123; width: '100px', height: '100px' }}
        />
    );
};

export default Circle;
</code></pre>

So far so good.

---- 

Our `Circle`{:.language-javascript} component renders a `canvas`{:.language-javascript} onto the page, but we have no way of interacting with it. Typically, to interact with an element of the DOM from within a React component, [you need a "ref"](https://reactjs.org/docs/refs-and-the-dom.html). The new React hooks API gives us [a convenient way to create and use refs](https://reactjs.org/docs/hooks-reference.html#useref):

<pre class='language-javascriptDiff'><code class='language-javascriptDiff'>
 import React from 'react';
+import { useRef } from 'react';

 const Circle = () => {
+    let ref = useRef();
     return (
         <canvas
+            ref={ref} 
             style=&#123;&#123; width: '100px', height: '100px' }}
         />
     );
 };

 export default Circle;
</code></pre>

Now `ref.current`{:.language-javascript} holds a reference to our `canvas`{:.language-javascript} DOM node.

---- 

Interacting with our canvas produces "side effects", which isn't allowed from within the render phase of a React component. Thankfully, the new hooks API gives us a simple way to introduce side effects into our components via [the `useEffect`{:.language-javascript} hook](https://reactjs.org/docs/hooks-reference.html#useeffect).

<pre class='language-javascriptDiff'><code class='language-javascriptDiff'>
 import React from 'react';
+import { useEffect } from 'react';
 import { useRef } from 'react';
 
 const Circle = () => {
     let ref = useRef();
     
+    useEffect(() => {
+        let canvas = ref.current;
+        let context = canvas.getContext('2d');
+        context.beginPath();
+        context.arc(50, 50, 50, 0, 2 * Math.PI);
+        context.fill();
+    });
     
     return (
         <canvas
             ref={ref} 
             style=&#123;&#123; width: '100px', height: '100px' }}
         />
     );
 };
 
 export default Circle;
</code></pre>

Our `useEffect`{:.language-javascript} callback is free to interact directly with our canvas living in the DOM. In this case, we're drawing a circle to our canvas.

---- 

Unfortunately, our circle may look a little fuzzy or distorted, depending on the pixel density of the screen it's being viewed on. Let's fix that by adjusting the scaling of our `canvas`{:.language-javascript}:

<pre class='language-javascriptDiff'><code class='language-javascriptDiff'>
 import React from 'react';
 import { useEffect } from 'react';
 import { useRef } from 'react';
 
+const getPixelRatio = context => {
+    var backingStore =
+    context.backingStorePixelRatio ||
+    context.webkitBackingStorePixelRatio ||
+    context.mozBackingStorePixelRatio ||
+    context.msBackingStorePixelRatio ||
+    context.oBackingStorePixelRatio ||
+    context.backingStorePixelRatio ||
+    1;
+    
+    return (window.devicePixelRatio || 1) / backingStore;
+};
 
 const Circle = () => {
     let ref = useRef();
     
     useEffect(() => {
         let canvas = ref.current;
         let context = canvas.getContext('2d');
         
+        let ratio = getPixelRatio(context);
+        let width = getComputedStyle(canvas)
+            .getPropertyValue('width')
+            .slice(0, -2);
+        let height = getComputedStyle(canvas)
+            .getPropertyValue('height')
+            .slice(0, -2);
         
+        canvas.width = width * ratio;
+        canvas.height = height * ratio;
+        canvas.style.width = `${width}px`;
+        canvas.style.height = `${height}px`;
         
         context.beginPath();
         context.arc(
+            canvas.width / 2,
+            canvas.height / 2,
+            canvas.width / 2,
             0,
             2 * Math.PI
         );
         context.fill();
     });
     
     return (
         <canvas
             ref={ref} 
             style=&#123;&#123; width: '100px', height: '100px' }}
         />
     );
 };
 
 export default Circle;
</code></pre>

And with that, our circle should be crystal clear.

---- 

Now let's introduce some animation. The standard way of animating an HTML5 canvas is using the `requestAnimationFrame`{:.language-javascript} function to repeatedly call a function that renders our scene. Before we do that, we need to refactor our circle drawing code into a `render`{:.language-javascript} function:

<pre class='language-javascriptDiff'><code class='language-javascriptDiff'>
 useEffect(() => {
     ...
+    const render = () => {
         context.beginPath();
         context.arc(
             canvas.width / 2,
             canvas.height / 2,
             canvas.width / 2,
             0,
             2 * Math.PI
         );
         context.fill();
+    };
     
+    render();
 });
</code></pre>

Now that we have a render function, we can instruct the browser to recursively call it whenever its appropriate to render another frame:

<pre class='language-javascriptDiff'><code class='language-javascriptDiff'>
 const render = () => {
     context.beginPath();
     context.arc(
         canvas.width / 2,
         canvas.height / 2,
         canvas.width / 2,
         0,
         2 * Math.PI
     );
     context.fill();
+    requestAnimationFrame(render);
 };
</code></pre>

This works, but there are two problems. First, if our component unmounts after our call to `requestAnimationFrame`{:.language-javascript}, but before our `render`{:.language-javascript} function is called, it can lead to problems. We should really cancel any pending animiation frame requests any time our component unmounts. Thankfully, `requestAnimationFrame`{:.language-javascript} returns a request identifier that can be passed to `cancelAnimationFrame`{:.language-javascript} to cancel our request.

The `useEffect`{:.language-javascript} hook optionally expects a function to be returned by our callback. This function will be called to handle any cleanup required by our effect. Let's refactor our animation loop to properly clean up after itself:

<pre class='language-javascriptDiff'><code class='language-javascriptDiff'>
 useEffect(() => {
     ...
+    let requestId;
     const render = () => {
         context.beginPath();
         context.arc(
             canvas.width / 2,
             canvas.height / 2,
             canvas.width / 2,
             0,
             2 * Math.PI
         );
         context.fill();
+        requestId = requestAnimationFrame(render);
     };
     
     render();
     
+    return () => {
+        cancelAnimationFrame(requestId);
+    };
 });
</code></pre>

Perfect.

---- 

Our second problem is that our render function _isn't doing anything_. We have no visual indicator that our animation is actually happening!

Let's change that and have some fun with our circle:

<pre class='language-javascriptDiff'><code class='language-javascriptDiff'>
 let requestId,
+    i = 0;
 const render = () => {
     context.clearRect(0, 0, canvas.width, canvas.height);
     context.beginPath();
     context.arc(
         canvas.width / 2,
         canvas.height / 2,
+        (canvas.width / 2) * Math.abs(Math.cos(i)),
         0,
         2 * Math.PI
     );
     context.fill();
+    i += 0.05;
     requestId = requestAnimationFrame(render);
 };
</code></pre>

Beautiful. Now we can clearly see that our animation is running in full swing. This was obviously a fairly contrived example, but hopefully it serves as a helpful recipe for you in the future.

<div id="root" style="height: 100px; width: 100px;"></div>

<script src="/js/2019-08-19-animating-a-canvas-with-react-hooks/runtime~main.a8a9905a.js"></script>
<script src="/js/2019-08-19-animating-a-canvas-with-react-hooks/2.3310f33a.chunk.js"></script>
<script src="/js/2019-08-19-animating-a-canvas-with-react-hooks/main.d0e526e8.chunk.js"></script>

<style>
#root {
    margin: 4em auto;
}

#root canvas {
    height: 100%!important;
    width: 100%!important;
}
</style>
