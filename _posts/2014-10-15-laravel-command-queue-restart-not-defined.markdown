---
layout: post
title:  "Laravel 4.2 Command \"Queue:Restart\" is Not Defined"
titleParts:  ["Laravel 4.2 Command", "\"Queue:Restart\"", "is Not Defined"]
date:   2014-10-15
categories:
---

I'm currently working a client project using [Laravel 4.2](http://laravel.com/docs/4.2/). The project uses 4 separate queues for a variety of tasks. Today I noticed that the queues were eating up an unhealthy amount of resources. After reading through the [docs](http://laravel.com/docs/4.2/queues), I noticed that this CPU consumption was most likely being caused by spinning up the laraval framework for every job processed. By using the <code class="language-*">--daemon</code> flag, introduced in 4.2, you can keep the framework loaded in memory and prevent unncessary work by bringing it up and down for each job. **Awesome!**

After switching to <code class="language-*">queue:work --daemon ...</code> I noticed an immediate drop in CPU consumption! But, because I read the docs, I knew that I could expect the DB connections in the in-memory framework to cut out. I quickly refactored my jobs to call <code class="language-*">DB::reconnect();</code> prior to doing any database work. I pushed the change and went about my business.

A few hours later, I noticed my logs being flodded with exceptions coming from my job classes: <code class="language-*">MySQL server has gone away</code>. Strange, those jobs should have been re-establishing their DB connection every time they were fired. After re-reading the docs, I realized that the in-memory framework didn't have the change I previously pushed because I never restarted the daemon jobs... I tried to run <code class="language-*">php artisan queue:restart</code> and was greeted with the following error:

<pre class="language-*"><code class="language-*">  [InvalidArgumentException]               
  Command "queue:restart" is not defined.  
  Did you mean one of these?               
      queue:retry                          
      queue:listen                         
      queue:subscribe                      
      queue:work                           
      queue:flush                          
      queue:forget                         
      queue:failed                         
      queue:failed-table                   
                                           </code></pre>

Huh? I was running Laravel 4.2, and the docs clearly said that this command should be available in 4.2. I started digging through the framework source, and sure enough, the command did not exist. I tried googling for solutions in vain, until I found a page for a package called [Laravel 4 Down Safe](http://packalyst.com/packages/package/valorin/l4-down-safe). A line at the very bottom of the page caught my eye:

> Requires Laravel v4.2.5, and uses the ./artisan queue:restart command to trigger a daemon worker restart.

Maybe the restart command was introduced in version 4.2.5? I checked my minor version, and sure enough I was using 4.2.0. I changed my laravel version in composer.json from <code class="language-*">"laravel/framework": "4.2"</code> to <code class="language-*">"laravel/framework": "4.2.5"</code> and ran a <code class="language-*">composer update</code>. After that finished, I tried to run <code class="language-*">queue:restart</code> and it worked! After restarting the daemons, they correctly re-established their database connections.

The moral of the story is that instead of using explicit minor versions, always grab the latest: <code class="language-*">"laravel/framework": "4.2.*"</code>. Also, RTFM.
