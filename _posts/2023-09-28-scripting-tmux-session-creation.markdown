---
layout: post
title:  "Scripting Tmux Session Creation"
excerpt: ""
author: "Pete Corey"
date:   2023-09-28
tags: ["Tmux", "Automation"]
related: []
---

I'll go down kicking and screaming before I restart my terminal (and my computer), mostly because I don't want to set up my tmux sessions again.

So... After being forced to restart this morning, I just decided to script the whole thing:

```
#!/bin/sh

create_session() {
  tmux new-session -d -s $1
  tmux send-keys -t $1:0 "cd ~/$1 && clear && nvim" C-m
  tmux new-window -t $1:1
  tmux send-keys -t $1:1 "cd ~/$1 && clear" C-m
}

create_session "pcorey/project1"
create_session "pcorey/project2"

tmux attach-session -t "pcorey/project1"
```
