---
layout: post
title:  "Phoenix Todos - The User Model"
excerpt: "Part two of our 'Phoenix Todos' Literate Commits series. Building out our user model."
author: "Pete Corey"
date:   2016-09-07
repo: "https://github.com/pcorey/phoenix_todos"
literate: true
tags: ["Elixir", "Phoenix", "Literate Commits", "Phoenix Todos"]
---


## [Create Users Table]({{page.repo}}/commit/b17b60561114027a03b5595d99c3abd5d06dfd8d)

Let's focus on adding users and authorization to our
Todos application. The first thing we'll need is to create a database
table to hold our users and a corresponding users schema.

Thankfully, Phoenix comes with many
[generators](http://www.phoenixframework.org/docs/mix-tasks) that ease the process of creating things like migrations and models.

To generate our users migration, we'll run the following `mix`{:.language-bash} command:

<pre class='language-bash'><code class='language-bash'>
mix phoenix.gen.model User users email:string encrypted_password:string
</code></pre>

We'll modify the migration file the generator created for us and add
`NOT NULL`{:.language-javascript} restrictions on both the `email`{:.language-elixir} and `encrypted_password`{:.language-elixir}
fields:

<pre class='language-elixir'><code class='language-elixir'>
add :email, :string, null: false
add :encrypted_password, :string, null: false
</code></pre>

We'll also add an index on the `email`{:.language-elixir} field for faster queries:

<pre class='language-elixir'><code class='language-elixir'>
create unique_index(:users, [:email])
</code></pre>

Great! Now we can run that migration with the `mix ecto.migrate`{:.language-bash}
command.


<pre class='language-elixirDiff'><p class='information'>priv/repo/migrations/20160901141548_create_user.exs</p><code class='language-elixirDiff'>
+defmodule PhoenixTodos.Repo.Migrations.CreateUser do
+  use Ecto.Migration
+
+  def change do
+    create table(:users) do
+      add :email, :string, null: false
+      add :encrypted_password, :string, null: false
+
+      timestamps
+    end
+
+    create unique_index(:users, [:email])
+  end
+end
</code></pre>



## [Creating the Users Model]({{page.repo}}/commit/4ecb09f545f4dba356a51504bf96345bb5f88c45)

Now that we're created our users table, we need to create a
corresponding `User`{:.language-elixir} model. Phoenix actually did most of the heavy
lifting for us when we ran the `mix phoenix.gen.model`{:.language-bash} command.

If we look in `/web/models`{:.language-bash}, we'll find a `user.ex`{:.language-bash} file that holds our
new `User`{:.language-elixir} model. While the defaults generated for us are very good,
we'll need to make a few tweaks.

In addition to the `:email`{:.language-elixir} and `:encrypted_password`{:.language-elixir} fields, we'll also
need a [virtual](https://hexdocs.pm/ecto/Ecto.Schema.html#field/3)
`:password`{:.language-elixir} field.

<pre class='language-elixir'><code class='language-elixir'>
field :password, :string, virtual: true
</code></pre>

`:password`{:.language-elixir} is virtual because it will be required by our `changeset`{:.language-elixir}
function, but will not be stored in the database.


Speaking of required fields, we'll need to update our `@required_fields`{:.language-elixir}
and `@optional_fields`{:.language-elixir}
[attributes](http://elixir-lang.org/getting-started/module-attributes.html)
to reflect the changes we've made:

<pre class='language-elixir'><code class='language-elixir'>
@required_fields ~w(email password)
@optional_fields ~w(encrypted_password)
</code></pre>

These changes to `@required_fields`{:.language-elixir} break our auto-generated tests
against the `User`{:.language-elixir} model. We'll need to update the `@valid_attrs`{:.language-elixir}
attribute in `test/models/user_test.ex`{:.language-bash} and replace
`:encrypted_password`{:.language-elixir} with `:password`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
@valid_attrs %{email: "user@example.com", password: "password"}
</code></pre>

And with that, our tests flip back to green!


<pre class='language-elixirDiff'><p class='information'>test/models/user_test.exs</p><code class='language-elixirDiff'>
+defmodule PhoenixTodos.UserTest do
+  use PhoenixTodos.ModelCase
+
+  alias PhoenixTodos.User
+
+  @valid_attrs %{email: "user@example.com", password: "password"}
+  @invalid_attrs %{}
+
+  test "changeset with valid attributes" do
+    changeset = User.changeset(%User{}, @valid_attrs)
+    assert changeset.valid?
+  end
+
+  test "changeset with invalid attributes" do
+    changeset = User.changeset(%User{}, @invalid_attrs)
+    refute changeset.valid?
+  end
+end
</code></pre>

<pre class='language-elixirDiff'><p class='information'>web/models/user.ex</p><code class='language-elixirDiff'>
+defmodule PhoenixTodos.User do
+  use PhoenixTodos.Web, :model
+
+  schema "users" do
+    field :email, :string
+    field :password, :string, virtual: true
+    field :encrypted_password, :string
+
+    timestamps
+  end
+
+  @required_fields ~w(email password)
+  @optional_fields ~w(encrypted_password)
+
+  @doc """
+  Creates a changeset based on the `model` and `params`.
+
+  If no params are provided, an invalid changeset is returned
+  with no validation performed.
+  """
+  def changeset(model, params \\ :empty) do
+    model
+    |> cast(params, @required_fields, @optional_fields)
+  end
+end
</code></pre>



## [Additional Validation]({{page.repo}}/commit/1a1f1f24ab67fad477adb450faaa4b10e06abbbf)

While the default required/optional field validation is a good start, we
know that we'll need additional validations on our `User`{:.language-elixir} models.

For example, we don't want to accept email addresses without the `"@"`{:.language-elixir}
symbol. We can write a test for this in our `UserTest`{:.language-elixir} module:

<pre class='language-elixir'><code class='language-elixir'>
test "changeset with invalid email" do
  changeset = User.changeset(%User{}, %{
    email: "no_at_symbol",
    password: "password"
  })
  refute changeset.valid?
end
</code></pre>

Initially this test fails, but we can quickly make it pass by adding
basic regex validation to the `:email`{:.language-elixir} field in our `User.changeset`{:.language-elixir}
function:

<pre class='language-elixir'><code class='language-elixir'>
|> validate_format(:email, ~r/@/)
</code></pre>

We can repeat this process for all of the additional validation we need,
like checking password length, and asserting email uniqueness.


<pre class='language-elixirDiff'><p class='information'>test/models/user_test.exs</p><code class='language-elixirDiff'>
 ...
 
-  alias PhoenixTodos.User
+  alias PhoenixTodos.{User, Repo}
 
 ...
   end
+
+  test "changeset with invalid email" do
+    changeset = User.changeset(%User{}, %{
+      email: "no_at_symbol",
+      password: "password"
+    })
+    refute changeset.valid?
+  end
+
+  test "changeset with short password" do
+    changeset = User.changeset(%User{}, %{
+      email: "email@example.com",
+      password: "pass"
+    })
+    refute changeset.valid?
+  end
+
+  test "changeset with non-unique email" do
+    User.changeset(%User{}, %{
+      email: "email@example.com",
+      password: "password",
+      encrypted_password: "encrypted"
+    })
+    |> Repo.insert!
+
+    assert {:error, _} = User.changeset(%User{}, %{
+      email: "email@example.com",
+      password: "password",
+      encrypted_password: "encrypted"
+    })
+    |> Repo.insert
+  end
 end
</code></pre>

<pre class='language-elixirDiff'><p class='information'>web/models/user.ex</p><code class='language-elixirDiff'>
 ...
     |> cast(params, @required_fields, @optional_fields)
+    |> validate_format(:email, ~r/@/)
+    |> validate_length(:password, min: 5)
+    |> unique_constraint(:email, message: "Email taken")
   end
</code></pre>



## [Hashing Our Password]({{page.repo}}/commit/b27ac6bdf035ed79d9339dee04bbce4cf93b38e3)

You might have noticed that we had to manually set values for the
`encrypted_password`{:.language-elixir} field for our `"changeset with non-unique email"`{:.language-elixir}
test to run. This was to prevent the database from complaining about a
non-null constraint violation.

Let's remove those lines from our test and generate the password hash
ourselves!

<p style="border: 1px dashed tomato; padding: 1em; background-color: rgba(255, 99, 71, 0.125);"><code class=" highlighter-rouge language-elixir">:encrypted_password</code> was an unfortunate variable name choice. Our password is not being encrypted and stored in the database; that would be insecure. Instead we're storing the <a href="http://stackoverflow.com/a/4948393">hash of the password</a>.</p>

We'll use the `comeonin`{:.language-elixir} package to hash our passwords, so we'll add it
as a dependency and an application in `mix.exs`{:.language-bash}:

<pre class='language-elixir'><code class='language-elixir'>
def application do
  [...
   applications: [..., :comeonin]]
end
</code></pre>

<pre class='language-elixir'><code class='language-elixir'>
defp deps do
  [...
   {:comeonin, "~> 2.0"}]
end
</code></pre>

Now we can write a private method that will update the our
`:encrypted_password`{:.language-elixir} field on our `User`{:.language-elixir} model if its given a valid
changeset that's updating the value of `:password`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
defp put_encrypted_password(changeset = %Ecto.Changeset{
  valid?: true,
  changes: %{password: password}
}) do
  changeset
  |> put_change(:encrypted_password, Comeonin.Bcrypt.hashpwsalt(password))
end
</code></pre>

We'll use pattern matching to handle the cases where a changeset is
either invalid, or not updating the `:password`{:.language-elixir} field:

<pre class='language-elixir'><code class='language-elixir'>
defp put_encrypted_password(changeset), do: changeset
</code></pre>

Isn't that pretty? And with that, our tests are passing once again.


<pre class='language-elixirDiff'><p class='information'>mix.exs</p><code class='language-elixirDiff'>
 ...
      applications: [:phoenix, :phoenix_html, :cowboy, :logger, :gettext,
-                    :phoenix_ecto, :postgrex]]
+                    :phoenix_ecto, :postgrex, :comeonin]]
   end
 ...
      {:cowboy, "~> 1.0"},
-     {:mix_test_watch, "~> 0.2", only: :dev}]
+     {:mix_test_watch, "~> 0.2", only: :dev},
+     {:comeonin, "~> 2.0"}]
   end
</code></pre>

<pre class='language-elixirDiff'><p class='information'>mix.lock</p><code class='language-elixirDiff'>
-%{"connection": {:hex, :connection, "1.0.4"},
+%{"comeonin": {:hex, :comeonin, "2.5.2"},
+  "connection": {:hex, :connection, "1.0.4"},
   "cowboy": {:hex, :cowboy, "1.0.4"},
</code></pre>

<pre class='language-elixirDiff'><p class='information'>test/models/user_test.exs</p><code class='language-elixirDiff'>
 ...
       email: "email@example.com",
-      password: "password",
-      encrypted_password: "encrypted"
+      password: "password"
 })
 ...
       email: "email@example.com",
-      password: "password",
-      encrypted_password: "encrypted"
+      password: "password"
 })
</code></pre>

<pre class='language-elixirDiff'><p class='information'>web/models/user.ex</p><code class='language-elixirDiff'>
 ...
     |> unique_constraint(:email, message: "Email taken")
+    |> put_encrypted_password
   end
+
+  defp put_encrypted_password(changeset = %Ecto.Changeset{
+    valid?: true,
+    changes: %{password: password}
+  }) do
+    changeset
+    |> put_change(:encrypted_password, Comeonin.Bcrypt.hashpwsalt(password))
+  end
+  defp put_encrypted_password(changeset), do: changeset
 end
</code></pre>

## Final Thoughts

Things are starting to look very different from our [original Meteor application](https://github.com/meteor/todos/tree/react). While [Meteor](https://www.meteor.com/) tends to hide complexity from application developers by withholding code in the framework itself, [Phoenix](http://www.phoenixframework.org/) expects developers to write much of this boilerplate code themselves.

While Meteor’s methodology lets developers get off the ground quickly, Phoenix’s philosophy of hiding nothing ensures that there’s no magic in the air. Everything works just as you would expect; it’s all right in front of you!

Additionally, [Phoenix generators](http://www.phoenixframework.org/docs/mix-tasks) ease most of the burden of creating this boilerplate code.

Now that our `User`{:.language-elixir} model is in place, we’re in prime position to wire up our front-end authorization components. Check back next week to see those updates!
