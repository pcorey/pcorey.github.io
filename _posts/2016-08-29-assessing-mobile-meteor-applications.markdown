---
layout: post
title:  "Assessing Mobile Meteor Applications"
excerpt: "How do I carry out security assessments against mobile-only Meteor applications? The same way I carry out any other security assessment!"
author: "Pete Corey"
date:   2016-08-29
tags: ["Javascript", "Meteor", "Security", "Mobile"]
---

Some [Meteor](https://www.meteor.com/) applications are released solely as mobile applications. They’re intended to be experienced natively as a [Cordova](https://cordova.apache.org/)-powered application, rather than on the web through a browser.

From a security perspective, does this matter? Are [security assessments](http://www.east5th.co/blog/2016/05/30/anatomy-of-an-assessment/) for mobile-only applications approached differently than web-only, or web and mobile applications?

The answer to both questions is a resounding no!

## Web is Always an Option

An interesting side-effect of the Meteor build process means that the “web” version of an application is always accessible, even if you intended to release it exclusively as a native mobile application.

During the mobile build process, you point your application at a hosted Meteor server. The mobile application communicates with the server, pulling down data and updated application code.

<pre class='language-bash'><code class='language-bash'>
> meteor help build
...
Options:
  --server  Location where mobile builds connect to the Meteor server.
            Defaults to localhost:3000. Can include a URL scheme
            (for example, --server=https://example.com:443).
</code></pre>

As expected, the application can also be accessed by navigating to this server URL directly with a browser.

This [browser build](https://github.com/meteor/meteor/blob/05f65f9b2180efa6293289393e4fa0e3b1efa3a9/tools/project-context.js#L1133) [can’t be ￼disabled](https://github.com/meteor/meteor/blob/be986fd70926c9dd8eff6d8866205f236c8562c4/tools/cli/commands-cordova.js#L94-L99) ￼with current versions of Meteor. Trying to remove the “browser” platform results in an error:

<pre class='language-bash'><code class='language-bash'>
> meteor remove-platform browser

While removing platforms:
error: browser: cannot remove platform in this version of Meteor
</code></pre>

This means that the front-end of a Meteor application can always be seen by prying eyes.

## Unzipping The Application

Let’s imagine that we’re trying to assess a Meteor mobile application called FooApp.

When we only have access to the compiled mobile application, how can we discover the Meteor server’s URL?

It turns out this is a fairly straight-forward process. We’ll dig into it for iOS applications (`*.ipa`{:.language-javascript} archive files), but the same process applies to Android applications (`*.apk`{:.language-javascript} archive packages).

Once we’ve downloaded FooApp through iTunes, its `*.ipa`{:.language-javascript} file can usually be found at `~/Music/iTunes/iTunes Media/Mobile Applications/FooApp<version>.ipa`{:.language-javascript}.

Interestingly, iOS application archives can be unzipped using a standard archiving tool. The first step to discovering our server URL is to unzip the archive:

<pre class='language-bash'><code class='language-bash'>
unzip FooApp&lt;version&gt;.ipa -d FooApp
</code></pre>

We can now peruse through the contents of the FooApp bundle in the `FooApp`{:.language-javascript} folder.

## Finding the Server

Once we’ve unzipped our application, the server URL is within our reach.

To discover the server URL, open `FooApp/Payload/FooApp.app/www/application/index.html`{:.language-javascript}. In that file, you’ll find a URL-encoded `__meteor_runtime_config__`{:.language-javascript} variable.

You can copy and paste that `__meteor_runtime_config__`{:.language-javascript} declaration into a browser console, and then print it in a more human friendly format:

<pre class='language-javascript'><code class='language-javascript'>
__meteor_runtime_config__ = JSON.parse(decodeURIComponent("..."));
JSON.stringify(__meteor_runtime_config__, null, 2);
</code></pre>

The result should look something like this:

<pre class='language-javascript'><code class='language-javascript'>
{
  "meteorRelease": "METEOR@1.3.3-ddp-batching-beta.0",
  "ROOT_URL": "https://www.fooapp.com/",
  "ROOT_URL_PATH_PREFIX": "",
  "DDP_DEFAULT_CONNECTION_URL": "https://www.fooapp.com/",
  "autoupdateVersionCordova": "86e83cfe388118db86733f1333e3a2962fcad1b6",
  "appId": "ABCDEFGHIJ1234567890",
  "meteorEnv": {
    "NODE_ENV": "production"
  }
}
</code></pre>

You’ll notice that both `ROOT_URL`{:.language-javascript} and `DDP_DEFAULT_CONNECTION_URL`{:.language-javascript} point to `"https://www.fooapp.com/"`{:.language-javascript}. This is the server URL that we’ve been searching for!

Navigating to the server would deliver all of the client-side code to our browser (even if it’s guarded by a `Meteor.isCordova`{:.language-javascript} check), and give us access to call all Meteor methods and publications.

Now we can [assess our mobile Meteor application](http://www.east5th.co/blog/2016/05/30/anatomy-of-an-assessment/) just like any other Meteor application!
