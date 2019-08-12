---
layout: post
title:  "Building Check-Checker as a Meteor Plugin"
titleParts: ["Building check-checker as a", "Meteor Plugin"]
excerpt: "Let's use Meteor's Build Plugin API to refactor our Check Checker package into a plugin."
author: "Pete Corey"
date:   2015-11-23
tags: ["Javascript", "Meteor", "Security"]
---

I recently decided to switch my [`east5th:check-checker`{:.language-bash}](https://github.com/East5th/check-checker) package to use the new [Build Plugin API](https://forums.meteor.com/t/try-out-a-preview-of-batch-build-plugins-and-other-1-2-features/7374).


<!--The new Build Plugin API introduces three types of plugins to the Meteor ecosystem: [linters](https://github.com/meteor/meteor/wiki/Build-Plugins-API#linters), [minifiers](https://github.com/meteor/meteor/wiki/Build-Plugins-API#minifiers), and [compilers](https://github.com/meteor/meteor/wiki/Build-Plugins-API#compilers). The goal of check-checker is to look for missing `check` calls, so we'll be implementing it as a linker.-->


Before switching to the new linter API, I was using [ESLint's CLIEngine](http://eslint.org/) to power `check-checker`{:.language-bash}. This resulted in [a few bugs](https://github.com/East5th/check-checker/issues/6) due to assumptions CLIEngine made about its environment. I decided to ditch CLIEngine and have Meteor's new linter API do the heavy lifting of delivering the files that need to be checked.

Buried deep within the Meteor wiki, there's a [fantastic guide for working with the new Build Plugin API](https://github.com/meteor/meteor/wiki/Build-Plugins-API). This wiki entry, combined with the [jshint](https://github.com/meteor/meteor/tree/devel/packages/jshint) package were my guiding lights for this refactor.

<hr/>

The first step to turning a package into a linter is to modify your `package.js`{:.language-bash}. Linters, minifiers, and compilers are all considered "plugins" within the Meteor ecosystem, and need to be registered as such. This is done through a call to `Package.registerBuildPlugin`{:.language-javascript}:

<pre class="language-javascript"><code class="language-javascript">Package.registerBuildPlugin({
 name: "check-checker",
 sources: [
   "lib/rules/checks.js",
   "lib/check-checker.js"
 ],
 npmDependencies: {
   eslint: "0.24.1"
 }
});

Package.onUse(function(api) {
 api.use("isobuild:linter-plugin@1.0.0");
});
</code></pre>

<hr/>

In our package code, we register our linter with a call to `Plugin.registerLinter`{:.language-javascript}. We pass in the types of files we want to operate on, the architectures we want to look for these files in, and a function that returns an instance of our linter.

By specifying an architecture of `"os"`{:.language-javascript}, our linter will only rerun when changes are made to server code. Client source files will be ignored.

<pre class="language-javascript"><code class="language-javascript">Plugin.registerLinter({
 extensions: ["js"],
 archMatching: "os"
}, function() {
 return new CheckChecker();
});
</code></pre>

<hr/>

This last argument is the most important. You'll notice that we're returning a new instance of a `CheckChecker`{:.language-javascript} function. Later on, we add a function to `CheckChecker.prototype`{:.language-javascript} called `processFilesForPackage`{:.language-javascript}.

This function is called directly by the linter for each set of files that match the criteria we specified above. The goal of our linter is to iterate over each of these files, looking for missing calls to `check`{:.language-javascript}. When we find a problem we report it through a call to the `error` function with is attached automatically to each file instance we're given.

<pre class="language-javascript"><code class="language-javascript">function CheckChecker() {
 eslint.linter.defineRule('checks', checks);
};

CheckChecker.prototype.processFilesForPackage = function(files, options) {
...
 files.forEach(function(file) {
   var source = file.getContentsAsString();
   var path = file.getPathInPackage();
   var results = eslint.linter.verify(source, config, path);
   results.forEach(function(result) {
     file.error({
       message: result.message,
       line: result.line,
       column: result.column
     });
   });
 });
};
</code></pre>

<hr/>

The rest of the `processFilesForPackage` function is ESLint specific and fairly uninteresting. We're setting up a configuration object, and verifying that the give file complies with all of the rules we've created.

If you dig through the [`check-checker`{:.language-bash} source](https://github.com/East5th/check-checker), you'll notice that I'm using `getSourceHash`{:.language-javascript} to accomplish some basic in-memory caching. The goal here is to prevent ESLint from running on files it's already verified. It's [recommended that you do some kind of caching](https://github.com/meteor/meteor/wiki/Build-Plugins-API#caching) to keep build times as fast as possible.

<hr/>

Creating linters using Meteor's new Build Plugin API is a fairly straight-forward and painless process. I highly recommend taking a look at [Build Plugin API wiki entry](https://github.com/meteor/meteor/wiki/Build-Plugins-API) and the [jshint package](https://github.com/meteor/meteor/tree/devel/packages/jshint) as an example implementation.

If you want another example of a linter using the Batch Plugin API, check out [`east5th:check-checker`{:.language-bash}](https://github.com/East5th/check-checker)!
