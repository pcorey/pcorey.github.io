---
layout: post
title:  "Package Scan Web Tool"
titleParts: ["Package Scan", "Web Tool"]
date:   2015-09-28
tags: [""]
---

This past week I've decided to put a little more love into my [`east5th:package-scan`{:.language-*}](https://github.com/East5th/package-scan) project. In an attempt to lower the barrier of entry for using the tool, I've given it a super-simple web interface. Check it out at [scan.east5th.co](http://scan.east5th.co/)!

The tool lets you select or drop in a Meteor `versions`{:.language-bash} file, which will then be compared against the list of packages with known security issues. If any matches are found, it'll display those vulnerable package alerts on the page.

I made a conscious decision to not send `versions`{:.language-bash} files to the server to do the scanning. Instead, I pull the `alerts.json`{:.language-bash} file into the browser, along with a [browserfied](http://browserify.org/) version of [semver](https://github.com/npm/node-semver), and run the scan directly in on the client. This way, the users' `versions`{:.language-bash} files never leave their browser.

Be sure to [try it out](http://scan.east5th.co/), and more importantly, [contribute](https://github.com/East5th/package-scan#contributing) if you know of any vulnerable package versions that we're not reporting!