---
layout: post
title:  "Non-deterministic Test Failures"
excerpt: "Trying to track down non-deterministic test failures in my somewhat flakey test suite, I've been relying on this bash one-liner."
author: "Pete Corey"
date:   2024-04-10
tags: ["Testing", "Elixir", "Bash"]
related: []
---

Trying to track down non-deterministic test failures in my somewhat flakey test suite, I've been relying on this bash one-liner:

```bash
while mix test; do :; done
```

The idea is to run `mix test` repeatedly until it fails. At that point, the loop terminates and you've found yourself a non-deterministic failure.
