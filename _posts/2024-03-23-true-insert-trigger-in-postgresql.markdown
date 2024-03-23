---
layout: post
title:  "True Insert Trigger in PostgreSQL"
excerpt: "Building a \"true\" insert trigger in PostgreSQL turned out to be more difficult than I expected."
author: "Pete Corey"
date:   2024-03-23
tags: ["PostgreSQL", "SQL"]
related: []
---




I recently found myself in need of a PostgreSQL trigger that only triggered a notification when a "true insert" occurred. By "true insert", I mean an `INSERT` operation that resulted in a new row being added to the table, and not an `INSERT` operation that updated an existing row due to a `ON CONFLICT DO UPDATE` clause.

My first attempt was fairly simple:

```sql
CREATE OR REPLACE FUNCTION inserted()
  RETURNS trigger AS $trigger$
  BEGIN
    NOTIFY inserted;
    RETURN NEW;
  END;
  $trigger$ LANGUAGE plpgsql;

CREATE TRIGGER inserted_trigger
  AFTER INSERT ON table
  FOR EACH ROW
  EXECUTE PROCEDURE inserted();
```

But as you can guess, it didn't work. The `AFTER INSERT` trigger fires even in the case of an existing row being updated by an `INSERT ... ON CONFLICT DO UPDATE` statement.

I tried to filter those updates out by assing a `WHEN` clause to my trigger:

```sql
CREATE TRIGGER inserted_trigger
  AFTER INSERT ON table
  FOR EACH ROW
  WHEN (OLD IS NULL)
  EXECUTE PROCEDURE inserted();
```

Unfortunately, however, `OLD` is not referenceable within an `INSERT` trigger's `WHEN` clause.

The solution, it turns out, is to do the filtering within my `inserted` function. As of PostgreSQL 11, `OLD` is referenceable in a trigger function, but will resolve to `NULL` in situations where it doesn't exist. Thank you to [Erwin Brandstetter for sharing this knowledge on StackOverflow](https://dba.stackexchange.com/a/310730).

Our final soluation looks like this:

```sql
CREATE OR REPLACE FUNCTION inserted()
  RETURNS trigger AS $trigger$
  BEGIN
    IF (OLD IS NULL) THEN
      NOTIFY inserted;
    END IF;
    RETURN NEW;
  END;
  $trigger$ LANGUAGE plpgsql;

CREATE TRIGGER inserted_trigger
  AFTER INSERT ON table
  FOR EACH ROW
  EXECUTE PROCEDURE inserted();
```

It works!
