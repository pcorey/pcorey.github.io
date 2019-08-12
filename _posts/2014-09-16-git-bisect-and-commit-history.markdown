---
layout: post
title:  "Git Bisect and Commit History"
titleParts: ["Git Bisect", "and Commit History"]
excerpt: "Git's bisect tool is a powerhouse of a tool that often doesn't get the love it deserves."
author: "Pete Corey"
date:   2014-09-16
tags: ["Git"]
---

Every time I use [git bisect](http://git-scm.com/docs/git-bisect) I find myself giddy with excitement.  The tool is absolutely amazing at tracking down where a bug crept its way into your code. Being able to find the offending commit in minutes leaves me with an unhealthy sense of power over my code base. Sometimes git bisect can lead to an obvious fix if the bad commit is small, but sometimes a large commit can lead to hours of investigation.

When bisecting, I sometimes land on a commit like this:

<pre class="language-*"><code class="language-*">f934e... is the first bad commit
commit f934e...
Author: ...
Date: ...
   Case #12345. Implemented feature X.</code></pre>

Feature X was huge. This commit touches hundreds of lines and dozens of files. I might have been doing frequency local commits while I was developing the feature, but I decided to be kind to my co-workers and my future self by rebasing everything into a tidy single commit in order to keep the repo history clean.  Now, I’m faced with sleuthing through this behemoth to find my bug.

This always makes me question whether I should be rebasing my local commits before pushing them, or leaving them separate and pushing a large chain of commits to the trunk. By squashing and rebasing, you can cleanly revert large chunks of code (whole features) and quickly understand the project history at a glance. By not rebasing, you can quickly find where bugs were introduced and see the history through a more focused lens.

Personally, when working in teams, I try to keep my contributions to the trunk be fully self-contained. If I’m implementing a feature or fixing a bug, I want all of the changes related to that be in a single commit. This means that I squash and rebase my local commits before pushing. However, when I’m working independently, I find that I don’t rebase. I just push my chain of local commits.
