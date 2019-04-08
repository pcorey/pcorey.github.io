---
layout: post
title:  "FizzBuzz is Just a Three Against Five Polyrhythm"
description: "Sometimes the lines blur between band practice and programming practice. It turns out that the classic FizzBuzz problem is just a three against five polyrhythm."
author: "Pete Corey"
date:   2019-04-08
tags: ["Javascript", "Music"]
related: []
---

Congratulations, you're now the drummer in my band. Unfortunately, we don't have any drums, so you'll have to make due by snapping your fingers. Your first task, as my newly appointed drummer, is to play a steady beat with your left hand while I lay down some tasty licks on lead guitar.

<video style="width: 100%;" src="https://s3-us-west-1.amazonaws.com/www.east5th.co/static/2019-04-08-fizzbuzz-is-just-a-three-against-five-polyrhythm/Left+Hand.webm" controls></video>

Great! Now let's add some spice to this dish. In the span of time it takes you to snap three times with your left hand, I want you to lay down five evenly spaced snaps with your right. You probably already know this as the drummer in our band, but [this is called a polyrhythm](https://www.youtube.com/watch?v=U9CgR2Y6XO4).

Sound easy? Cool, give it a try!

<video style="width: 100%;" src="https://s3-us-west-1.amazonaws.com/www.east5th.co/static/2019-04-08-fizzbuzz-is-just-a-three-against-five-polyrhythm/Both+Hands+Fail.webm" controls></video>

...

Hmm, I guess being a drummer is harder than I thought. Let's take a different approach. This time, just start counting up from one. Every time you land on a number divisible by three, snap your left hand. Every time you land on a number divisible by five, snap your right hand. If you land on a number divisible by both three and five, snap both hands.

Go!

<video style="width: 100%;" src="https://s3-us-west-1.amazonaws.com/www.east5th.co/static/2019-04-08-fizzbuzz-is-just-a-three-against-five-polyrhythm/Both+Hands+Counting.webm" controls></video>

You'll notice that fifteen is the first number we hit that requires we snap both hands. After that, the snapping pattern repeats. Congratulations, you don't even have that much to memorize!

Here, maybe it'll help if I [draw things out for you](https://twitter.com/adamneelybass/status/1104782192088092673). Every character represents a tick of our count. `"ı"`{:.language-javascript} represents a snap of our left hand, `":"`{:.language-javascript} represents a snap of our right hand, and `"i"`{:.language-javascript} represents a snap of both hands simultaneously.

But man, I don't want to have to manually draw out a new chart for you every time I come up with a sick new beat. Let's write some code that does it for us!

<pre class='language-javascript'><code class='language-javascript'>
_.chain(_.range(1, 15 + 1))
    .map(i => {
        if (i % 3 === 0 && i % 5 === 0) {
            return "i";
        } else if (i % 3 === 0) {
            return "ı";
        } else if (i % 5 === 0) {
            return ":";
        } else {
            return ".";
        }
    })
    .join("")
    .value();
</code></pre>

Here's the printout for the "three against five" polyrhythm I need you to play:

<pre class='language-*'><code class='language-*'>..ı.:ı..ı:.ı..i
</code></pre>

But wait, this looks familiar. It's [FizzBuzz](http://wiki.c2.com/?FizzBuzzTest)! Instead of printing `"Fizz"`{:.language-javascript} for our multiples of three, we're printing `"i"`{:.language-javascript}, and instead of printing `"Buzz"`{:.language-javascript} for our multiples of five, we're printing `"ı"`{:.language-javascript}.

__FizzBuzz is just a three against five polyrhythm.__

<video style="width: 100%;" src="https://s3-us-west-1.amazonaws.com/www.east5th.co/static/2019-04-08-fizzbuzz-is-just-a-three-against-five-polyrhythm/Both+Hands+Groove.webm" controls></video>

We could even generalize our code to produce charts for any kind of polyrhythm:

<pre class='language-javascript'><code class='language-javascript'>
const polyrhythm = (pulse, counterpulse) =>
    _.chain(_.range(1, pulse * counterpulse + 1))
    .map(i => {
            if (i % pulse === 0 && i % counterpulse === 0) {
                return "i";
            } else if (i % pulse === 0) {
                return "ı";
            } else if (i % counterpulse === 0) {
                return ":";
            } else {
                return ".";
            }
        })
        .join("")
        .value();
</code></pre>

And while we're at it, we could drop this into a React project and create [a little tool that does all the hard work for us](https://codepen.io/pcorey/pen/WmgOBx?editors=0110):

<div id="root" style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 4em 0;"></div>
<script src="/js/2019-04-01-fizzbuzz-is-just-a-three-against-five-polyrhythm/runtime~main.a8a9905a.js"></script>
<script src="/js/2019-04-01-fizzbuzz-is-just-a-three-against-five-polyrhythm/2.ad11b806.chunk.js"></script>
<script src="/js/2019-04-01-fizzbuzz-is-just-a-three-against-five-polyrhythm/main.cdaa8cc6.chunk.js"></script>

Anyways, we should get back to work. We have a Junior Developer interview lined up for this afternoon. Maybe we should have them play us a polyrhythm to gauge their programming abilities?
