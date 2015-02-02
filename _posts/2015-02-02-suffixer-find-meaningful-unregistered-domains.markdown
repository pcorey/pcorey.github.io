---
layout: post
title:  "Suffixer! Find Meaningful Unregistered Domains"
date:   2015-02-02
categories:
---

Early last week I released a small web app, [Suffixer](http://www.suffixer.com)! The idea behind [Suffixer](http://www.suffixer.com) is to compile a database of all words that can be created with registerable Top Level Domains as their suffixes. You can then seach through that database and quickly determine if any of the resulting domains are available for registration.

Like most of my recent projects, [Suffixer](http://www.suffixer.com) was built with [Meteor](https://www.meteor.com/). You can find the source [on github](https://github.com/pcorey/suffixer).

## Building Suffixer's Database

[Suffixer](http://www.suffixer.com) was built using [data](http://tools.wmflabs.org/enwiktdefns/) from [Wiktionary](http://en.wiktionary.org/) and [Namecheap's](https://www.namecheap.com/) [API](https://www.namecheap.com/support/api/intro.aspx). I wrote a few custom [Meteor](https://www.meteor.com/) packages to help initially populate [Suffixer's](http://www.suffixer.com) database. The first, [pcorey:namecheap](https://github.com/pcorey/suffixer/tree/master/packages/pcorey:namecheap), is simply a wrapper around a modified version of [Chad Smith's](http://chadsresume.com/) [node-namecheap](https://github.com/chadsmith/node-namecheap) library. Another custom package, [pcorey:namecheap-tlds](https://github.com/pcorey/suffixer/tree/master/packages/pcorey:namecheap-tlds), exposes a [Meteor collection](http://docs.meteor.com/#/full/mongo_collection) which is populated with a call to the Namecheap's [getTldList](https://www.namecheap.com/support/api/methods/domains/get-tld-list.aspx) API method. A third package, [pcorey:wiktionary](), parses a [Wiktionary](https://www.wiktionary.org/) [tsv dump file](https://github.com/pcorey/suffixer/tree/master/packages/pcorey:wiktionary) and fills a collection with all relevant words.

None of these packages are currently published. If you would like to use any of them, let me know and I'll hapily make them available.

## Searching and Checking

Searching through the database is fairly straight forward thanks to [MongoDB's text search functionality](/2015/01/26/mongo-text-search-with-meteor/) and the power of Meteor's [Publish & Subscribe](http://docs.meteor.com/#/full/meteor_publish). Searching on the client is initiated through a [debounced](/2015/01/19/the-dangers-of-debouncing-meteor-subscriptions/) [subscription](https://github.com/pcorey/suffixer/blob/master/client/main.js#L15-L23). The server has a matching [publish method](https://github.com/pcorey/suffixer/blob/master/server/namecheap.js#L117-L124) that takes the search term as an argument (among other things):

<pre class="language-javascript"><code class="language-javascript">Meteor.publish('wiktionary-namecheap', function(suffix, definition, limit, hideRegistered, favorites) {
    var results = Wiktionary.find(
        getSelector(suffix, definition, hideRegistered, favorites),
        getOptions(limit));
    var domainMap = getDomainMap(results);
    checkAndUpdateDomains(domainMap);
    return results;
});
</code></pre>

This publish method does a few interesting things. First, it queries Mongo for any results matching the provided search term (<code class="language-*">definition</code>). Next, it loops through all of the results looking for any domains who's registration status is either unregistered or unknown. Those domains are passed to Namecheap's [check](https://www.namecheap.com/support/api/methods/domains/check.aspx) API, and the results of that call update the status of the corrresponding Mongo documents. The real magic is that while the API callback updating the Mongo documents is asynchronous, those changes are __automatically__ and __instantly__ pushed to the client. How cool is that?

## Known Problems and Lessons Learned

My goal with this project was to create a [Minimum Viable Product](http://en.wikipedia.org/wiki/Minimum_viable_product). That means that [Suffixer](http://www.suffixer.com) was released with a few issues:

### Static Data

Namecheap's <code class="language-*">getTldList</code> is only called when the database is first populated, and all words in the Wiktionary tsv not paired up to a Top Level Domain are excluded from the database. This means that if any new TLDs are made available by Namecheap in the future, the [Suffixer](http://www.suffixer.com) database would have to be wiped and rebuilt. A much better way to future-proof this functionality would be to store all Wiktionary entries in Mongo, along with the list of available TLDs. Periodically, <code class="language-*">getTldList</code> could be called, potentially updating the TLD collection and any new Wiktionary word matches. This would most likely require some schema re-working.

### Wikitext Is Hard

[Wikitext](http://meta.wikimedia.org/wiki/Help:Wikitext_examples) is hard. Specifically, correctly rendering wikitext [templates](http://meta.wikimedia.org/wiki/Help:Wikitext_examples#Templates) is hard. I looked into a [few](http://www.mediawiki.org/wiki/Parsoid) [different](https://github.com/joaomsa/txtwiki.js) [options](https://github.com/spencermountain/wtf_wikipedia) for rendering wikitext into plain text, but all of them fell short when it came to expanding templates. From what I've found, the only way to expand a template is to use [Wikipedia's API](http://www.mediawiki.org/wiki/API:Parsing_wikitext). Unfortunately, do to the huge number of wikitext entries I needed to parse, this wasn't a viable option. This version of [Suffixer](http://www.suffixer.com) leaves the unexpanded templates in the definition text. For the most part, they're human readable and add valuable context to the definitions.

## Final Thoughts

Overall, I'm happy with how the project turned out. I learned a good deal about Mongo and even more about Meteor. Meteor continues to be a very interesting and exciting platform to work with.

If you have any comments or suggestions about [Suffixer](http://www.suffixer.com), please let me know!