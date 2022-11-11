---
layout: post
title:  "Javascript Destructuring and Untrusted Data"
excerpt: "Destructuring can lead to a false sense of security about the contents of your data."
author: "Pete Corey"
date:   2022-11-09
tags: ["Javascript", "Security"]
related: []
---

While digging through a Javascript application, looking for bug bounty opportunities, I found an interesting case of destructuring giving a false sense of security about the contents of an untrusted string.

Imagine you have the following function:

```
const extractParts = (input) => {
  if (!input || input.length < 10) return;
  let [a, b, c] = input.split("|");
  return { a, b, c };
};
```

This function, `extractParts`, is expecting an input string composed of three values, `a`, `b`, and `c`, concatenated together with `"|"` characters, like `"aaaaaa|b|c"`.

In the application where I found this code, `b` and `c` are constants of fixed length of one character, so the implied `input.length >= 10` constraint was really making assertions on the length of `a`. If the length of `a` was less than `6`, there would be problems down the line.

Unfortunately, the destructuring of `input.split("|")` on the next line doesn't give us any guarantees about the real contents of `input`. If `input` contains only two `"|"` characters, our constraint holds. However, our destructuring picks out the first three values of `input.split("|")`, _even if the resulting array contains more than three elements_.

Imagine `input` looks like this: `"a|b|c|dddd"`. Passing this four-part input into `extractParts` yields a resulting object that will cause problems for our application further down the line:

```
extractParts("a|b|c|dddd"); // { a: "a", b: "b", c: "c" }
```

Where did our final `"dddd"` value go? It gave our `input` just enough length to slip past our `input.length < 10` guard, but is was thrown out in the destructuring step, resulting in a malformed `a`! Our array destructuring gave us a false sense of security about the contents of our `input` string.

A better way of writing our assertion might look something like this:

```
const extractParts = (input) => {
  if (!input) return;
  let [a, b, c] = input.split("|");
  if (a.length < 6) return;
  return { a, b, c };
};
```

Asserting on the length of `a` directly prevents any unexpected inputs from slipping by unnoticed:

```
extractParts("a|b|c|dddd"); // undefined
```

Don't let lenient destructuring give you a false sense of security about the shape and contents of untrusted data.
