---
layout: post
title:  "Private Package Problems"
titleParts:  ["Private Package", "Problems"]
date:   2015-05-11
categories:
---

Recently I've been experiencing some pain points when trying to share private package between my [Meteor](https://www.meteor.com/) projects.

Suppose you have two or more Meteor projects that share similar styles, components and functionality. Wouldn't it be nice to bundle those shared bits into packages and use them across all of your projects?

## The Problem With Packages

[Packages](http://docs.meteor.com/#/full/usingpackages) are the solution! Well, partially...

Many articles have been written on the ease-of-use and power of [Meteor's packaging system](https://www.meteor.com/blog/2014/08/28/isobuild-why-meteor-created-a-new-package-system). Unfortunately, when we're writing closed source software, we're not in the position to publish our private packages Meteor's public package ecosystem. Our need for privacy means that we need to share our packages in a different way.

## Git to the Rescue

My first attempt to solve this problem was to keep my private packages within private [Git](http://git-scm.com/) repositories. When an application needed one of these shared packages, I would clone the package into the project's packages folder, and then add the package using the familiar <code class="language-*">meteor add</code> command. Updates to the package could be made by manually running a <code class="language-*">git pull</code> from within the package's directory (goodbye <code class="language-*">meteor update</code>).

<pre class="language-bash"><code class="language-bash">cd packages
git clone https://github.com/pcorey/private-package.git
meteor add private-package
cd private-package
git pull
</code></pre>

Finally, track the new package in the base project and commit the changes:

<pre class="language-bash"><code class="language-bash">git add .
git commit -m "Added private package to project!"
</code></pre>

This will work until a second developer checks out a fresh copy of the project. They'll quickly notice that the <code class="language-bash">packages/private-package</code> is an empty directory! Where did our package go?

Unfortunately, Git noticed that the the <code class="language-bash">packages/private-package</code> directory was actually another Git repository, so it added the directory as an unmapped [submodule](http://git-scm.com/book/en/v2/Git-Tools-Submodules), not a normal folder. This means that the base project isn't concerned with tracking the contents of the <code class="language-bash">packages/private-package</code> directory, assuming that the submodule will handle that itself.

## Git Submodules

[Git submodules](http://git-scm.com/docs/git-submodule) are the "accepted" standard for dealing with this kind of repository nesting. Git expects you to add and map these submodules through a special set of commands. Using our current example, to add <code class="language-bash">private-package</code> to our Meteor project we would:

<pre class="language-bash"><code class="language-bash">git submodule add https://github.com/pcorey/private-package.git packages/private-package
meteor add private-package
</code></pre>

This will pull the package down from its remote repository and set up the submodule mapping within Git. At this point, we can once again commit the changes to our base project. Another developer checking out a fresh copy of the project will now look at <code class="language-bash">packages/private-package</code> and see... an empty directory? Still?

One of the unfortunate subtleties of Git submodules is that they need to be initialized and updated on fresh checkouts:

<pre class="language-bash"><code class="language-bash">git submodule init
git submodule update
</code></pre>

Only then will the remote contents of each submodule be pulled into the project.

This means that the developer doing the checkout must be aware that submodules are being used by the project. This isn't always the case, and often adds an unfortunate complexity when trying to introduce someone to a codebase.

Unfortunately, submodules have their fair share of [quirks](https://chrisjean.com/git-submodules-adding-using-removing-and-updating/) and [problems](https://codingkilledthecat.wordpress.com/2012/04/28/why-your-company-shouldnt-use-git-submodules/).

## "Fake" Submodules

My preferred method of sharing private Meteor packages between projects is a combination of the above two techniques, sometimes referred to as ["fake" git submodules](http://debuggable.com/posts/git-fake-submodules:4b563ee4-f3cc-4061-967e-0e48cbdd56cb).

I begin by cloning my package into the <code class="language-bash">packages</code> folder, as before:

<pre class="language-bash"><code class="language-bash">cd packages
git clone https://github.com/pcorey/private-package.git
meteor add private-package
</code></pre>

There is a subtle step in how the package is added to my base project:

<pre class="language-bash"><code class="language-bash">git add private-package/
</code></pre>

The key here is the "<code class="language-bash">/</code>" at the end of the private-package path. Run a <code class="language-*">git status</code> and you'll notice that all of the private package's files are now being tracked by the project. Additionally, if we <code class="language-*">cd</code> into <code class="language-bash">private-package</code> and run a <code class="language-*">git status</code>, we'll see that the <code class="language-bash">private-package</code> is still operating under it's own independent Git environment. The slash causes Git to treat this sub-repository as a normal directory and happily tracks all files within it without our base project!

Commit the changes to the base project and push them. Now, a new developer checking out a clean copy of the project will see that the <code class="language-bash">private-package</code> directory contains the contents of the package, as expected.

The only downside of this technique is that <code class="language-bash">private-package</code> in the fresh checkout no longer maintains a remote link to its private package repository. If changes need to be made in this package and pushed to the private package's repository, the remote would have to be re-established:

<pre class="language-bash"><code class="language-bash">git init
git remote add https://github.com/pcorey/private-package.git
git checkout master --force
</code></pre>

## Final Thoughts

My final thoughts are that this is a mess. I hope that the Meteor team adds some mechanism for adding and updating packages from private sources, rather than exclusively from its public package ecosystem. Maybe one day it will be as easy as <code class="language-bash">meteor add</code> and <code class="language-bash">meteor update</code>, but for now, these are the tools we have to work with.