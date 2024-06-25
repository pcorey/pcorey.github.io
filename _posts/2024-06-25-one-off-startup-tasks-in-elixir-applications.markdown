---
layout: post
title:  "One-off Startup Tasks in Elixir Applications"
excerpt: "Using tasks to perform one-off tasks on startup in an Elixir application."
author: "Pete Corey"
date:   2024-06-25
tags: ["Elixir"]
related: []
---

In a recent Elixir project, I wanted to take a value from my application's runtime config and insert it into the database. Because this value is provided via environment variables, it can only change at the time of application startup. This means it's reasonable to set this value in the database once immediately after the application starts up.

I found the best way to accomplish this is to use a [`Task`](https://hexdocs.pm/elixir/Task.html) started under a supervision tree to perform the insert:

```elixir
def init([]) do
  children = [
    ...,
    {Task, &MyApp.insert_runtime_config/0}
  ]

  Supervisor.init(children, strategy: :one_for_one)
end
```

Because the `Task` specifies a `:temporary` restart behavior in its [`child_spec`](https://github.com/elixir-lang/elixir/blob/6bfb95ab884f11475de6da3f99c6528938e025a8/lib/elixir/lib/task.ex#L321-L327), the supervisor runs the task to completion and never tries to restart it. ["Any termination (even abnormal) is considered successful"](https://hexdocs.pm/elixir/1.12/Supervisor.html#module-restart-values-restart).
