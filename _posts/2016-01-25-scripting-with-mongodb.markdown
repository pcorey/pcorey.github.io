---
layout: post
title:  "Scripting With MongoDB"
titleParts: ["Scripting With", "MongoDB"]
date:   2016-01-25
tags: []
---

An often overlooked, but extremely powerful feature of [MongoDB](https://www.mongodb.com/) is the ability to execute Javascript directly within your database instance.

Recently, I was tasked with gathering some quick statistics on an ongoing [A/B test](https://en.wikipedia.org/wiki/A/B_testing). The system was splitting new users into two separate groups and presenting each group with slightly different experiences. The goal was to find the number of users per group, and find out the average number of "interactions" per user, per group.

I fired up [Robomongo](http://robomongo.org/) and went to work. The first thing I needed to do was define the two (or more) groups that I wanted to gather statistics on. To keep things simple for this example, let's assume that users in Group A have a `group`{:.language-javascript} field on their user document with a value of `"A"`{:.language-javascript}, and users in Group B have `"B"`{:.language-javascript}:

~~~ javascript
var groups = [
  {
    query: {
      group: "A", 
      createdAt: {$gte: ISODate("2016-01-01 05:00:00.000Z")}
    }
  },
  {
    query: {
      group: "B",
      createdAt: {$gte: ISODate("2016-01-01 05:00:00.000Z")}
    }
  }
];
~~~

Next, I wanted to loop through each of these groups, and find out how many users existed in each. This was fairly straight forward with some vanilla Javascript:

~~~ javascript
groups.forEach(function(group, index) {
  group.cursor = db.users.find(group.query);
  group.count = group.cursor.count();
  ...
~~~

In addition to calculating how many users were in each group, I also wanted to calculate the total number of interactions per group. In this simplified system, interactions are represented as a many-to-one mapping between the `users`{:.language-javascript} collection and the `interactions`{:.language-javascript} collection.

The first step to counting the number of interactions per group was to build a list of `userIds`{:.language-javascript} per group. This is an easy task thanks to Mongo's suite of [database cursor methods](https://docs.mongodb.org/v3.0/reference/method/cursor.hasNext/):

~~~ javascript
  ...
  group.userIds = [];
  while (group.cursor.hasNext()) {
    group.userIds.push(group.cursor.next()._id);
  }
  ...
~~~

Now we can construct a query to find and count the total number of interactions per group:

~~~ javascript
  ...
  group.interactions = db.interactions.find({
    userId: {$in: group.userIds}
  }).count();
  ...
~~~

We now have all of the information we need. The last step is to calculate the number of interactions per user and [print the results](https://docs.mongodb.org/manual/tutorial/getting-started-with-the-mongo-shell/#print).

~~~ javascript
  ...
  print([
    "Group " + index + ":",
    "Total users: " + group.count,
    "Total interactions: " + group.interactions,
    "Interactions/user: " + group.interactions/group.count
  ].join("\n"));
});
~~~

The results of this script should give us something like this:

~~~ markdown
Group 0:
Total users: 1337
Total interactions: 84329
Interactions/user: 63.07329842931937

Group 1:
Total users: 1335
Total interactions: 79843
Interactions/user: 59.80749063670412
~~~

Not a bad result for a few minutes of coding. You can find the [whole script here](https://gist.github.com/pcorey/0843081b858dd43b6d81). Feel free to download it and modify it to fit your needs.

For more information on writing MongoDB scripts, take a look at [this article](https://docs.mongodb.org/manual/tutorial/write-scripts-for-the-mongo-shell/).

