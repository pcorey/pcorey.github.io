---
layout: post
title:  "Generated TSVector Columns in Elixir"
excerpt: "Add a generated text search column to a table in your Elixir application in four easy steps."
author: "Pete Corey"
date:   2024-10-20
tags: ["Elixir", "PostgreSQL"]
related: []
---

I've played with many techniques for adding and maintaining `tsvector` columns in PostgresSQL tables used by my Elixir applications. This is the techique that I've had the most success with. It's easy to set up in a migration, and maintains itself. No need for additional views on top of our tables that require manual refreshes.

Assuming we're in a migration, we can start by creating a function that converts any given parameters into a `tsvector`. Wrap each of the given SQL fragments in a call to [`execute/1`](https://hexdocs.pm/ecto_sql/Ecto.Migration.html#execute/1):

```sql
CREATE FUNCTION get_my_table_ts(id bigint, display_name text, description text)
RETURNS tsvector AS $$
BEGIN
  RETURN (
    setweight(to_tsvector('english', coalesce(id::text, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(display_name, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
  );
END
$$
IMMUTABLE
LANGUAGE plpgsql
RETURNS NULL ON NULL INPUT ;
```

This function can even make queries against other tables and use the resulting values in the final `tsvector` construction:

```sql
CREATE FUNCTION get_my_table_ts(id bigint, display_name text)
RETURNS tsvector AS $$
DECLARE parent_display_name VARCHAR ;
BEGIN
  SELECT parent_table.display_name INTO parent_display_name
  FROM
    parent_table
    JOIN my_table ON my_table.parent_id = parent_table.id
  WHERE
    my_table.id = get_my_table_ts.id
  ;
  RETURN (
    setweight(to_tsvector('english', coalesce(id::text, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(display_name, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(parent_display_name, '')), 'C')
  );
END
$$
IMMUTABLE
LANGUAGE plpgsql
RETURNS NULL ON NULL INPUT ;
```

Once we've defined out function (`get_my_table_ts`) we can use it to create a generated, persisted `tsvector` column on our table:

```sql
ALTER TABLE my_table ADD COLUMN ts tsvector
GENERATED ALWAYS AS (get_my_table_ts(id, display_name, coalesce(description, ''))) STORED;
```

Finally, we should probably create a GIN index on our `ts` column if we plan to use it as for text searching:

```elixir
create index("facility", ["ts"], using: :gin)
```

That's it! I've found this recipe to be useful. I hope you do too.
