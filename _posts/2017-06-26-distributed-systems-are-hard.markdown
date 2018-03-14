---
layout: post
title:  "Distributed Systems Are Hard"
description: "Distributed systems are incredibly difficult to build and even more difficult to build correctly. Let's explore some common pitfalls of common scaling practices."
author: "Pete Corey"
date:   2017-06-26
tags: ["Elixir", "Javascript", "Node.js", "Computer Science"]
---

As I dive deeper and deeper into the world of [Elixir](https://elixir-lang.org/) and distributed systems in general, I’ve been falling deeper and deeper into a personal crisis.

I’ve been slowly coming to the realization that just about every production system I’ve worked on or built throughout my career is broken in one way or another.

Distributed systems are hard.

## Horizontal Scaling is Easy, Right?

In the past, my solution to the problem of scale has always been to scale horizontally. By “scale horizontally”, I mean spinning up multiple instances of your server processes, either across multiple CPUs, or multiple machines, and distributing traffic between them.

As long as my server application doesn’t persist in-memory state across sessions, or persist anything to disk, it’s fair game for horizontal scaling. For the most part, this kind of shoot-from-the-hip horizontal scaling works fairly well…

Until it doesn’t.

Without careful consideration and deliberate design, “split it and forget it” scaling will eventually fail. It may not fail catastrophically - in fact, it will most likely fail in subtle, nuanced ways. But it will always fail.

> This is the way the world ends <br/> Not with a bang but a whimper.

Let’s take a look at how this type of scaling can break down and introduce [heisenbugs](https://en.wikipedia.org/wiki/Heisenbug) into your system.

## Scaling in Action

For the sake of discussion, imagine that we’re building a web application that groups users into teams. A rule, or invariant, of our system is that a user can only be assigned to a single team at a time.

Our system enforces this rule by checking if a user already belongs to a team before adding them to another:

<pre class='language-javascript'><code class='language-javascript'>
function addUserToTeam(userId, teamId) {
    if (Teams.findOne({ userIds: userId })) {
        throw new Error("Already on a team!");
    }
    Teams.update({ _id: teamId }, { $push: { userIds: userId } });
}
</code></pre>

This seems relatively straight-forward, and has worked beautifully in our small closed-beta trials.

Great! Over time, our Team Joiner™ application becomes very popular. 

<img style="width: 100%" src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/team-joiner.png">

To meet the ever growing demand of new users wanting to join teams, we begin horizontally scaling our application by spinning up more instances of our server. However, as we add more servers, mysterious bugs begin to crop up…

Users are somehow, under unknown circumstances, joining multiple teams. That was supposed to be a premium feature!

## With Our Powers Combined

The root of the problem stems from the fact that we have two (or more) instances of our server process running in parallel, without accounting for the existence of the other processes.

Imagine a scenario where a user, Sue, attempts to join Team A. Simultaneously, an admin user, John, notices that Sue isn’t on a team and decides to help by assigning her to Team B.

Sue’s request is handled entirely by Server A, and John’s request is handled entirely by Server B.

<img style="float:right; width: 200px; margin: 0 2em;" src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/team-conflict.png" alt="Diagram of conflict between Server A and Server B.">

Server A begins by checking if Sue is on a team. She is not. Just after that, Server B also checks if Sue is on a team. She is not. At this point, both servers think they’re in the clear to add Sue to their respective team. Server A assigns Sue to Team A, fulfilling her request. Meanwhile, Server B assigns Sue to Team B, fulfilling John’s request.

Interestingly, both servers do their jobs flawlessly individually, while their powers combined put the system in an invalid, unpredictable, and potentially unrecoverable state.

---- 

The issue here is that between the point in time when Server B verifies that Sue is not on a team and the point when it assigns her to Team B, the state of the system changes.

Server B carries out its database update operating under the assumptions of old,  stale data. The server process isn’t properly designed to handle, or even recognize these types of conflicting updates.

Interestingly (and horrifyingly), this isn’t the only type of bug that can result from this type of haphazard scaling.

Check out the beginning of [Nathan Herald’s talk from this year’s ElixirConf EU](https://www.youtube.com/watch?v=SDKiLO2XwIs) to hear about all of the fantastic ways that distributed systems can fail.

<!-- <div style="position: relative; padding-bottom: 56.25%; padding-top: 25px; height: 0; margin-top: 2em;"> -->
<!--     <iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" src="https://www.youtube.com/embed/SDKiLO2XwIs" frameborder="0" allowfullscreen></iframe> -->
<!-- </div> -->

{% include newsletter.html %}

## Handling Conflicts

While this specific problem is somewhat contrived and could be easily fixed by a database schema that more accurately reflects the problem we’re trying to solve (by keeping `teamId`{:.language-javascript} on the user document), it serves as a good platform to discuss the larger issue.

Distributed systems are hard.

When building distributed systems, you need to be prepared to be working with data that may be inconsistent or outdated. Conflicts should be an expected outcome that are designed into the system and strategically planned for.

This is part of the reason I’ve [gravitated towards an Event Sourcing approach](http://www.east5th.co/blog/2017/06/19/genservers-and-memory-images-a-match-made-in-heaven/#backed-by-an-event-log) for my latest project, [Inject Detect](http://www.injectdetect.com/).

Events can be ordered sequentially in your database, and you can make assertions (with the help of database indexing) that the event you’re inserting immediately follows the last event you’ve seen.

We’ll dive into the details surrounding this type of solution in future posts.

## Final Thoughts

Wrapping up, I feel like this article ranks high in fear-mongering and low in actionable value. That definitely isn’t my intention.

My goal is to show that working with distributed systems is unexpectedly hard. The moment you add a second CPU or spin up a new server instance, you’re entering a brave new (but really, not so new) world of computing that requires you to more deeply consider every line of code you write.

I encourage you to re-examine projects and code you’ve written that exist in a distributed environment. Have you ever experienced strange bugs that you can’t explain? Are there any race conditions lurking there that you’ve never considered?

Is your current application ready to be scaled horizontally? Are you sure?

In the future, I hope to write more actionable articles about solving these kinds of problems. Stay tuned for future posts on how Event Sourcing can be used to write robust, conflict-free distributed systems!
