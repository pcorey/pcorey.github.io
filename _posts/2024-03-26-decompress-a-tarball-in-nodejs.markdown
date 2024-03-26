---
layout: post
title:  "Decompress a Tarball in Node.js"
excerpt: "It seems like there aren't many great, well-maintained options for decompressing zipballs and tarballs on the Node.js server. Here's what I landed on recently."
author: "Pete Corey"
date:   2024-03-26
tags: ["Node.js", "Tar", "Compression"]
related: []
---

Recently, I found myself tasked with downloading a tarball of a Github repository in Node.js and decompressing it in memory. Grabbing the tarball (or zipball) is fairly straight forward using [`octokit`](https://www.npmjs.com/package/octokit):

```js
let { data } = await octokit.rest.repos.downloadTarballArchive({
  owner: process.env.GITHUB_OWNER,
  repo: process.env.GITHUB_REPO,
});
```

But decompressing the archive turned out to be a bigger ordeal. There are _many_ libraries that exist to extract zip and tar archives, but nearly all of them are extremely old and unmaintained. The best option I found across both the zip and tar worlds is the [`tar`](https://www.npmjs.com/package/tar) package. `tar` makes heavy use of streams, but I decided to wrap everything in a promise to give me a nicer interface for extracting files into memory:

```js
const decompress = (arrayBuffer) => {
  return new Promise((resolve, reject) => {
    let buffer = Buffer.from(arrayBuffer);
    let parseStream = new tar.Parse();
    let files = [];

    parseStream.on("entry", function (entry) {
      let chunks = [];
      entry.on("data", (chunk) => chunks.push(chunk));
      entry.on("end", () => {
        let content = Buffer.concat(chunks);
        files.push({ path: entry.path, content });
      });
    });

    parseStream.on("end", () => {
      resolve(files);
    });

    parseStream.on("error", (error) => {
      reject(error);
    });

    let bufferStream = new Readable();

    bufferStream.pipe(parseStream);

    bufferStream.push(buffer);
    bufferStream.push(null);
  });
};
```

From there, I'm free to do whatever I'd like with the extracted archive:

```js
let files = await decompress(data);

files.forEach((file) => {
  console.log(file.path, file.content.toString());
});
```

Happy extracting!
