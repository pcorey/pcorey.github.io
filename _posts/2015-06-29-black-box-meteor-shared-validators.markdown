---
layout: post
title:  "Black Box Meteor - Shared Validators"
titleParts: ["Black Box Meteor", "Shared Validators"]
description: "Validator functions for Meteor collections belong on the server. Find out why from a hands-on perspective."
author: "Pete Corey"
date:   2015-06-29
tags: ["Javascript", "Meteor", "Security", "Black Box Meteor"]
---

[Discover Meteor’s](https://www.discovermeteor.com/) recent blog series about allow and deny security has done a great job at raising awareness around the security concerns that surround collection validators. Check out their [Allow & Deny: A Security Primer](https://www.discovermeteor.com/blog/allow-deny-a-security-primer/) post for a rundown on validator security.

## Isomorphic Woes

One question I've asked myself is where do we put these <code class="language-javascript">allow</code> and <code class="language-javascript">deny</code> methods within our Meteor application? Intuitively, we may think that the best place to keep them is where we've defined our collections - in a shared location visible to the client and server. This seems to be a very common pattern amongst Meteor developers. You can even see it in [Sacha’s allow & deny challenge final example](http://meteorpad.com/pad/ytJY8gyWYuteziDkY/Chatroom%20-%20Solution). He’s defining his <code class="language-javascript">allow</code> and <code class="language-javascript">deny</code> methods for the <code class="language-javascript">Messages</code> collection in <code class="language-*">common.js</code>.

So what’s the big deal? Why does this matter? Well, imagine if your <code class="language-javascript">allow</code> and <code class="language-javascript">deny</code> methods weren’t completely secure. Would it be a good idea to ship those methods down to the client where any malicious user could browse through them at their convenience? Probably not, but that’s exactly what’s happening.

Open the <code class="language-javascript">allow</code> and <code class="language-javascript">deny</code> challenge [MeteorPad](http://meteorpad.com/pad/ytJY8gyWYuteziDkY/Chatroom%20-%20Solution), and in your browser's console run the following statement:

<pre class="language-javascript"><code class="language-javascript">> Messages._validators.update.allow[1].toString();
</code></pre>

<pre class="language-javascript"><code class="language-javascript">< "function (userId, doc, fields, modifier) {
    
    // log out checks
    console.log("// All checks must return true:");
    console.log(!!userId);
    console.log(!_.contains(doc.likes, userId));
    console.log(_.keys(modifier).isEqualTo(["$addToSet", "$inc"]));
    console.log(_.keys(modifier.$addToSet).isEqualTo(["likes"]));
    console.log(_.keys(modifier.$inc).isEqualTo(["likesCount"]));
    console.log(modifier.$addToSet.likes === userId);
    console.log(modifier.$inc.likesCount === 1);
    
    var check = 
      userId &&
      !_.contains(doc.likes, userId) &&
      _.keys(modifier).isEqualTo(["$addToSet", "$inc"]) &&
      _.keys(modifier.$addToSet).isEqualTo(["likes"]) &&
      _.keys(modifier.$inc).isEqualTo(["likesCount"]) &&
      modifier.$addToSet.likes === userId &&
      modifier.$inc.likesCount === 1;
      
    return check;
  }"
</code></pre>

You’ll notice that the entire source of the <code class="language-javascript">allow</code> function is visible to the client! Take some time and explore the <code class="language-javascript">_validators</code> object. You’ll notice that all <code class="language-javascript">allow</code> and <code class="language-javascript">deny</code> methods for the <code class="language-javascript">Messages</code> collection are being passed to the client.

## Server-side Solution

The correct place to keep your <code class="language-javascript">allow</code> and <code class="language-javascript">deny</code> methods is on the server. Peruse through the [official docs](http://docs.meteor.com/#/full/allow) and read the wording surrounding the <code class="language-javascript">allow</code> and <code class="language-javascript">deny</code> methods. Notice that they're specifically marked as server functionality.

> When a client calls <code class="language-javascript">insert</code>, <code class="language-javascript">update</code>, or <code class="language-javascript">remove</code> on a collection, the collection's <code class="language-javascript">allow</code> and <code class="language-javascript">deny</code> callbacks are called on the server to determine if the write should be allowed.

By keeping your methods on the server, a malicious user will not be given to opportunity to dig through them with a fine-toothed comb. They would be reduced to manual testing or fuzzing to find vulnerabilities in your collection validators.

I feel it’s important for me to mention that I’m not advocating hiding your <code class="language-javascript">allow</code> and <code class="language-javascript">deny</code> methods as an alternative to properly securing them. You should do your absolute best to correctly secure your validators. Moving them to the server simply gives you a small layer of protection against attackers and makes their job slightly harder. Remember, __[security through obscurity](https://en.wikipedia.org/wiki/Security_through_obscurity) is not security__.
