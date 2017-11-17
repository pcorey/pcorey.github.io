---
layout: post
title:  "Meteor in Front, Phoenix in Back - Part 2"
description: "Part two of our Meteor in Front, Phoenix in Back series. Today we finish up our Franken-stack by wiring our front-end up to an actual database with Phoenix Channels."
author: "Pete Corey"
date:   2016-08-22
tags: ["Elixir", "Phoenix", "Meteor", "Channels"]
---

In our [last article](/blog/2016/08/15/meteor-in-front-phoenix-in-back-part-1/), we transplanted the front-end of a simple [Meteor](https://www.meteor.com/) [example application](https://github.com/meteor/leaderboard) into a [Phoenix](http://www.phoenixframework.org/) project and wired up a Blaze template to use Phoenix Channels rather than DDP.

Today we’ll be finishing our Franken-stack by replacing the hard-coded data we’re sending down to our clients with data persisted in a database. We’ll also implement the “Add Points” functionality using Channel events.

Let’s get to it!

## Creating A Player Model

Before we start pulling data from a database, we need to lay some groundwork. We’ll be using [Ecto](#) to create a model of our player, and creating some seed data to initially populate our database.

In our Phoenix project directory, we’ll use `mix`{:.language-javascript} to generate a new model for us:

<pre class='language-bash'><code class='language-bash'>
mix phoenix.gen.model Player players name:string score:integer
</code></pre>

The `phoenix.gen.modal`{:.language-bash} [mix task](https://hexdocs.pm/phoenix/Mix.Tasks.Phoenix.Gen.Model.html) will create both a `PhoenixLeaderboard.Player`{:.language-elixir} model, and a migration file for us. The migration file will create our `players`{:.language-elixir} table in [PostgreSQL](https://www.postgresql.org/) (Phoenix’s default database) when we run this command:

<pre class='language-bash'><code class='language-bash'>
mix ecto.create
</code></pre>

The out-of-the-box `PhoenixLeaderboard.Player`{:.language-elixir} (`web/models/player.ex`{:.language-bash}) model is very close to what we want. It defines `name`{:.language-bash} as a `string`{:.language-bash}, `score`{:.language-bash} as an `integer`{:.language-bash} and a set of created/updated at timestamps.

The only change we need to make here is to specify how we want each `Player`{:.language-elixir} to be serialized into JSON. We can do this by deriving the `Poison.Encoder`{:.language-elixir} implementation:

<pre class='language-elixir'><code class='language-elixir'>
defmodule PhoenixLeaderboard.Player do
  use PhoenixLeaderboard.Web, :model
  @derive { Poison.Encoder, only: [:id, :name, :score] }
  ...
</code></pre>

## Seeding Our Database

Now that we have a working `Player`{:.language-elixir} model, let’s insert some seed data into our database.

By default, [seeding a database](http://www.phoenixframework.org/docs/seeding-data) in a Phoenix project is done by writing a script that manually inserts models into your repository. To insert all of our players, we could add the following to `priv/repo/seeds.exs`{:.language-bash}:

<pre class='language-elixir'><code class='language-elixir'>
alias PhoenixLeaderboard.Repo
alias PhoenixLeaderboard.Player

Repo.insert! %Player{ name: "Ada Lovelace", score: 5 }
Repo.insert! %Player{ name: "Grace Hopper", score: 10 }
Repo.insert! %Player{ name: "Marie Curie", score: 15 }
Repo.insert! %Player{ name: "Carl Friedrich Gauss", score: 20 }
Repo.insert! %Player{ name: "Nikola Tesla", score: 25 }
Repo.insert! %Player{ name: "Claude Shannon", score: 30 }
</code></pre>

We can run this seed script with the following mix task:

<pre class='language-bash'><code class='language-bash'>
mix run priv/repo/seeds.exs
</code></pre>

If all went well, all six of our players should be stored in our database!

## Publishing Players

Let’s revisit the `join`{:.language-elixir} function in our `PhoenixLeaderboard.PlayersChannel`{:.language-elixir} (`web/channels/players_channel.ex`{:.language-bash}) module.

[Last time](/blog/2016/08/15/meteor-in-front-phoenix-in-back-part-1/), we simply returned a hard-coded list of cleaners whenever a client joined the `"players"`{:.language-elixir} channel. Instead, let’s return all of the players stored in the database.

To shorten references, we’ll start by aliasing `PhoenixLeaderboard.Repo`{:.language-elixir} and `PhoenixLeaderboard.Player`{:.language-elixir}, just like we did in our seed file:

<pre class='language-elixir'><code class='language-elixir'>
defmodule PhoenixLeaderboard.PlayersChannel do
  use Phoenix.Channel
  alias PhoenixLeaderboard.Repo
  alias PhoenixLeaderboard.Player
  ...
</code></pre>

Now, refactoring our `join`{:.language-elixir} function to return all players is as simple as calling `Repo.all`{:.language-elixir} and passing in our `Player`{:.language-elixir} model:

<pre class='language-elixir'><code class='language-elixir'>
  def join("players", _message, socket) do
    {:ok, Repo.all(Player), socket}
  end
</code></pre>

Looking back at our Leaderboard application, our player list should still be filled with our scientists.

## Adding Points With Events

Now we get to the truly interesting part of this experiment.

In our original Meteor application, we updated each player’s score on the client and depended on DDP to propagate that change up to our server:

<pre class='language-javascript'><code class='language-javascript'>
'click .inc': function () {
  Players.update(Session.get("selectedPlayer"), {$inc: {score: 5}});
}
</code></pre>

Since we’re moving away from DDP, we can no longer rely on Meteor to do this for us. We’ll need to manage this update process ourselves.

Our plan for handling these updates is to push an `"add_points"`{:.language-javascript} [channel event](http://www.phoenixframework.org/docs/channels) up to the server whenever a user clicks on the `.inc`{:.language-javascript} button:

<pre class='language-javascript'><code class='language-javascript'>
Template.instance().channel.push("add_points", {
  id: Session.get("selectedPlayer")
});
</code></pre>

In our `PlayersChannel`{:.language-elixir}, we can handle any incoming `"add_points"`{:.language-elixir} events using the `handle_in`{:.language-elixir} function:

<pre class='language-elixir'><code class='language-elixir'>
def handle_in("add_points", %{"id" => id}, socket) do
  player = Repo.get!(Player, id)
  Player.changeset(player, %{score: player.score + 5})
  |> Repo.update
  |> handle_player_update(socket)
end
</code></pre>

Out logic here is fairly straightforward: get the `Player`{:.language-elixir} with the given `id`{:.language-elixir}, increment his `score`{:.language-elixir} by `5`{:.language-elixir}, and then update the database with our changes.

The `handle_player_update`{:.language-elixir} function handles the result of our `Repo.update`{:.language-elixir}. If the update was successful, we’ll [broadcast](https://hexdocs.pm/phoenix/Phoenix.Channel.html#broadcast!/3) the `"add_points"`{:.language-elixir} event down to all connected clients, passing the affected `Player`{:.language-elixir} as the event’s payload:

<pre class='language-elixir'><code class='language-elixir'>
defp handle_player_update({:ok, player}, socket) do
  broadcast! socket, "add_points", %{id: player.id, score: player.score}
  {:noreply, socket}
end

defp handle_player_update({:error, changeset}, socket) do
  {:reply, {:error, changeset}, socket}
end
</code></pre>

The last piece of this puzzle is handling the `"add_points"`{:.language-javascript} events we receive on the client. Every time we receive an `"add_points"`{:.language-javascript} event from the server, we’ll want to update the provided `Player`{:.language-elixir} in our `Players`{:.language-javascript} Minimongo collection:

<pre class='language-javascript'><code class='language-javascript'>
this.channel.on("add_points", (player) => {
  Players.update(player.id, {
    $set: {
      score: player.score
    }
  });
});
</code></pre>

And that’s it!

Now if we navigate back to our Leaderboard application and start adding points to players, we’ll see their score and position change in the interface. If we connect multiple clients, we’ll see these changes in real-time as they happen.

## Final Thoughts

As fun as this was, we don’t recommend you tear your Meteor application in half like we did. This was an experiment and a learning experience, not a production ready migration path.

In the future, we may investigate more reasonable and production ready migrations routes from an application built with Meteor to a Elixir/Phoenix environment. Stay tuned!

Lastly, we realized while building this Franken-stack that Meteor’s DDP and Phoenix Channels are not one-to-one replacements for each other. Try imagining how you would implement a Meteor-style pub/sub system in Channels. It’s an interesting problem, and one we’re excited to tackle in future posts.

If you want to run the Leaderboard yourself, check out the full project [on GitHub](https://github.com/pcorey/phoenix_leaderboard). Feel free to open an issue if you have any questions, comments, or suggestions!
