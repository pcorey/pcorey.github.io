---
layout: post
title:  "Rewriting History"
date:   2016-09-12
tags: []
---

If you’ve been following our blog, you’ll notice that we’ve been writing lots of  what we’re calling [“literate commit”](http://www.east5th.co/blog/2016/07/11/literate-commits/) posts.

The goal of a literate commit style post is to break down each [Git](https://git-scm.com/) commit into a readable, clear explanation of the code change. The idea is that this chronological narrative helps tell the story of how a piece of software came into being.

Combined with tools like [`git blame`{:.language-bash}](https://git-scm.com/docs/git-blame) and [`git log`{:.language-bash}](https://git-scm.com/docs/git-log) you can even generate detailed histories for small, focused sections of the codebase.

But sometimes generating repositories with this level of historical narrative requires something that most Git users warn against: rewriting history.

## Why Change the Past

It’s usually considered bad practice to modify a project’s revision history, and in most cases this is true. However, there are certain situations where changing history is the right thing to do.

In our case, the main artifact of each literate commit project is not the software itself; it’s the revision history. The project serves as a lesson or tutorial.

In this situation, it might make sense to revise a commit message for clarity. Maybe we want to break a single, large commit into two separate commits so that each describes a smaller piece of history. Or, maybe while we’re developing we discover a small change that should have been included in a previous commit. Rather than making an “Oops, I should have done this earlier” commit, we can just change our revision history and include the change in the original commit.

It’s important to note that in these situations, it’s assumed that only one person will be working with the repository. If multiple people are contributing, editing revision history is not advised.

## In The Beginning…

Imagine that we have some [boilerplate](https://github.com/pcorey/base) that we use as a base for all of our projects. Being good developers, we keep track of its revision history using Git, and possibly host it on an external service like [GitHub](https://github.com/).

Starting a new project with this base might look something like this:

<pre class='language-bash'><code class='language-bash'>
mkdir my_project
cd my_project
git clone https://github.com/pcorey/base .
git remote remove origin
git remote add origin https://github.com/pcorey/my_project
</code></pre>

We’ve cloned `base`{:.language-bash} into the `my_project`{:.language-bash} directory, removed it’s `origin`{:.language-bash} pointer to the `base`{:.language-bash} repository, and replaced it with a pointer to a new `my_project`{:.language-bash} repository.

Great, but we’re still stuck with whatever commits existed in the `base`{:.language-bash} project before we cloned it into `my_project`{:.language-bash}. Those commits most likely don’t contribute to the narrative of this specific project and should be changed.

One solution to this problem is to clobber the Git history by removing the `.git`{:.language-bash} folder, but this is the nuclear option. There are easier ways of accomplishing our goal.

The `--root`{:.language-bash} flag of the [`git rebase`{:.language-bash}](https://git-scm.com/docs/git-rebase) command lets us revise _every_ commit in our project, including the root commit. This means that we can interactively rebase and `reword`{:.language-bash} the root commits created in the `base`{:.language-bash} project:

<pre class='language-bash'><code class='language-bash'>
git rebase -i --root master

reword f784c6a First commit
# Rebase f784c6a onto 5d85358 (1 command(s))
</code></pre>

Using `reword`{:.language-bash} tells Git that we’d like to use the commit, but we want to modify its commit message. In our case, we might want to explain the project we’re starting and discuss the base set of files we pulled into the repository.

## Splicing in a Commit

Next, let’s imaging that our project has three commits. The first commit sets up our project’s boilerplate. The second commit adds a file called `foo.js`{:.language-bash}, and the third commit updates that file:

<pre class='language-bash'><code class='language-bash'>
git log --online

1d5f372 Updated foo.js
873641e Added foo.js
b3065c9 Project setup
</code></pre>

What if we forgot to create a file called `bar.js`{:.language-bash} after we created `foo.js`{:.language-bash}. For maximum clarity, we want this file to be created in a new commit following `873641e`{:.language-bash}. How would we do it?

Once again, interactive rebase comes to the rescue. While doing a root rebase, we can mark `873641e`{:.language-bash} as needing editing:

<pre class='language-bash'><code class='language-bash'>
git rebase -i --root master

pick b3065c9 Project setup
edit 873641e Added foo.js
pick 1d5f372 Updated foo.js
</code></pre>

After rebasing, our Git `HEAD`{:.language-bash} will point to `873641e`{:.language-bash}. Our git log looks like this:

<pre class='language-bash'><code class='language-bash'>
git log --online

1d5f372 Updated foo.js
873641e Added foo.js
</code></pre>

We can now add `bar.js`{:.language-bash} and commit the change:

<pre class='language-bash'><code class='language-bash'>
touch bar.js
git add bar.js
git commit -am "Added bar.js"
</code></pre>

Reviewing our log, we’ll see a new commit following `873641e`{:.language-bash}:

<pre class='language-bash'><code class='language-bash'>
git log --online

58f31fd Added bar.js
41817a4 Added foo.js
81df941 Project setup
</code></pre>

Everything looks good. Now we can continue our rebase and check out our final revision history:

<pre class='language-bash'><code class='language-bash'>
git rebase --continue
git log --oneline

b8b7b18 Updated foo.js
58f31fd Added bar.js
41817a4 Added foo.js
81df941 Project setup
</code></pre>

We’ve successfully injected a commit into our revision history!

## Revising a Commit

What if we notice a typo in our project that was introduced by our boilerplate? We don’t want to randomly include a typo fix in our Git history; that will distract from the overall narrative. How would we fix this situation?

Once again, we’ll harness the power of our interactive root rebase!

<pre class='language-bash'><code class='language-bash'>
git rebase -i --root master

edit b3065c9 Project setup
pick 873641e Added foo.js
pick 1d5f372 Updated foo.js
</code></pre>

After starting the rebase, our `HEAD`{:.language-bash} will point to the first commit, `b3065c9`{:.language-bash}. From there, we can fix our typo, and then amend the commit:

<pre class='language-bash'><code class='language-bash'>
vim README.md
git add README.md
git commit --amend
</code></pre>

Our `HEAD`{:.language-bash} is still pointing to the first commit, but now our fixed typo is included in the set of changes!

We can continue our rebase and go about our business, pretending that the typo never existed.

<pre class='language-bash'><code class='language-bash'>
git rebase --continue
</code></pre>

## With Great Power

Remember young Time Lord, with great power comes great responsibility.

Tampering with revision history can lead to serious losses for your project if done incorrectly. It’s recommended that you practice any changes you plan to make in another branch before attempting them in `master`{:.language-bash}. Another fallback is to reset hard to `origin/master`{:.language-bash} if all goes wrong:

<pre class='language-bash'><code class='language-bash'>
git reset --hard origin/master
</code></pre>

While changing history can be dangerous, it’s a very useful skill to have. When you want your history to be the main artifact of your work, it pays to ensure it’s as polished and perfected as possible.
