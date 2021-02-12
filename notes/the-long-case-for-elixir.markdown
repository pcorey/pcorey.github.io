---
layout: work
title: "The Case for Elixir"
hideHeader: true
hideFooter: true
hideNewsletter: true
---

<style>
ul {
    margin: 0;
}

blockquote p {
    margin: 0;
}
</style>

### Elixir is a fantastic choice for building a fast, scalable, and resilient core that is a joy to develop and maintain. Here’s why.

I want to acknowledge upfront that we can obviously build the core using Node (we’ve already done it!). We can even make some big improvements over the previous version by swapping out various libraries and making a few architectural tweaks. At the end of the day, it will do what it needs to do.

That said, to build a Node application that achieves the same level of resiliency, robustness, and observability as an Elixir application is a gargantuan effort, and most Node applications just never get there. The end result is an application that _probably_ works _most_ of the time. But when it doesn’t work it’s incredibly difficult to figure out why, and sometimes incredibly difficult and costly to fix.

This has grown to be a long document... __Things in bold are the important points.__ Everything else is elaboration on those points.

#### Resiliency
- __An uncaught exception could and often would crash the entire application.__ It’s often unclear if exceptions are being caught at any point on the code, and even if we’re catching, it’s even more unclear to know what to do with those exceptions when they happen.
- __Elixir processes and supervisors make this impossible.__ When an uncaught exception occurs within a process, that process dies. When a process dies, it’s restarted in a known good state by its parent supervisor.

#### Blocking
- __In Node, a synchronous computation will block the entire event loop until the computation finishes.__ This means that the server _stops everything_, such as handling inbound requests, until it finishes with that computation. We ran into this when processing large batches of events, JSON serializing large GraphQL responses, etc...
- __In Elixir, those types of blockages are impossible.__ Erlang/Elixir’s concurrency model uses “pre-emptive” scheduling, instead of Node’s “cooperative” scheduling. Processes are only given a few cycles of CPU time before moving onto the next process, so these kinds of blocks can never happen. A long running, CPU-bound computation won’t block other processes from doing their work.

#### Profiling
- It’s been __my experience that it’s next to impossible to track down memory leaks, and CPU hogs in a Node app.__ We’ve ran into many of these situations when developing IQD, and we ultimately only found them thanks to intuition and lots of trial and error. Problems in production are even harder to track down. The only way I’ve found is to dump the production database locally and pray you can recreate it.
- __Elixir's process isolation makes it easy to find slow, or leaky code.__ Erlang’s Observer lets you sort processes by memory usage, CPU cycles, and unprocessed messages. Rowdy processes stand out like sore thumbs. You can connect to Observer to a production Elixir instance and track down issues where they’re happening.

#### Debugging
- __Debugging Node applications in production is very hard and potentially risky.__
- Along with Observer, __Erlang/Elixir applications come with a built-in graphical debugger.__ It can easily be connected to production instances of your application, if you choose to debug in production.

#### Observability
- __Node doesn’t expose much information about the running application and runtime.__ It’s hard to know the overall health of the system. The <code class="language-javascript">process</code> library gives some nice metrics, but it's difficult to access on a production server.
- __Erlang’s Observer gives you a ton of info about every process in your system__, along with general system information like memory and CPU consumption. Elixir’s Telemetry library gives you even more metrics about your application.

#### Logging
- __Serious logging is an afterthought in Node applications__, and depends on third party libraries. Our logging system was notoriously fragile and was constantly being reworked to get it to play nicely with Logstash.
- __Logging is built into Erlang and Elixir’s core__, and supports many backends out of the box. Backend support for external logging systems are easy to build, or available as packages.

#### Elixir is mature.
- Erlang is 35 years old.
- Elixir is 10 years old.

#### Elixir is fast.
- Simple Phoenix requests are measured in nanoseconds, not milliseconds. Node defaults to measuring everything in milliseconds, and you have to go out of your way to even be able to measure nanoseconds.

#### Elixir is scalable.
- [“The Road to 2 Million Websocket Connections in Phoenix”](https://www.phoenixframework.org/blog/the-road-to-2-million-websocket-connections)
- [“How Discord Scaled Elixir to 5,000,000 Concurrent Users”](https://blog.discord.com/scaling-elixir-f9b8e1e7c29b)
- [“Why WhatsApp Only Needs 50 Engineers for Its 900M Users”](https://www.wired.com/2015/09/whatsapp-serves-900-million-users-50-engineers/)
    
#### There is a community focus on building distributed systems.
- Like it or not, any web server that scales past a single box is a distributed system. Along with that extra box comes a world of problems you need to watch out for.

#### The documentation is fantastic.
- The official documentation and guides are amazingly well written and thorough.
- There's a culture of good documentation, so the third party package docs are usually very good as well.
- Things like module docs, function docs, doctests (unit tests embedded in documentation) are all things, and ExDoc is used to generate HTML doc pages from a project.
> "Elixir treats documentation as a first class citizen."

#### Phoenix and LiveView.
- Phoenix ships with a fantastic set of tools for building both server-side rendered HTML applications, but also JSON APIs.
- LiveView adds to Phoenix's templating engine and lets you easily add real-time functionality to your web apps.
- The LiveView dashboard is a pretty handy and extensible resource for monitoring your application.

#### Telemetry.
- Telemetry is a metrics library built into the Elixir core.
- It integrates automatically with the LiveView dashboard, and can be integrated with other external dataviz tools such as a Grafana/Prometheus stack or Splunk.
- Lots of libraries are integrating with Telemtry to offer out-of-the-box metrics.

### Elixir does have a few downsides. Here they are.

#### Smaller community and ecosystem.
- Node is everywhere, doing everything. Elixir is less so. I haven't (yet) run into a situation where I'm missing a package or library that I desperately need in Elixir, but it's much more likely to happen with Elixir than it is with Node.
- The MongoDB drivers are a good example. They exist, but they aren't nearly as feature rich or battle tested as the Node MongoDB drivers.

#### It's a new language and ecosystem.
- Learning a new language is always a struggle, especially when it comes with new concepts like functional programming and Elixir's process model.

#### It’s different than Apogee’s and JACE’s stack.
- There's value in consistency.

#### The backend language would (potentially) be different than the frontend language.
- Context switching when bouncing between the server and client might get confusing.
