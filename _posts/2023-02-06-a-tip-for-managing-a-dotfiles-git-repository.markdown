---
layout: post
title:  "A Tip for Managing a Dotfiles Git Repository"
excerpt: "Ignore everything and exlpicitly unignore the files you want to track. That's it. That's the tip."
author: "Pete Corey"
date:   2023-02-06
tags: ["Git", "Dotfiles"]
related: []
---

In the past, I've managed my dotfile repositories by `git add`ing the configuration files I've wanted to track, and leaving everything else in my home directory unstaged. This strategy has proven to be a mess. Every `git status` in my home directory would list hundreds of perpetually unstaged files, and git-integrated CLI prompts never worked correctly in my home directory.

In an attempt to do things better, I've opted for a new technique.  I'm ignoring every file in the repository (`*`), and explicitly unignoring the files I care about (`!.tmux.conf`). My `.gitignore` looks like this:

```
*
!.config/nvim/init.vim
!.tmux.conf
!.wezterm.lua
```

Now we can `git add` our dotfiles as usual:

```
git add .tmux.conf
```

When `git add`ing files in nested directories, they may be affected by other `.gitignore` rules, so we'll have to `git add --force` them when adding them to our dotfiles repository.

```
git add --force .config/nvim/init.vim
```

That's it. That's the tip.
