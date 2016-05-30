---
layout: post
title:  "AWS Lambda First Impressions"
titleParts: ["AWS Lambda", "First Impressions"]
date:   2016-05-24
tags: []
---

Lately, I’ve been paying quite a bit of attention to [AWS Lambda](https://aws.amazon.com/lambda/).

Lambda is an [Amazon Web Service](https://aws.amazon.com/about-aws/) designed to run small pieces of code in response to external stimuli (an endpoint is hit, a document is inserted into a database, etc…). The beautiful thing about Lambda is that your code is designed to run once, and you’re only charged for the amount of time your code is running.

## A Node.js Script

To make things a little more concrete, let’s talk about my first baby-steps into working with Lambda.

I have a script-based tool that automates [Bitcoin](https://bitcoin.org/en/) lending on the [Poloniex exchange](https://www.poloniex.com/lending). Pre-Lambda, I implemented this tool as a [Node.js](https://nodejs.org/en/) script that spun up a local server, and executed a job every 15 minutes to “do stuff” (💸 💸 💸).

I wanted to move this script off of my local machine (mostly so I could close my laptop at night), so I began investigating my hosting and pricing options. On the low end of things, I could spin up a small [DigitalOcean](https://www.digitalocean.com/) droplet for [five dollars per month](https://www.digitalocean.com/pricing/). Not bad, but I knew I’d be unnecessarily paying for quite a bit of idle server time.

I even considered buying a [Raspberry PI](https://www.raspberrypi.org/) for around forty dollars. I figured the upfront-costs of buying the device would be payed for within a year. After that initial investment, the power requirements would be negligible.

## Meets AWS Lambda

Finally, I found Lambda. I quickly and painlessly modified my Node script to run once, manually deployed it to Lambda, and added a schedule trigger to run my script once every fifteen minutes.

Fast forward past a couple hours of fiddling and my script was working!

After monitoring my script for several days, I noticed that it took between one to two seconds to execute, on average. I added an execution hard-stop duration of three seconds to my Lambda function. With that, I knew that I would be charged for, at most, three seconds of up-time every fifteen minutes.

Using that data and [Lambda’s pricing sheet](https://aws.amazon.com/lambda/pricing/), I calculated that at three seconds per execution with an execution every fifteen minutes, ___the yearly cost for running my script was___<s>, at most, at just under twenty two cents</s> ___zero dollars___.

I was shocked. <s>$0.22/year!</s> Thanks to Lambda's free tier, ___hosting my script was free!___ Comparing that to DigitalOcean’s $60/year, or a Raspberry PI’s upfront cost of $40+ dollars, I had a clear winner.

## Looking Forward

My first introduction to AWS Lambda left me impressed. [Further research has left me even more excited](http://kevinold.com/2016/02/01/serverless-graphql.html). The possibilities of an scalable on-demand, event-driven infrastructure seem very attractive.

While I’m not totally re-assessing my software development stack, I’m definitely making a little room for Lambda. I’m already thinking about how I could have used it in the past to build more elegantly engineered, ___and cheaper___ solutions.
