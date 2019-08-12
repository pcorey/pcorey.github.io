---
layout: post
title:  "Scanning Meteor Projects for Node Vulnerabilities"
titleParts: ["Scanning Meteor Projects for", "Node Vulnerabilities"]
excerpt: "Meteor applications can make use of Node.js packages, which opens them up to a world of vulnerabilities. Protect yourself by learning how to scan those packages for known vulnerabilities."
author: "Pete Corey"
date:   2015-12-07
tags: ["Meteor", "Security"]
---

Meteor does not exist in a bubble. All of [Meteor](https://www.meteor.com/) is built on top of [Node.js](https://nodejs.org/en/). This means that while security projects like [`east5th:package-scan`{:.language-*}](https://github.com/East5th/package-scan) can help us find Meteor specific security problems in our projects, we may still be vulnerable to an entire world of vulnerabilities that exist within the Node ecosystem.

There are many Node tools that, like `east5th:package-scan`{:.language-*}, will dig through the [Node packages](https://www.npmjs.com/) being used by your project and alert you if it finds any packages with known security vulnerabilities.

Two great tools that do this are the [Node Security Project](https://nodesecurity.io/) and [Snyk](https://snyk.io/). While these tools are designed to be used with a vanilla Node project, with a little convincing it's possible to use them in the context of a Meteor project.

## Anatomy of a Bundle

It can be difficult to determine which Node packages are being used by a Meteor application. Each Meteor package can pull in its own set of Npm packages, and these dependencies can be difficult to see unless the Meteor package has been explicitly cloned into the `PACKAGE_DIRS`{:.language-bash} directory.

Thankfully, [a bundled Meteor application](http://docs.meteor.com/#/full/meteorbuild) pulls all of these dependencies into a single location. Once an application is bundled, we can dig into the `server`{:.language-bash} Node project (found in `.build/bundle/programs/server`{:.language-bash}). From there we can browse through all of the Node dependencies being used by our various Meteor packages: `npm/*/node_modules/*`{:.language-bash}.

A brand new Meteor project (`meteor create foo`{:.language-bash}) immediately pulls in over a dozen Node packages. Check them out:

<pre class="language-bash"><code class="language-bash">.
├── babel-compiler         <- Meteor package
│   └── node_modules
│       └── meteor-babel   <- Node package
├── ddp-client
│   └── node_modules
│       ├── faye-websocket
│       └── permessage-deflate
├── ddp-server
│   └── node_modules
│       ├── permessage-deflate
│       └── sockjs
├── ecmascript-runtime
│   └── node_modules
│       └── meteor-ecmascript-runtime
├── es5-shim
│   └── node_modules
│       └── es5-shim
├── logging
│   └── node_modules
│       └── cli-color
├── meteor
│   └── node_modules
│       └── meteor-deque
├── mongo
│   └── node_modules
│       └── mongodb-uri
├── npm-mongo
│   └── node_modules
│       └── mongodb
├── promise
│   └── node_modules
│       └── meteor-promise
└── webapp
    └── node_modules
        ├── connect
        ├── send
        └── useragent
</code></pre>

## Using Node Security Project

We can navigate into any of these Node package directories and run an NSP scan. For example, we can check the `sockjs`{:.langauge-*} package use by `ddp-server`{:.langauge-*} like this:

<pre class="language-bash"><code class="language-bash">cd .build/bundle/programs/server/npm/ddp-server/node_modules/sockjs
nsp check
</code></pre>

Thankfully, there are no known vulnerabilities in this Node package:

<pre class="language-bash"><code class="language-bash">(+) No known vulnerabilities found
</code></pre>

We could manually run this check for each Node package, but that would be incredibly time consuming. Why not automate the process?

I wrote a quick bash script that looks for each `package.json`{:.language-bash} found within these top-level Node project folders and runs NSP on them. Here's the script:

<pre class="language-bash"><code class="language-bash">#!/usr/bin/env bash

find bundle/programs/server/npm/*/node_modules/*/package.json |
while read file; do
  DIR="$(dirname $file)"
  pushd "${DIR}" > /dev/null
  OUTPUT="$(nsp check --output summary --color)"
  if [ $? != 0 ]; then
    echo -e "${OUTPUT}"
  fi
  popd > /dev/null
done
</code></pre>

I named this script `mscan`{:.language-javascript} and threw it into my `~/bin`{:.language-bash} folder. To use it, build your meteor project, navigate into the newly created build directory, and run the script:

<pre class="language-bash"><code class="language-bash">meteor build --directory .build &&
cd .build &&
mscan
</code></pre>

Even for a brand new Meteor project, the results of this scan are somewhat suprising:

<pre class="language-bash"><code class="language-bash">(+) 3 vulnerabilities found
 Name        Installed   Patched     Path   More Info
 uglify-js   2.2.5       >=2.6.0            https://nodesecurity.io/advisories/48
 uglify-js   2.2.5       >= 2.4.24          https://nodesecurity.io/advisories/39
 uglify-js   2.4.24      >=2.6.0            https://nodesecurity.io/advisories/48


(+) 4 vulnerabilities found
 Name   Installed   Patched    Path             More Info
 send   0.1.4       >=0.11.1   connect > send   https://nodesecurity.io/advisories/56
 send   0.1.4       >= 0.8.4   connect > send   https://nodesecurity.io/advisories/32
 qs     0.6.5       >= 1.x     connect > qs     https://nodesecurity.io/advisories/28
 qs     0.6.5       >= 1.x     connect > qs     https://nodesecurity.io/advisories/29
</code></pre>

It looks like Meteor core is pulling in a few Node packages with known security issues. Very interesting! It's worth taking a look at these advisories and considering what impact (if any) they might have on your Meteor application.

## Drawbacks and Final Thoughts

One thing to note about the NSP tool is that it will only scan the dependencies found in a `package.json`{:.language-bash} file for vulnerabilities. It ___will not check if the package itself has any known issues___. This means that if we run `nsp check`{:.language-bash} on the `mongodb`{:.language-*} Node package, it will only report any vulnerabilities in `mongodb`{:.language-*}'s dependencies, not any vulnerabilities with the package itself.

This is a [known issue](https://github.com/nodesecurity/nsp/issues/67) and the Node Security Project team are actively working on a fix.

The bash script I created to do these scans certainly isn't the most user friendly tool. If you find it interesting or useful, I can give it a little more love and turn it into a Npm-installable command line tool, which may be more straight-forward to use.

