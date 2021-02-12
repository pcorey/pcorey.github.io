---
layout: work
title: "The Short Case for Elixir"
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

- Failures are isolated in Elixir applications. An uncaught exception in Node could and often would crash the entire application.

- Elixir lets code execute in parallel. Node applications execute code on a first-come-first-serve basis.

- Elixir's process isolation makes it easy to find slow, or leaky code. It’s been my experience that it’s next to impossible to track down memory leaks, and CPU hogs in a Node app.

- Erlang/Elixir applications come with a built-in graphical debugger. Debugging Node applications in production is very hard and potentially risky.

- Erlang’s Observer gives you a ton of information about every process in your system. Node doesn’t expose nearly as much information about the running application and runtime.

- Logging is built into Erlang and Elixir’s core. Serious logging is an afterthought in Node applications.

- Elixir is 10 years old, and Erlang is 35 years old.

- Elixir is fast. Simple Phoenix requests are measured in nanoseconds, not milliseconds like Node.

- Elixir is scalable.
	- [“The Road to 2 Million WebSocket Connections in Phoenix”](https://www.phoenixframework.org/blog/the-road-to-2-million-websocket-connections)
	- [“How Discord Scaled Elixir to 5,000,000 Concurrent Users”](https://blog.discord.com/scaling-elixir-f9b8e1e7c29b)
	- [“Why WhatsApp Only Needs 50 Engineers for Its 900M Users”](https://www.wired.com/2015/09/whatsapp-serves-900-million-users-50-engineers/)

- There is a community focus on building distributed systems.

- The Elixir documentation is extensive and extremely high quality.

- Elixir’s Phoenix/LiveView framework lets you quickly build real-time web applications. Building a Phoenix application is much faster than building a similar React application.

- Telemetry is a metrics library built into the Elixir core.

### Elixir does have a few downsides. Here they are.

- Elixir and Erlang are smaller communities and ecosystems than Node.

- It's a new language and ecosystem to learn.

- It’s different than our other stacks. There’s value in consistency.

- The backend language would (potentially) be different than the frontend language.
