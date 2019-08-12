---
layout: post
title:  "Package Scan Community Contributions"
titleParts: ["Package Scan", "Community Contributions"]
excerpt: "Package Scan is getting some love from the community!"
author: "Pete Corey"
date:   2015-10-13
tags: ["Meteor", "Security"]
---

This past month was a good month for [Package Scan](https://github.com/East5th/package-scan).

Not only did I release the [Package Scan Web Tool](http://scan.east5th.co/), but the project also saw its first community contributions! [Evolross](https://github.com/evolross) and [Charles Watson](https://github.com/sircharleswatson) both found vulnerable packages in the wild and [added alerts](https://github.com/East5th/package-scan/#contributing) to Package Scan.

<hr/>

Charles found an issue with older versions of [`babrahams:editable-json
`{:.language-*}](https://github.com/JackAdams/meteor-editable-json) `(<= 0.5.1)`{:.language-*} that allows for any user to run arbitrary updates on any document in any collection. This means that a user could potentially run an update on their own user document to give themselves administrator permissions:

<pre class="language-javascript"><code class="language-javascript">Meteor.call("editableJSON_update", "users", Meteor.userId(), {
  $set: {
    roles: ["admin"]
  }
});
</code></pre>

<hr/>

Evolross reported an [ongoing issue](https://github.com/CollectionFS/Meteor-CollectionFS/issues/550) with the current version of [`cfs:standard-packages`{:.language-*}](https://github.com/CollectionFS/Meteor-CollectionFS). Exceptions in your `transformWrite`{:language-javascript} callbacks can trigger repeated server crashes as CollectionFS attempts to transform the file on each server restart. These exceptions can easily be triggered by users uploading files of unexpected types that blow up when passed into `gm`{:.language-javascript}. Using this bug, an attacker could easily orchestrate a [Denial of Service](https://www.owasp.org/index.php/Denial_of_Service) attack against your application.

Because of the ubiquity of CollectionFS ([57,000 app installs on Atmosphere](https://atmospherejs.com/cfs/standard-packages)), and because this setup is [explicitly described in the documentation](https://github.com/CollectionFS/Meteor-CollectionFS#basic-example), I felt this warranted a Package Scan alert.

Take a look at the [Github issue](https://github.com/CollectionFS/Meteor-CollectionFS/issues/550) and another [related issue](https://github.com/CollectionFS/Meteor-CollectionFS/issues/227) with a helpful work-around.

<hr/>

If you find a vulnerable Meteor package in the wild, [submit an alert](https://github.com/East5th/package-scan#contributing) to help the community!

Also be sure to add `east5th:package-scan` to your Meteor project, or use the [drag & drop web tool](http://scan.east5th.co/) to stay up to date on the latest Meteor security alerts.

`meteor add east5th:package-scan`{:.language-bash}
