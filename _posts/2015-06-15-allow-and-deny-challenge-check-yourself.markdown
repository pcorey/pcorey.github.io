---
layout: post
title:  "Allow & Deny Challenge - Check Yourself"
titleParts: ["Allow & Deny Challenge", "Check Yourself", "Before You Wreck Yourself"]
date:   2015-06-15
categories:
---

If you read [Crater](https://crater.io/), or follow the [Discover Meteor blog](https://www.discovermeteor.com/blog), you probably saw [Sacha Greif’s](https://twitter.com/SachaGreif) recent [Allow & Deny Security Challenge](https://www.discovermeteor.com/blog/allow-deny-security-challenge/). If you haven’t taken the challenge yet, go do it now! It’s a great way to flex your Meteor security muscles. Plus, it really opens your eyes about how careful you need to be when writing [allow](http://docs.meteor.com/#/full/allow) & [deny](http://docs.meteor.com/#/full/deny) rules for your Meteor collections.

I decided to have some fun with the challenge and based my implementation on Meteor’s [check package](http://docs.meteor.com/#/full/check). Before we dive into my solution, here's my [MeteorPad submission](http://meteorpad.com/pad/eFGxbRicpNuJjBb8T/Copy%20of%20Chatroom%20Security%20Challenge), and here’s the <code class="language-javascript">allow</code> function in its entirety:

<pre class="language-javascript"><code class="language-javascript">Messages.allow({
    update: function (userId, doc, fields, modifier) {
        var checkEdit = {
            $set: {
                body: String
            }
        };

        var checkLike = {
            $addToSet: {
                likes: Match.Where(function(likes) {
                    check(likes, String);
                    return likes == userId &&
                           !_.contains(doc.likes, userId);
                })
            },
            $inc: {
                likesCount: Match.Where(function(likesCount) {
                    check(likesCount, Number);
                    return likesCount == 1;
                })
            },
        };

        if (userId == doc.userId) { // Like or edit
            return Match.test(modifier, Match.OneOf(checkEdit, checkLike));
        }
        else { // Like
            return Match.test(modifier, checkLike);
        }
    }
});
</code></pre>

The high level plan of attack for this <code class="language-javascript">allow</code> method is to permit a user to either edit the body of their own post, or like a post. A user may only like a post once, and a user may not like and edit their post in a single update. To implement these restrictions using <code class="language-javascript">check</code>, we need to think about what the modifiers for these two actions will look like.

## The Edit Message Pattern

The modifier for updating your message is very simple. We’re expecting a <code class="language-*">$set</code> on the <code class="language-javascript">body</code> field. Additionally, we’re expecting <code class="language-javascript">body</code> to be a <code class="language-javascript">String</code>. Written as a pattern, it would look like this:

<pre class="language-javascript"><code class="language-javascript">var checkEdit = {
    $set: {
        body: String
    }
};
</code></pre>

## The Like Message Pattern

The modifier for liking a message is slightly more complicated. We expect the current user’s <code class="language-javascript">userId</code> to be added to the <code class="language-javascript">likes</code> field using the <code class="language-javascript">$addToSet</code> operator, and we expect the <code class="language-javascript">likesCount</code> field to be incremented by one. We can use <code class="language-javascript">Match.Where</code> to assert that the <code class="language-javascript">userId</code> we’re adding to the <code class="language-javascript">likes</code> field is a <code class="language-javascript">String</code>, is equal to the current user’s <code class="language-javascript">userId</code>, and doesn’t already exist in the array:

<pre class="language-javascript"><code class="language-javascript">$addToSet: {
    likes: Match.Where(function(likes) {
        check(likes, String);
        return likes == userId &&
               !_.contains(doc.likes, userId);
    })
}
</code></pre>

We can also use <code class="language-javascript">Match.Where</code> to make sure we’re only adding <code class="language-javascript">1</code> to <code class="language-javascript">likesCount</code>:

<pre class="language-javascript"><code class="language-javascript">$inc: {
    likesCount: Match.Where(function(likesCount) {
        check(likesCount, Number);
        return likesCount == 1;
    })
}
</code></pre>

All together, the modifier we expect when liking a message should match this pattern:

<pre class="language-javascript"><code class="language-javascript">var checkLike = {
    $addToSet: {
        likes: Match.Where(function(likes) {
            check(likes, String);
            return likes == userId &&
                   !_.contains(doc.likes, userId);
        })
    },
    $inc: {
        likesCount: Match.Where(function(likesCount) {
            check(likesCount, Number);
            return likesCount == 1;
        })
    },
};
</code></pre>

## Apply The Patterns

The last section of the <code class="language-javascript">allow</code> method applies these patterns to the modifier we’ve been given. In my original submission, I implemented this section as two calls to <code class="language-javascript">check</code> wrapped in a <code class="language-javascript">try</code>/<code class="language-javascript">catch</code> block. If either of the checks failed, the <code class="language-javascript">catch</code> block would prevent the thrown exception from bubbling up and return a <code class="language-javascript">false</code> to prevent the update. Later, I realized that I could use [Match.test](http://docs.meteor.com/#/full/match_test) instead.

If the user making the update owns the document, we use <code class="language-javascript">Match.OneOf</code> to allow them to either edit the message or like the message:

<pre class="language-javascript"><code class="language-javascript">if (userId == doc.userId) {
    return Match.test(modifier, Match.OneOf(checkEdit, checkLike));
}
</code></pre>

Otherwise, we only let them like the message:

<pre class="language-javascript"><code class="language-javascript">else {
    return Match.test(modifier, checkLike);
}
</code></pre>

And that’s it!

## Final Thoughts

Originally, this was intended as a just-for-fun experiment, but the check approach is beginning to grow on me. The idea of using patterns to describe the modifier for each action and then applying the appropriate pattern based on the user’s permissions seems very readable and easy to understand at a glance. I might make use of this pattern in the future.

[Check](http://docs.meteor.com/#/full/check_package) is a suprisingly powerful library capable of preventing a wide variety of Meteor security issues if used correctly. I highly recommend reading through the docs and brushing up on your checking skills!