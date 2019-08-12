---
layout: post
title:  "NoSQL Injection in Modern Web Applications"
titleParts: ["NoSQL Injection", "in Modern Web Applications"]
excerpt: "Check out my presentation at the 2016 Crater Remote Conference for an in-depth overview of NoSQL Injection in Modern Web Applications!"
author: "Pete Corey"
date:   2016-03-21
tags: ["Javascript", "Meteor", "Security", "NoSQL Injection", "MongoDB"]
---

Last month I was lucky enough to be able to attend and speak at the first ever [Crater Remote Conference](http://conf.crater.io/)!

I gave a talk entitled “NoSQL Injection in Modern Web Applications”. The talk was heavily focused on exploiting [NoSQL injection](https://www.owasp.org/index.php/Testing_for_NoSQL_injection) vulnerabilities in applications using [MongoDB](https://www.mongodb.com/). The bulk of the talk was spent in a hands-on demo showing how a malicious user could approach and attack a [Meteor](https://www.meteor.com/) application vulnerable to these types of attacks.

Check out a recording of the presentation below, and be sure to watch a few of these highlights!

[`02:41`{:.language-*}](https://www.youtube.com/watch?v=tKuFYD-rrCM&feature=youtu.be&t=2m41s) - Why security?<br/>
[`04:57`{:.language-*}](https://www.youtube.com/watch?v=tKuFYD-rrCM&feature=youtu.be&t=4m57s) - What is “NoSQL Injection”?<br/>
[`12:25`{:.language-*}](https://www.youtube.com/watch?v=tKuFYD-rrCM&feature=youtu.be&t=12m25s) - Grabbing all products by exploiting a publication.<br/>
[`17:36`{:.language-*}](https://www.youtube.com/watch?v=tKuFYD-rrCM&feature=youtu.be&t=17m36s) - Getting all carts by exploiting a publication.<br/>
[`20:20`{:.language-*}](https://www.youtube.com/watch?v=tKuFYD-rrCM&feature=youtu.be&t=20m20s) - Getting all carts through a `.findOne`{:.language-javascript} query.<br/>
[`23:42`{:.language-*}](https://www.youtube.com/watch?v=tKuFYD-rrCM&feature=youtu.be&t=23m42s) - Removing all user carts in the system.<br/>
[`25:26`{:.language-*}](https://youtu.be/tKuFYD-rrCM?t=25m26s) - Modifying product prices.<br/>
[`29:40`{:.language-*}](https://www.youtube.com/watch?v=tKuFYD-rrCM&feature=youtu.be&t=29m40s) - Escalating myself to admin level permissions.<br/>
[`34:55`{:.language-*}](https://www.youtube.com/watch?v=tKuFYD-rrCM&feature=youtu.be&t=34m55s) - MongoDB denial of service through a `.find`{:.language-javascript} query.<br/>
[`38:55`{:.language-*}](https://www.youtube.com/watch?v=tKuFYD-rrCM&feature=youtu.be&t=38m55s) - How do we fix it?<br/>
[`42:30`{:.language-*}](https://www.youtube.com/watch?v=tKuFYD-rrCM&feature=youtu.be&t=42m30s) - Why pick on MongoDB?<br/>
[`44:10`{:.language-*}](https://www.youtube.com/watch?v=tKuFYD-rrCM&feature=youtu.be&t=44m10s) - Are other NoSQL databases safe?<br/>
[`47:40`{:.language-*}](https://www.youtube.com/watch?v=tKuFYD-rrCM&feature=youtu.be&t=47m40s) - Q&A with [Josh Owens](http://joshowens.me/).<br/>

<div style="position: relative; padding-bottom: 56.25%; padding-top: 25px; height: 0;">
    <iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" src="//www.youtube.com/embed/tKuFYD-rrCM" frameborder="0" allowfullscreen></iframe>
</div>

At the end of the talk, I linked to [Rob Conery’s](http://rob.conery.io/) [Meteor Shop](https://github.com/robconery/meteor-shop). You may also be interested in his fantastic [PluralSight course](https://www.pluralsight.com/courses/meteorjs-web-application) on building the application from the ground up.

I also linked to my own package, [Check Checker](https://github.com/East5th/check-checker) (`east5th:check-checker`{:.language-javascript}), which helps you find methods and publications within your Meteor application that aren’t being thoroughly checked. 

I had a blast watching the Crater Conf talks this year, and I’m looking forward to the next conference!
