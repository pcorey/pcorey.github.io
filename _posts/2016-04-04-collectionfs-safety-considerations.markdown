---
layout: post
title:  "CollectionFS Safety Considerations"
titleParts: ["CollectionFS", "Safety Considerations"]
description: "Allowing file uploads to your applications opens you up to a world of potential vulnerabilities. Make sure you're protected."
author: "Pete Corey"
date:   2016-04-04
tags: ["Javascript", "Meteor", "Security"]
---

The ability to upload files is a core piece of functionality in many web applications. Because of this, many libraries have sprung up around the topic of managing and facilitating file uploads. Arguably the most popular [Meteor](https://www.meteor.com/) file upload package is [CollectionFS](https://github.com/CollectionFS/Meteor-CollectionFS).

CollectionFS is ubiquitous throughout the Meteor community due to its extensive functionality and its ease of use. In fact, it’s so easy to use that many developers simply drop it into their application and move on to their next feature without considering the implications that file uploading might have.

From a security and performance perspective, there are several things you should consider and make conscious choices about before adding file uploading to your application:

- File size limiting
- File count limiting
- File type restrictions
- File handling and processing

Let’s dive into each of these topics and explore why they’re so important.

# File Size Limiting
The size of files being uploaded into your system quickly becomes important when you begin working with those files. Are you processing the files that are uploaded in any way? In doing that processing, are you attempting to load the entire file’s contents into memory?

Loading a massive file into memory can quickly lead to performance issues and server crashes. [Node.js](https://nodejs.org/en/) applications have a [default maximum of 1.76GB  of available memory](http://prestonparry.com/articles/IncreaseNodeJSMemorySize/). If a user were to upload a file that’s around 1.76GB or larger, it would lead to the server crashing and the application being completely unavailable during the restart.

Thankfully, restricting an upload’s file size is a very simple process when using CollectionFS. The following code creates a `Files`{:.language-javascript} collection and uses the `filter`{:.language-javascript} object to specify a maximum file size of 100MB (`1e+8`{:.language-javascript} bytes).

<pre class="language-javascript"><code class="language-javascript">Files = new FS.Collection("files", {
  stores: [ ... ],
  filter: {
    maxSize: 1e+8
  }
});
</code></pre>

Any files larger that 100MB will be rejected by this filter.

# File Count Limiting
Along with limiting the size of files being uploaded, you should also limit the number of files uploadable by users of your system.

Imagine that you’re using CollectionFS to upload files into an [S3 bucket](https://aws.amazon.com/s3/). Left unchecked, a malicious user might upload hundreds or thousands of very large files into this bucket, drastically increasing the amount of storage space being used.

Without some kind of alerting, you may not notice this until your next AWS billing cycle where you’ll find a notably increased S3 bill!

Adding a maximum limit to the number of files in your CollectionFS stores is accomplished by added a custom insert rule to your file collection:

<pre class="language-javascript"><code class="language-javascript">Files.allow({
  insert: function() {
    return Files.find().count() <= 100;
  }
});
</code></pre>

In this example, file uploads will be rejected if there are already 100 files uploaded to your stores.

We could easily tweak this example to allow a maximum number of files per user or per any arbitrary group of users.

# File Type Restrictions
When files go up, they usually come down. Any system that allows for the uploading of files usually intends for those files to be downloaded and used at some point in the future.

However, what if a user could upload any kind of file they wanted? Imagine the repercussions of a user uploading malicious scripts, executables or viruses to your applications. Those files might be downloaded and run by some other user, leading to a compromise of their system.

Most applications only work with a small set of file types. It’s  good security practice to only allow files of those types to be uploaded. The best way to restrict the file types allowed into your system is to allow a set of expected file extensions:

<pre class="language-javascript"><code class="language-javascript">Files = new FS.Collection("files", {
  stores: [ ... ],
  filter: {
    allow: {
      extensions: ["pdf", "doc", "docx"]
    }
  }
});
</code></pre>

This example only allows PDFs and Word documents to be uploaded.

Filtering on file extension is considered safer than filtering on content type. The content type of an uploaded is provided by the client and [can easily be spoofed](http://security.stackexchange.com/questions/35933/how-can-i-spoof-the-mimetype-of-a-file-upload).

Additionally, always whitelist expected file extensions, rather than blacklisting disallowed extensions. Blacklisting creates the possibility that a harmful file extension was forgotten, and [could still be uploaded](https://www.owasp.org/index.php/Unrestricted_File_Upload#Using_Black-List_for_Files.E2.80.99_Extensions). 

# File Handling and Processing
When working with uploaded files, always act defensively. Never assume that the file is well-formed or that it will conform to your assumptions. Bugs in file processing algorithms have historically led to some severe vulnerabilities.

CollectionFS’s `transformWrite`{:.language-javascript} runs in an unprotected thread of execute. This means that any uncaught exceptions that bubble up out of this method will escalate all the way to the event loop and crash the application. Once the server restarts, CollectionFS will notice that the transformation was not success and will re-attempt to transform the file, [crashing the server in the process](https://github.com/CollectionFS/Meteor-CollectionFS/issues/550).

This kind of repeated crashing can leave your application completely inaccessible to users until the file having problems is removed from your CollectionFS store. A malicious user may intentionally create a crash loop to deny service to your application.

# Final Thoughts
Working with files can be a dangerous proposition. Thankfully, CollectionFS and its associated storage drivers takes some of the danger out of our hands. In most circumstances we don’t have to worry about things like directory traversal vulnerabilities, or the possibilities of arbitrary code execution.

As we’ve seen, there are still things we need to be considerate of. If you follow these suggestions and spent time thoroughly analyzing your file upload system, you should have nothing to worry about.

