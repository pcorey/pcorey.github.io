---
layout: post
title:  "Slimming Down Fat Models"
titleParts: ["Slimming Down", "Fat Models"]
date:   2015-10-05
tags: [""]
---

I’ll admit it; I have a weight problem. Lately, my models have been getting fat.

___Really fat.___

To be honest, I didn’t see this coming. I thought I’ve been doing everything right. I’ve been keeping my views and controllers nice and thin, and I’ve been working hard to encapsulate complicated business logic into appropriately named model methods.

This might be a little awkward, but let me show you... Suppose we’ve got a Job Board application. In it, there’s a Jobs collection. We’re using [`dburles:collection-helpers`{:.language-*}](https://github.com/dburles/meteor-collection-helpers) to build a simple Jobs model. Imagine that we want to allow users to close jobs they’ve created when the position is filled. Let’s create a model method that can be called from our controller layer (our [Meteor](https://www.meteor.com/) method):

<pre class="language-javascript"><code class="language-javascript">Jobs.helpers({
  ...
  closeJob: () => {
    Jobs.update(this._id, {
      $set: {
        closed: true
      }
    });
  }
  ...
});
</code></pre>

Ah, but wait. When a job closes we also need to email the job owner and congratulate them on successfully filling the position. Let’s update our model.

<pre class="language-javascript"><code class="language-javascript">closeJob: () => {
  Jobs.update(this._id, {
    $set: {
      closed: true
    }
  });

  Email.send({
    to: this.getOwner().getEmail(),
    body: "Congrats on filling the position!"
  });
}
</code></pre>

After getting some user feedback, we’ve realized that we need to congratulate the person who filled the position. Also, we should notify all of the other applicants who applied, but didn’t get the job. _Also_, we need to do some housekeeping and update the Organization that this job belongs to.

Let’s get back to work on our model.

<pre class="language-javascript"><code class="language-javascript">closeJob: () => {
  Jobs.update(this._id, {
    $set: {
      closed: true
    }
  });

  Email.send({
    to: this.getOwner().getEmail(),
    body: "Congrats on filling the position!"
  });

  Email.send({
    to: this.getFiller().getEmail(),
    body: "Congrats on landing the job!"
  });

  this.getApplicants().forEach(applicant => {
    Email.send({
      to: applicant.getEmail(),
      body: "Sorry, but the job has been closed."
    });
  });

  this.getOrganization().closeJob();
}
</code></pre>

Whew, that looks mostly complete!

Though technically, job owners will close a job for a variety of reasons. Maybe they’ve found someone to fill the position, or maybe they’ve just decided to take the job off of the job board for other reasons. If they use the `closeJob`{:.language-javascript} model method, the system will send the job owner a congratulations email, and all applicants emails about the job being filled. That’s no good.

Maybe the solution is to pass in flags to determine whether we should kick off various emails:

<pre class="language-javascript"><code class="language-javascript">closeJob: (congratulateOwner, congratulateFiller, notifyApplicants) => {
  Jobs.update(this._id, {
    $set: {
      closed: true
    }
  });

  if (congratulateOwner) {
    Email.send({
      to: this.getOwner().getEmail(),
      body: "Congrats on filling the position!"
    });
  }

  if (congratulateFiller) {
    Email.send({
      to: this.getFiller().getEmail(),
      body: "Congrats on landing the job!"
    });
  }

  if (notifyApplicants) {
    this.getApplicants().forEach(applicant => {
      Email.send({
        to: applicant.getEmail(),
        body: "Sorry, but the job has been closed."
      });
    });
  }

  this.getOrganization().closeJob();
}
</code></pre>

The complexity of our model method is getting out of hand! The controller calling this method is forced to know much more about the internals of the method than it should. The bottom line is that our model is getting ___too fat___.

<hr/>

So how do we shed all of this weight that’s built up on our model? We can find inspiration in more complicated system architectures and design philosophies such as [Command Busses](http://laravel.com/docs/5.0/bus), [Event Sourcing](http://martinfowler.com/eaaDev/EventSourcing.html) and even [Domain Driven Design](http://martinfowler.com/tags/domain%20driven%20design.html). All of these design patterns and philosophies make fundamental use of ___server-side events___ to segregate and organize functionality within large applications. By leveraging [events](https://nodejs.org/api/events.html) in our application, we can make huge gains in terms of code cleanliness, understandability, and testability.

Let’s take a step back and think about our domain in reverse. We have a few things we want to do on every job closure. Whenever a job is closed because a suitable applicant was found, we want to send an email congratulating the job owner:

<pre class="language-javascript"><code class="language-javascript">when("JobWasFilled", job => {
  Email.send({
    to: job.getOwner().getEmail(),
    body: "Congrats on filling the position!"
  });
});
</code></pre>

We’ll also want to congratulate the user who filled the job:

<pre class="language-javascript"><code class="language-javascript">when("JobWasFilled", job => {
  Email.send({
    to: job.getFiller().getEmail(),
    body: "Congrats on landing the job!"
  });
});
</code></pre>

Any time a job posting is closed for any reason, we’ll want to notify all of our users who applied for that job:

<pre class="language-javascript"><code class="language-javascript">when("JobWasClosed", job => {
  job.getApplicants().forEach(applicant => {
    Email.send({
      to: applicant.getEmail(),
      body: "Sorry, but the job has been closed."
    });
  });
});
</code></pre>

And we also want to always update the job’s parent organization:

<pre class="language-javascript"><code class="language-javascript">when("JobWasClosed", job => {
  job.getOrganization().closeJob();
});
</code></pre>

All of these pieces of code can live in their own files on the server. We can organize them in such a way that makes immediate sense to anyone looking at the structure of our project:

<pre class="language-bash"><code class="language-bash">server/
  listeners/
    jobWasClosed/
      closeJobOnOrganization.js
      notifyOtherApplicants.js
    jobWasFilled/
      congratulateOwner.js
      congratulateFiller.js
</code></pre>

Now, our `closeJob`{:.language-javascript} model method is incredibly simple, straight forward, and best of all, _only has to worry about the model_:

<pre class="language-javascript"><code class="language-javascript">closeJob: () => {
  Jobs.update(this._id, {
    $set: {
      closed: true
    }
  });

  EventEmitter.emit("JobWasClosed", this);
}
</code></pre>

We’ll also need to emit the `JobWasFilled`{:.language-javascript} event from our method layer:

<pre class="language-javascript"><code class="language-javascript">Meteor.methods({
  fillJob: jobId => {
    ...
    job.closeJob();
    EventEmitter.emit("JobWasFilled", job);
  }
});
</code></pre>

Now, when a job is filled, the `JobWasClosed`{:.language-javascript} event will be fired by the model, and the `JobWasFilled`{:.language-javascript} event will be fired by our method layer. Our listeners will pick up on these events and do their duty. If `closeJob`{:.language-javascript} is called through some other means, our `JobWasClosed`{:.language-javascript} listeners will be triggered, but the `JobWasFilled`{:.language-javascript} listeners will not. Perfect!

___I feel so thin!___

<hr/>

Server-side events are an architectural gem that can be easily incorporated into most applications to provide clean, easy decoupling of components. Events let you cleanly separate functionality, organize it into easy to understand chunks, better reason about the workings of your application, and more effectively write tests.

If you decide to start using events in your applications, I ___highly recommend___ spending a few dollars and watching this excellent [Laracasts](https://laracasts.com/) series on [Commands and Domain Events](https://laracasts.com/series/commands-and-domain-events). It's targeted towards PHP developers using the [Laravel framework](http://laravel.com/), but the ideas are completely applicable to any software project. [Jeffrey Way](https://twitter.com/jeffrey_way) is an excellent teacher and masterfully presents the ideas and benefits behind server-side events.
