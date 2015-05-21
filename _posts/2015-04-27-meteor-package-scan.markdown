---
layout: post
title:  "Meteor Package Scan"
titleParts:  ["Meteor", "Package Scan"]
date:   2015-04-27
categories:
---

In response to my last Meteor Black Box post about [Package Scanning](http://www.1pxsolidtomato.com/2015/04/24/black-box-meteor-package-scanning/), I was inspired to build a tool to help improve the safety of the Meteor package ecosystem. That tool is [Package Scan](https://github.com/East5th/package-scan)!

Package Scan is a [Meteor](https://www.meteor.com/) package that will parse your <code class="language-*">.meteor/versions</code> file and compare the packages being used by your project against a list of packages with known security issues. If a vulnerable package is detected, a warning will be shown in your server logs. Package Scan is debug only, so it will never be built into your production application.

The goal is Package Scan is to give Meteor developers an extra layer of knowledge and insight about the packages they're using in their projects. My vision is that, with help from the community, Package Scan will enable developers to quickly discover and understand the security implications of the packages being used in their projects, or give some level of peace of mind if no vulnerable packages are detected.

The key to Package Scan will be community involvement. Without help from other package developers and users, I’ll have no hope of ever maintaining a comprehensive and up to date package warning list. It’s my hope that whenever a security problem is discovered in a version of a package, Package Scan will be updated with a new alert.

The mechanism I’m using for updating the Package Scan alert repository is to keep all of the alerts in a [JSON](http://www.json.org/) file ([data/alerts.json](https://github.com/East5th/package-scan/blob/master/data/alerts.json)). That JSON file holds a list of alerts for each package, and each alert holds a [semver range](https://github.com/npm/node-semver#ranges) representing the vulnerable range of that package along with the actual alert text. This file is actually fetched directly from [GitHub](https://github.com/) by the Package Scan package when it’s installed in a project, which means that the alert repository can be updated without having to update Package Scan itself. To contribute an alert, just submit a pull request against <code class="language-*">alerts.json</code>.

Read more about the package on the [GitHub project page](https://github.com/East5th/package-scan)!
