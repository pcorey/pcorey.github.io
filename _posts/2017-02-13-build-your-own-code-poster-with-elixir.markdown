---
layout: post
title:  "Build Your Own Code Poster with Elixir"
description: "I used Elixir to merge together a client's logo with the code we'd worked together to develop. The result was a beautiful code poster and this open source Elixir project."
author: "Pete Corey"
date:   2017-02-13
tags: ["Elixir", "Experiments"]
---

I recently finished up a long engagement with one of my clients, [AdmitHub](https://www.admithub.com/). To celebrate the work we had done together, I wanted to give them a going away gift.

I liked the idea of giving them a [Commits.io](https://commits.io/) poster, but I wasn’t comfortable handing out access to my client’s private repository to a third party.

Not to be deterred, I decided to use this opportunity to practice [Elixir](http://elixir-lang.org/) and build my own poster generator!

In the process of making the AdmitHub poster, I also made an Elixir poster to celebrate my ever increasing love for the language.

## High-level Strategy

If we approach the problem of generating a code poster from a high level, we can break it into three distinct parts.

First, we’ll want to load a source image and a blob of source code. These pieces of data are the raw building blocks for our final poster.

Next, we’ll need to merge this data together. Our ideal outcome is an SVG filled with `<text>`{:.language-markup} elements. Each `<text>`{:.language-markup} element will contain one or more characters, or code points, from our source code blob, colored to match the corresponding pixel in our source image.

Once we’ve merged this data together in memory, we need to generate our final SVG and save it to disk.

With our SVG in hand, we can use a tool like [Adobe Illustrator](http://www.adobe.com/products/illustrator.html) or [Inkscape](https://inkscape.org/en/) to render it into a more printer friendly format and then send it off to be printed!

<img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/poster-dof.png" style="width: 100%; margin: 1em 0 0 0;">

## Loading Our Source Data

Our application will make use of the [Imagineer elixir library](https://github.com/SenecaSystems/imagineer) to load our source image. As an example, we’ll be using [a beautiful version of the Elixir logo](http://brunakochi.com/projects/elixir.html) as designed by Bruna Kochi.

Before loading our image into our application, we need to consider a few things.

We’ll be using the [Source Code Pro](https://github.com/adobe-fonts/source-code-pro) font to render the code in our poster. It’s important to realize that the characters in Source Code Pro, while monospaced, aren’t perfectly square. It turns out that the ratio of each character’s width to its height is `0.6`{:.language-elixir}.

This means that if we’re inserting a character of code for every pixel in our source image, and we want our final poster to maintain the aspect ratio of the original logo, we’ll need to scale the width of our source image by a factor of `1.667`{:.language-elixir}.

<a href="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/poster_source_image.png"><img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/poster_source_image.png" style="float: right; width: 33%; margin: 0 0 0 1em;"></a>

The total width and height of our source image also effects the outcome of our poster. More pixels means more (and smaller) code characters. A width and height of `389px`{:.language-elixir} by `300px`{:.language-elixir} gives good results.

Check out the scaled and resized source image to the right.

Once we’ve scaled and resized our source image, loading it into our Elixir application is a breeze:

<pre class='language-elixir'><code class='language-elixir'>
{:ok, image} = Imagineer.load(image_path)
</code></pre>

Within the resulting `image`{:.language-elixir} struct, we’ll find a `pixels`{:.language-elixir} field that holds all of the raw pixel data for the image in a two-dimensional array of tuples. Each tuple holds the RGB value for that specific pixel.

---- 

Now that we’ve loaded our source image, we’ll need to load the code we want to render onto our poster.

Rather than letting a library do the heavy lifting for us, we’ll take a more hands-on approach here.

We’ll use `File.read!`{:.language-elixir} to load the file at `code_path`{:.language-elixir} into memory, strip out any excess whitespace with the `join_code`{:.language-elixir} helper function, and finally split the resulting string into a list of individual code points:

<pre class='language-elixir'><code class='language-elixir'>
code = code_path
|> File.read!
|> join_code
|> String.codepoints
</code></pre>

The `join_code`{:.language-elixir} function simply replaces all newlines with leading and trailing spaces with a single space character, and replaces all non-space whitespace characters (tabs, etc…) with spaces:

<pre class='language-elixir'><code class='language-elixir'>
def join_code(code) do
  code
  |> String.trim
  |> String.replace(~r/\s*\n+\s*/, " ")
  |> String.replace(~r/\s/," ")
end
</code></pre>

And with that, we’ve successfully loaded both our source image, and our source code!

## Merging Pixels and Code Points

The real meat of our application is in merging these two disparate sets of data.

Our goal is to build an in-memory data structure that places each code point from our source code blob in its correct position on the poster, and colors it according to the pixel corresponding to that same position.

Imagineer delivers pixel data in the form of a list of rows of pixels. Each pixel is a tuple of RGB values. The structure of this data influences how we’ll structure our solution.

Ultimately, we’ll `map`{:.language-elixir} over each row of pixels and `reduce`{:.language-elixir} each row down to a list of tuples representing each `<text>`{:.language-markup} element in our final poster.

---- 

The reduction of each row is probably the most interesting part of our application. When reducing an individual pixel from a row of pixels, there are three possible scenarios.

This might be the first pixel we’ve encountered in a row. In that case, create a new `<text>`{:.language-markup} element:

<pre class='language-elixir'><code class='language-elixir'>
def merge_pixel_into_row(fill, character, x, y, []) do
  [{:text, %{x: x, y: y, fill: fill}, character}]
end
</code></pre>

The current pixel might match the `fill`{:.language-elixir} color of the previous pixel. In that case, append the current `character`{:.language-elixir} to the body of the previous `<text>`{:.language-markup} element:

<pre class='language-elixir'><code class='language-elixir'>
def merge_pixel_into_row(fill, character, _, _, 
                         [{:text, element = %{fill: fill}, text} | tail]) do
  [{:text, element, text <> character} | tail]
end
</code></pre>

Notice that we’re pattern matching the current `fill`{:.language-elixir} color to the `fill`{:.language-elixir} color of the previously seen text element. Awesome!

Lastly, the current pixel might be a different color. In that case, create and append a new `<text>`{:.language-markup} element to the head of the list:

<pre class='language-elixir'><code class='language-elixir'>
def merge_pixel_into_row(fill, character, x, y, pixels) do
  [{:text, %{x: x, y: y, fill: fill}, character} | pixels]
end
</code></pre>

After flattening the results of our `map`{:.language-elixir}/`reduce`{:.language-elixir}, we finally have our resulting list of correctly positioned and colored `<text>`{:.language-markup} elements!

## Building Our SVG

Now that we’ve built up the representations of our `<text>`{:.language-markup} elements, we can finally construct our SVG.

We’ll use the [`xml_builder`{:.language-elixir} Elixir module](https://hex.pm/packages/xml_builder) to generate our final SVG. Generating an SVG with `xml_builder`{:.language-elixir} is as simple as passing an `:svg`{:.language-elixir} tuple populated with our text elements and any needed attributes into `XmlBuilder.generate`{:.language-elixir}:

<pre class='language-elixir'><code class='language-elixir'>
{:svg,
 %{
   viewBox: "0 0 #{width*ratio} #{height}",
   xmlns: "http://www.w3.org/2000/svg",
   style: "font-family: 'Source Code Pro'; font-size: 1; font-weight: 900;",
   width: final_width,
   height: final_height,
   "xml:space": "preserve"
 },
 text_elements}
|> XmlBuilder.generate
</code></pre>

Notice that we’re defining a `viewBox`{:.language-elixir} based on the source image’s `width`{:.language-elixir}, `height`{:.language-elixir}, and our font’s `ratio`{:.language-elixir}. Similarly, we’re setting the final `width`{:.language-elixir} and `height`{:.language-elixir} based on the provided `final_width`{:.language-elixir} and `final_height`{:.language-elixir}.

The `"xml:space": "preserve"`{:.language-elixir} attribute is important. Without [preserving whitespace](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/xml:space), text elements with leading with space characters will be trimmed. This results in strangely chopped up words in the final poster and is a difficult issue to track down (trust me).

Lastly, we pass in the list of `:text`{:.language-elixir} tuples we’ve generated and stored in the `text_elements`{:.language-elixir} list.

## The Final Poster

After the final SVG is generated and saved to disk, it can be loaded into Illustrator or Inkscape and rendered to a PNG for printing.

A `10500`{:.language-elixir} by `13500`{:.language-elixir} pixel image at 300 dpi looks fantastic when printed onto a 20x30 inch poster.

Overall, I’m very happy with the outcome of the final poster. It beautifully commemorates the work my client and I accomplished together over the past two years, and will hang proudly in my office and theirs.

<img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/poster-admithub-01.png" style="width: 100%; margin: 1em 0;">

The Elixir poster turned out very nicely as well. If you’re interested or want to print your own poster, you can [download the full resolution output image here](https://s3-us-west-1.amazonaws.com/www.east5th.co/img/elixir_poster.png).

<img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/poster-elixir-01.png" style="width: 100%; margin: 1em 0;">

<img src="https://s3-us-west-1.amazonaws.com/www.east5th.co/img/poster-elixir-02.png" style="width: 100%; margin: 1em 0;">

---- 

The application takes approximately one minute to generate a 20x30 inch poster, depending on the color variation per row. This performance can almost definitely be improved and may be the subject of a future post.

Was Elixir the tool for this project? Probably not. Was it still a fun project and a good learning experience? Absolutely.

If you’re interested in seeing more of the code, be sure to [check out the entire project on Github](https://github.com/pcorey/elixir_poster).
