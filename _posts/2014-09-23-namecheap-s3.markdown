---
layout: post
title:  "Namecheap + Amazon S3"
titleParts: ["Namecheap", "+ Amazon S3"]
description: "Namecheap and Amazon's S3 are a match made in heaven. Follow these steps to get both working together seamlessly."
author: "Pete Corey"
date:   2014-09-23
tags: ["Infrastructure"]
---

I recently wanted to point a domain I had registered on [Namecheap](https://www.namecheap.com/) ([www.thisurlshortenertotallyandcompletely.rocks](http://www.thisurlshortenertotallyandcompletely.rocks/)) to a static site I was hosting on [Amazon S3](http://aws.amazon.com/s3). The whole process was fairly painless. Check it out:

1. Create a new S3 bucket.
2. Upload your content to the bucket.
3. Add a bucket policy to allow [anonymous read access](http://docs.aws.amazon.com/AmazonS3/latest/dev/example-bucket-policies.html) to all objects in the bucket:
<pre><code class="language-javascript">{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AddPerm",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::www.thisurlshortenertotallyandcompletely.rocks/*"
        }
    ]
}</code></pre>

4. Enable website hosting on the bucket. Save the endpoint generated for you. You’ll need this to set up your Namecheap CNAME alias.
5. Browse to the alias and make sure that your site is working as expected.
6. Now on Namecheap, select the domain you want to link to your S3 bucket.
7. Go into “All Host Records”.
8. Add a CNAME alias to the endpoint of your bucket.
9. Have a beer.

I hope that helps.
