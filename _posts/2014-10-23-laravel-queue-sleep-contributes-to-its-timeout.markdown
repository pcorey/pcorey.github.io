---
layout: post
title:  "Laravel Queue's Sleep Contributes to its Timeout"
date:   2014-10-23
categories:
---

Once again, I was tinkering with my [Laravel queues](http://laravel.com/docs/4.2/queues) today and I ran into an interesting issue. I have a queue listener running with the following command:

<pre class="language-*"><code class="language-*">php artisan queue:listen --env=stage --queue="slow-queue"</code></pre>

The jobs that slow-queue processes are infrequent and aren't very important, so I decided to have the listener sleep for one minute between job checks:

<pre class="language-*"><code class="language-*">php artisan queue:listen --sleep 60 --env=stage --queue="slow-queue”</code></pre>

I restarted my supervisor daemon and waited a few minutes to verify that everything was working correctly. Unfortunately, everything was *not* working correctly. All of the jobs being processed by the slow-queue listener were failing with a <code class="language-*">ProcessTimedOutException</code>:

<pre class="language-*"><code class="language-*">[2014-10-23 09:51:27] stage.ERROR: exception 'Symfony\Component\Process\Exception\ProcessTimedOutException' with message 'The process ""/usr/bin/php" artisan queue:work  --queue="slow-queue" --delay=0 --memory=128 --sleep=60 --tries=0 --env=stage" exceeded the timeout of 60 seconds.' in /www/beyondhealthcareagency.com/vendor/symfony/process/Symfony/Component/Process/Process.php:1209
Stack trace:
#0 /www/beyondhealthcareagency.com/vendor/symfony/process/Symfony/Component/Process/Process.php(357): Symfony\Component\Process\Process->checkTimeout()
#1 /www/beyondhealthcareagency.com/vendor/symfony/process/Symfony/Component/Process/Process.php(206): Symfony\Component\Process\Process->wait()
#2 /www/beyondhealthcareagency.com/vendor/laravel/framework/src/Illuminate/Queue/Listener.php(94): Symfony\Component\Process\Process->run(Object(Closure))
#3 
...</code></pre>

My first thought was that the sleep time must be contributing toward the job processes’ timeout counter (which defaults to 60 seconds). To test this thought, I increased the timeout on the listen command to 61 and tried running the jobs again:

<pre class="language-*"><code class="language-*">php artisan queue:listen --sleep 60 --timeout 61 --env=stage --queue="slow-queue"</code></pre>

Sure enough, it looked like the jobs were completing successfully. As a quick fix to this issue I increased the timeout for slow-queue to 2 minutes:

<pre class="language-*"><code class="language-*">php artisan queue:listen --sleep 60 --timeout 120 --env=stage --queue="slow-queue"</code></pre>

It seems very strange to me that the sleep time specified in the queue listener would contribute towards it’s timeout time. In my mind, sleep would cause the listen process to wait the specified number of seconds to check for a new job. If there is a new job, that job process would start and its timeout counter would start.

I may be completely misunderstanding what’s happening here, but I went ahead and opened a [github issue](https://github.com/laravel/framework/issues/6206) to either get it fixed or get an answer.