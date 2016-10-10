---
layout: post
title:  "Mobile Only"
date:   2016-10-17
tags: []
---
I recently finished up a [security assessment](http://www.east5th.co/blog/2016/05/30/anatomy-of-an-assessment/) with a team building a mobile-only application using Meteor.

One of the team’s goals was to prevent users from accessing the application through their browser. Their reasoning being that without access to the browser’s console, attackers would have a harder time exploiting any vulnerabilities that might exist in the application.

Interestingly, due to how Meteor applications work, truly removing the browser-facing portion of an application is impossible. Not only that, but removing the browser-facing user interface wouldn’t prevent a malicious user from exploring an application.

## Uncovering the Bundle

We’ve previously talked about how a potential attacker (or security assessor) could extract a Meteor application’s server URL out of a compiled mobile application.

Armed with this information, the attacker can navigate to this URL, open up their browser console, and start poking your application.

<img style="width: 40%; margin: 1em 0 1em 1em; float:right;" title="Searching for subscriptions in a build bundle" src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/Javascript+Bundle.png">


But what if you wrapped your entire front-end in a `Meteor.isCordova`{:.language-javascript} guard? Wouldn’t that prevent the attacker from being able to access the application with in their browser?


Wrapping your application in a `Meteor.isCordova`{:.language-javascript} guard would initially prevent a potentially malicious user from seeing you’re application’s user interface. However, they would still be able to open their console and interact with your application’s `Meteor`{:.language-javascript} object.

They can still inspect client-side methods, interact with Minimongo, call server-side methods, make subscriptions, etc…

<video width="60%" style="margin: 1em 1em 1em 0em; float: left;" src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/isCordova+%3D+true.webm" autoplay loop controls></video>


Not only that, but a curious user could also view your application’s source and dive into your Javascript bundle. From there, they can peruse through all of the code used to render your user interface, paying special attention to method calls, subscriptions, etc…

<!-- ![](https://s3-us-west-1.amazonaws.com/www.east5th.co/img/Javascript+Bundle.png){:.language-javascrip} -->


On top of all of that, a highly motivated user could even redefine `Meteor.isCordova`{:.language-javascript} to equal `true`{:.language-javascript} when the application is initialized.

This would let the user view your user interface as if they were using a mobile device.

Ultimately, there is no way to prevent a motivated user from interacting with your application from their browser.

## Final Thoughts

The battle for Meteor security (and all web application security) is fought on the server. Any client-side guards of precautions introduced into an application can easily be bypassed by a motivated user.

It’s important to remember that a user has complete control over their computer. This means that they have complete control over the portion of your application that runs on their computer. If the user tells your application to jump, it will ask how high. If the user says that `Meteor.isCordova`{:.language-javascript} is true, then it’s true.

At the end of the day, the only real control you have over your application exists on the server. Take the time to secure your methods, publications, and server-side routes.
