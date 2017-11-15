---
layout: post
title:  "User Authentication Kata with Elixir and Phoenix"
description: "Practical code katas are a tool to practice valuable web development skills in an applicable way. Start practicing with this user authentication kata."
author: "Pete Corey"
date:   2017-10-02
tags: ["Elixir", "Katas", "Phoenix", "Authentication"]
---

It’s no secret that’s I’m a fan of code katas. Over the years I've spent quite a bit of time on [CodeWars](https://www.codewars.com/users/pcorey) and other kata platforms, and I’ve written a large handful of [Literate Commit](http://www.east5th.co/blog/2016/07/11/literate-commits/) style articles outlining kata solutions:

[Delete Occurrences of an Element](http://www.east5th.co/blog/2016/07/11/delete-occurrences-of-an-element/)

[Point in Polygon](http://www.east5th.co/blog/2016/07/20/point-in-polygon/)

[Molecule to Atoms](http://www.east5th.co/blog/2016/07/27/molecule-to-atoms/)

[Nesting Structure Comparison](http://www.east5th.co/blog/2016/08/03/nesting-structure-comparison/)

[The Captain’s Distance Request](http://www.east5th.co/blog/2016/08/10/the-captains-distance-request/)

[Not Quite Lisp](http://www.east5th.co/blog/2016/08/17/advent-of-code-not-quite-lisp/)

I’m a huge fan of the idea behind code katas, and I believe they provide valuable exercise for your programming muscles.

## We Should be Training

That being said, the common form of code kata is just that: exercise. Something to get your heart pumping and your muscles moving, but devoid of any real goal.

> _Exercise_ is physical activity for its own sake, a workout done for the effect it produces today, during the workout or right after you’re through.

Does my career benefit from reimplementing search algorithms? Probably not. How much do my clients benefit from my skill at coming up with clever solutions to contrived puzzles? Resoundingly little. What’s the objective value of being able to write a non-recursive fibonacci sequence generator? Zero dollars.

Instead of exercising, [__we should be training__](https://startingstrength.com/article/training_vs_exercise).

Our focused practice time should be structured around and focused towards a particular goal. To make the most of our time, this goal should be practical and valuable.

> _Training_ is physical activity done with a longer-term goal in mind, the constituent workouts of which are specifically designed to produce that goal.

We should be working towards mastery of skills that bring value to ourselves and those around us.

## Practical Code Katas

Lately I’ve been working on what I call “practical code katas”; katas designed to objectively improve my skills as a working, professional web developer.

The first kata I’ve been practicing is fairly simple. Here it is:

> Build a web application that lets new users register using a username and a password, and that lets existing users log in and log out. Protect at least one route in the application from unauthenticated users.

The rules for practicing this kata are simple: you can do whatever you want.

You can use any languages you want. You can use any frameworks you want. You can use any tools you want. Nothing is off limits, as long as you _correctly_, _securely_, and _honestly_ complete the kata as described.

I encourage you to go try the kata!

How long did it take you? Are you satisfied with the result? Are you satisfied with your process? Where did you get stuck? What did you have to look up? __Where can you improve?__

---- 

When I first completed this practical code kata, I was following along with the first several chapters in the excellent [Programming Phoenix book](https://www.amazon.com/gp/product/1680501453/ref=as_li_qf_sp_asin_il_tl?ie=UTF8&tag=east5th-20&camp=1789&creative=9325&linkCode=as2&creativeASIN=1680501453&linkId=78f707b571ae0a71194d29b71b606191) (affiliate link) by Chris McCord, Bruce Tate, and José Valim. Copying nearly every example verbatim (and trying to convert to a Phoenix 1.3 style) as I read and followed along, it took me roughly four hours to first complete the kata.

Later, I tried practicing the kata again. This time, I had a rough lay of the land, and I knew vaguely how to accomplish the task. Two hours and many references back to [Programming Phoenix](https://www.amazon.com/gp/product/1680501453/ref=as_li_qf_sp_asin_il_tl?ie=UTF8&tag=east5th-20&camp=1789&creative=9325&linkCode=as2&creativeASIN=1680501453&linkId=78f707b571ae0a71194d29b71b606191) later, I finished the kata.

And then I did it again. This time it only took me forty five minutes. I found myself stumbling on a few pieces of trivia (“Where does `assign`{:.language-javascript} live? Oh right, `Plug.Conn`{:.language-javascript}…”), but the process went much more smoothly than before.

And I did it again. Now I was down to thirty minutes. I still found myself forgetting small details (remember: `*_path`{:.language-javascript} helpers live in `<YourProjectWeb>.Router.Helpers`{:.language-javascript}).

So I did it again, and again, and again…

## The Benefits of Training

As I continue intentionally practicing with this kata and others like it, I continue to find more and more benefits. Some benefits are obvious, while others are more subtle.

An obvious benefit of this type of routine, intentional practice of a small set of common tasks is that implementing those tasks in a real-world project becomes as natural as breathing. Even better, if I ever need to implement a task _similar to any of my katas_, I’ll immediately know where to start and what to change.

> Repetition breeds familiarity. <br/>Familiarity breeds confidence. <br/>Confidence breeds success.

Practicing this type of kata has not only improved my ability to know what code I need to write, but also my ability to write it.

As I repeatedly find myself writing and rewriting identical sections of code time after time, I start looking for shortcuts. I start to notice places where I can use [new Vim tricks I’ve been trying to learn](https://www.youtube.com/watch?v=ke7SfUFvvxo&feature=youtu.be&t=2m19s). I build up my snippet library with generic, repeated blocks of code. I get more comfortable with the nuts and bolts of what I do for a living: writing code.

## Final Thoughts

If it wasn’t obvious before, it’s probably obvious now. I love code katas.

That being said, I think we haven’t been using code katas up to their full potential. Intentional, repeated practice of a set of practical, real-world problems can help us greatly improve our skills as professional web developers.

Stop exercising, and start training!
