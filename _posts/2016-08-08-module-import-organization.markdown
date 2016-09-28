---
layout: post
title:  "Module Import Organization"
date:   2016-08-08
tags: []
---

In [our last post](/blog/2016/08/01/method-imports-and-exports/) discussing the benefits of moving your methods, publications, and templates into modules, we mentioned that all of this [Meteor](https://www.meteor.com/)-specific functionality relied on modifying global state.

This means that our modules didn’t need to export anything. However, they do need to be imported at least once by your main Meteor application.

Importing these modules executes your calls to `Meteor.methods(...)`{:.language-javascript}, `Meteor.publish(...)`{:.language-javascript}, etc… and makes them accessible to the rest of your application.

Depending on how you structure your imports, this kind of upfront importing can quickly get out of hand.

## The Problem With Direct Imports

Imagine we have an `/imports/lib`{:.language-bash} folder in our project. Within that folder we break up our application’s functionality into distinct components, like `foo`{:.language-bash} and `bar`{:.language-bash}. Each component has it’s own set of Meteor methods defined in a `methods.js`{:.language-bash} file:

<pre class='language-bash'><code class='language-bash'>
.
└── imports
    └── lib
        ├── bar
        │   └── methods.js
        └── foo
            └── methods.js
</code></pre>

To make sure these methods are registered when our application starts, we’ll need to update both our `/client/mains.js`{:.language-bash} and our `/server/main.js`{:.language-bash} to import these method files:

<pre class='language-javascript'><code class='language-javascript'>
import "/imports/lib/foo/methods";
import "/imports/lib/bar/methods";
</code></pre>

This import structure seems to make sense so far.

It might get more difficult to deal with if we start to aggressively break up our methods, but we’ll put that out of our minds for now.

---- 

When we begin adding template modules, our `/imports`{:.language-bash} folder structure will quickly begin to balloon in size:

<pre class='language-bash'><code class='language-bash'>
.
└── imports
    ├── client
    │   ├── bar
    │   │   ├── template-1
    │   │   │   ├── template-1.js
    │   │   │   └── template-2.html
    │   │   └── template-2
    │   │       └── ...
    │   └── foo
    │       ├── template-3
    │       │   ├── template-3.js
    │       │   └── template-3.html
    │       └── template-4
    │           └── ...
    └── lib
        ├── bar
        │   └── methods.js
        └── foo
            └── methods.js
</code></pre>

Now we’ll have to update our `/client/main.js`{:.language-bash} to pull in each of these templates:

<pre class='language-javascript'><code class='language-javascript'>
import "/imports/lib/foo/methods";
import "/imports/lib/bar/methods";

import "/imports/client/bar/template-1/template-1";
import "/imports/client/bar/template-2/template-2";
import "/imports/client/foo/template-3/template-3";
import "/imports/client/foo/template-4/template-4";
</code></pre>

Our `/client/main.js`{:.language-bash} file has to keep up with every defined method and template in the system. Similarly, our `/server/main.js`{:.language-bash} will have to keep up with ever method definition and publication definition (and potentially every template definition, if we’re using [SSR](https://meteorhacks.com/server-side-rendering/)).

This breaks the clean modularity of our system. Our `main.js`{:.language-bash} files need to be intimately aware of the structure and implementation of all of our component pieces.

## Index Files to the Rescue

Thankfully, index files can lead us out of this increasingly hairy situation.

When an `index.js`{:.language-bash} file is present in a directory, attempting to import that directory will cause the `index.js`{:.language-bash} file to be imported on its behalf. For example, consider this folder structure:

<pre class='language-bash'><code class='language-bash'>
.
└── baz
    └── index.js
</code></pre>

If we import `"baz"`{:.language-javascript} (`import "./baz"`{:.language-javascript}), `index.js`{:.language-bash} will be imported instead.

We can leverage this to organize our `/imports`{:.language-bash} structure and clean up our `main.js`{:.language-bash} files. Let’s start by adding an `index.js`{:.language-bash} file to each method and template “component”:

<pre class='language-bash'><code class='language-bash'>
.
└── imports
    ├── client
    │   ├── bar
    │   │   ├── template-1
    │   │   │   ├── index.js
    │   │   │   ├── template-1.js
    │   │   │   └── template-2.html
    │   │   └── template-2
    │   │       └── ...
    │   └── foo
    │       └── ...
    └── lib
        ├── bar
        │   │── index.js
        │   └── methods.js
        └── foo
            └── ...
</code></pre>

Our `/imports/client/bar/template-1/index.js`{:.language-bash} file only needs to be concerned about importing the files related to the `template-1`{:.language-javascript} component:

<pre class='language-javascript'><code class='language-javascript'>
import "./template-1";
</code></pre>

Similarly, our `/imports/lib/bar/index.js`{:.language-bash} file only needs to be concerned about importing the method and other server-side functionality related to the `bar`{:.language-javascript} component:

<pre class='language-javascript'><code class='language-javascript'>
import "./methods.js";
</code></pre>

Fantastic. Now, let’s move up in our folder tree, adding `index.js`{:.language-bash} files at each step along the way until we hit our `client`{:.language-bash}, `lib`{:.language-bash}, or `server`{:.language-bash} folders:

<pre class='language-bash'><code class='language-bash'>
.
└── imports
    ├── client
    │   ├── index.js
    │   ├── bar
    │   │   ├── index.js
    │   │   ├── template-1
    │   │   │   ├── index.js
    │   │   │   ├── template-1.js
    │   │   │   └── template-2.html
    │   │   └── template-2
    │   │       └── ...
    │   └── foo
    │       └── ...
    └── lib
        ├── index.js
        ├── bar
        │   │── index.js
        │   └── methods.js
        └── foo
            └── ...
</code></pre>

Our newly created `/imports/client/bar/index.js`{:.language-bash} file is concerned about importing all of the templates and functionality related to the `bar`{:.language-javascript} component:

<pre class='language-javascript'><code class='language-javascript'>
import "./template-1";
import "./template-2";
</code></pre>

We can finish up our import chain on the client by updating our new `/imports/client/index.js`{:.language-bash} file to import the `foo`{:.language-bash} and `bar`{:.language-bash} client-side components:

<pre class='language-javascript'><code class='language-javascript'>
import "./bar";
import "./foo";
</code></pre>

We can do the same thing in our `/imports/lib`{:.language-bash} folder by updating our new `/imports/server/index.js`{:.language-bash} file:

<pre class='language-javascript'><code class='language-javascript'>
import "./bar";
import "./foo";
</code></pre>

Finally, we can drastically simplify our `/client/main.js`{:.language-bash} and `/server/main.js`{:.language-bash} files to only pull in what we need at a very high level.

On the client (`/client/main.js`{:.language-bash}), we’ll just want to import client-only and shared components:

<pre class='language-javascript'><code class='language-javascript'>
import "/imports/lib";
import "/imports/client";
</code></pre>

And on the server (`/server/main.js`{:.language-bash}), we (currently) only want to import the shared components:

<pre class='language-javascript'><code class='language-javascript'>
import "/imports/lib";
</code></pre>

If we had a set of server-only components we could easily include it there as well.

## Reaping the Benefits

I’m a big fan of this structure.

Each level of our dependency tree only has to concern itself with the next level. Our `client`{:.language-bash} folder only has to know that it wants to pull in the `foo`{:.language-bash} and `bar`{:.language-bash} components. It doesn’t need to know which templates those components use. The `foo`{:.language-bash} and `bar`{:.language-bash} components manage the importing of their templates themselves!

If you wanted to add a new template to the `bar`{:.language-bash} component, you’d simply add the template folder into `/imports/client/bar/`{:.language-bash}, with an index file that pulls in the required files. Lastly, you’d update `/imports/client/bar/index.js`{:.language-bash} to import that new template.

Removing a template is as simple as deleting its folder and removing the `import`{:.language-javascript} reference from its parent’s `index.js`{:.language-bash} file.
