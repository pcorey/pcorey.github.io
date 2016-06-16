---
layout: post
title:  "Anatomy of an Assessment"
titleParts: ["Anatomy of an", "Assessment"]
date:   2016-05-30
tags: ["security"]
---

I’ve been quitely offering Meteor security assessments as a service for nearly a year now. In that time, I’ve worked with some amazing teams to analyze and assess the state of security in their Meteor applications.

An assessment is an in-depth, hands-on dive into your Meteor application. The goal of each assessment is to tease out any weak points that may leave your application susceptible to malicious users and outside attackers.

# Why Security?

Security is fundamental to everything we do as software creators. It is an underlying assumption that makes everything we do possible. We spend countless hours building an effective team, developing amazing software and nurturing trust with our users, but all of that falls to the floor without security.

Imagine your company is doing well. Your application is a pleasure to use, and your user base is rapidly growing. You’ve attracted investors and you’ve built yourself an amazing team.

But suddenly, everything changes. A malicious user has managed to find and exploit a severe vulnerability within your application. Their attack has negatively impacted hundreds users.

The hard earned trust between those affected users and your company vanishes instantly. Other users, when they learn of the attack, quickly begin to lose trust as well. Now, one of the first results when people google your product is a scathing TechCrunch article outlining the gory details of the attack. Soon, investors lose interest. With their lack of support and a rapidly dwindling user base, you realize that you won’t be able to make payroll this month.

The question of “why security?” is answered simply: ___Because everything we do depends on it___.

# How Do Assessments Work?

Before an assessment begins, I like to have a high-level discussion about your business, your application, and your users. This conversation lends insight into what you need and expect from an assessment. I also like to end this discussion with a quick architectural overview and a walkthrough of your application. This sets me up to get moving quickly once the assessment begins.

During the assessment, I sweep from the back-end of your application toward the front. Each assessment starts with a thorough review of any collection schemas being used, keeping a careful eye out for any type or structural inconsistencies or weaknesses that might lead to issues.

The bulk of each assessment is spent reviewing data paths between the client and the server. Meteor methods, publications, collection validators, and server-side routes are the primary targets of inspection. Each of these areas are reviewed with the following in mind:

- Trusted fields are always being used, where applicable (e.g., `this.userId`{:.language-javascript}).
- All user actions are correctly authenticated and properly authorized.
- All user provided data is thoroughly validated and sanitized.
- User provided data is only trusted when appropriate.
- Data is not being inadvertently or unexpectedly leaked to the client.
- The risk of "Denial of Service" attacks are mitigated through proper error handling, rate limiting, and unblocking, when appropriate.

Next, attention shifts to the front-end of the application. I review the application's [Content Security Policy](http://www.html5rocks.com/en/tutorials/security/content-security-policy/), investigate potential avenues for front-end attacks, and look for leaking secrets and configuration values.

Lastly, I run the project's Meteor and Node.js dependencies through several automated scanners ([Package Scan](http://scan.east5th.co/), [NSP](https://nodesecurity.io/), and [Snyk](https://snyk.io/)) looking for known vulnerabilities. As the results of these scans are sometimes only applicable in specific circumstances, I review the results and determine if they pose a threat to your application.

# What Can I Expect From an Assessment?

While the most apparent goal of an assessment is to find vulnerabilities within your Meteor application, my real motivation is to help you build confidence around the security process.

It’s my hope that you leave the assessment with a more thorough understanding of Meteor security and how it applies to your application. In all of my communications, I try to include as much, if not more, “why” than “what”, in an attempt to equip you with the knowledge required to keep your application secure once I leave.

The final deliverables of an assessment include an in-depth report discussing the scope of the assessment, the methodologies used, an overview of each finding, and my final thoughts and suggestions in regards to your immediate course of action. The overview of each finding includes the finding’s severity, a brief description outlining why the issue exists and examples of how it can be exploited, a summary of the finding’s impact, and steps for remediation.

I like to present this final report in either a screen-sharing session, or an in-person meeting so that we can discuss the results in-detail. It’s my goal that you leave this final meeting with a complete understanding of everything in the report, along with a clear path forward.

Take a look at an [___example assessment report___](https://docs.google.com/document/d/1g2JmVBay1t9boHDEmdvwQh_nbWlGteK0Uc7hXoX4DlQ/edit?usp=sharing) to get a clearer picture of what to expect.

# Interested in an Assessment?

If you value the security of your Meteor application, I’d love to hear from you. Enter your email address below and I’ll send you a short questionnaire about your application. From there, I’ll reach out and start a discussion.

<div class="signup-form" style="margin: 3em 0">
  <form action="http://formspree.io/hello@east5th.co" method="POST">
    <div class="email-wrapper">
      <input type="text" placeholder="First Name" value="" name="FNAME" class="" id="mce-FNAME" tabindex="1"><!--
      --><input type="email" name="_replyto" placeholder="Email Address"><!--
      --><input type="submit" value="Begin"><!--
      --><input type="hidden" name="type" value="assess"> 
      <input type="hidden" name="_next" value="/begin/"> 
    </div>
  </form>
</div>

I’m looking forward to hearing from you!
