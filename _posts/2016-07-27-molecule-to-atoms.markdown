---
layout: post
title:  "Molecule to Atoms"
date:   2016-07-27
repo: "https://github.com/pcorey/molecule-to-atoms"
tags: ["literate-commits"]
---

# [Project Setup]({{page.repo}}/commit/8af0141e8ad499efe086b299e5f7c9cb5f48a7e8)

Today we're going to be tackling the [Molecule to Atom]({{page.repo}})
kata. The goal of this kata is to parse a string representation of a molecule into
its component elements, or atoms.

As always, the first step is to get our project set up. We'll be using
Mocha as our test runner and Babel for ES6 support.


<pre class='language-javascriptDiff'><p class='information'>.babelrc</p><code class='language-javascriptDiff'>
+{
+  "presets": ["es2015"]
+}
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>.gitignore</p><code class='language-javascriptDiff'>
+node_modules/
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>package.json</p><code class='language-javascriptDiff'>
+{
+  "main": "index.js",
+  "scripts": {
+    "test": "mocha ./test --compilers js:babel-register"
+  },
+  "dependencies": {
+    "babel-preset-es2015": "^6.9.0",
+    "babel-register": "^6.9.0",
+    "chai": "^3.5.0",
+    "lodash": "^4.12.0",
+    "mocha": "^2.4.5"
+  }
+}
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>test/index.js</p><code class='language-javascriptDiff'>
+import { expect } from "chai";
+
+describe("index", function() {
+
+    it("works");
+
+});
</code></pre>



# [Laying the Groundwork]({{page.repo}}/commit/f22620d0449856af339e5ba34825bdeb7fe88a6e)

The best place to start is at the beginning. We'll begin solving this
kata by writing the most basic test we can think of. We expect an empty
string to be parsed into an empty object:

<pre class='language-javascript'><code class='language-javascript'>
expect(parseMolecule("")).to.deep.equal({});
</code></pre>

After writing this test, it fails. `parseMolecule`{:.language-javascript} is not defined. We
can quickly remedy this by importing `parseMolecule`{:.language-javascript} into our
test file and then exporting it from our main module.

Lastly, we need `parseMolecule`{:.language-javascript} to return an empty object. Just like
that, our tests are green.


<pre class='language-javascriptDiff'><p class='information'>index.js</p><code class='language-javascriptDiff'>
+export function parseMolecule(formula) {
+    return {};
+}
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>test/index.js</p><code class='language-javascriptDiff'>
 import { expect } from "chai";
+import { parseMolecule } from "../index";
 
-describe("index", function() {
+describe("Molecule to Atoms", function() {
 
-    it("works");
+    it("it parses a molecule", () => {
+        expect(parseMolecule("")).to.deep.equal({});
+    });
 
</code></pre>



# [Introducing Our Abstractions]({{page.repo}}/commit/cde856ec5e72c71e4776723ce783a7b1671fa85f)

Know this solution is going to get complex fairly quickly, we'd
like to leverage some abstractions to make it more testable and
maintainable.

The most obvious abstraction we can think of is a `molecule`{:.language-javascript}. We create
a `molecule`{:.language-javascript} by passing in a `formula`{:.language-javascript}. From there, we can call `parse`{:.language-javascript}
to get an object-based representation of the molecule.

We can rewrite our `parseMolecule`{:.language-javascript} function to use `molecule`{:.language-javascript} in a clean
way.


<pre class='language-javascriptDiff'><p class='information'>index.js</p><code class='language-javascriptDiff'>
+export function molecule(formula) {
+    function parse() {
+        return {};
+    }
+
+    return {
+        parse
+    };
+}
+
 export function parseMolecule(formula) {
-    return {};
+    return molecule(formula).parse();
 }
</code></pre>



# [Testing Hydrogen]({{page.repo}}/commit/746013a7d51ebfad523a4a781ee5fc1305894f89)

Let's add a new test case:

<pre class='language-javascript'><code class='language-javascript'>
expect(parseMolecule("H")).to.deep.equal({ H: 1 });
</code></pre>

This test fails. It's expecting `{}`{:.language-javascript} to equal `{ H: 1 }`{:.language-javascript}.

The fastest way we can get ourselves to green is to return an object
that maps the provided `formula`{:.language-javascript} to `1`{:.language-javascript}.

<pre class='language-javascript'><code class='language-javascript'>
return {
    [formula]: 1
};
</code></pre>

After making this change, our first test fails. We now need to
explicitly handle this base case:

<pre class='language-javascript'><code class='language-javascript'>
if (!formula) {
    return {};
}
</code></pre>

And now we're back to green again.


<pre class='language-javascriptDiff'><p class='information'>index.js</p><code class='language-javascriptDiff'>
 ...
     function parse() {
-        return {};
+        if (!formula) {
+            return {};
+        }
+        return {
+            [formula]: 1
+        };
     }
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>test/index.js</p><code class='language-javascriptDiff'>
 ...
     expect(parseMolecule("")).to.deep.equal({});
+        expect(parseMolecule("H")).to.deep.equal({ H: 1 });
 });
</code></pre>



# [Multiple Elements]({{page.repo}}/commit/5da65e13c93c736c14e255b91b608cd0ccfcee4d)

Next we'll move onto parsing a molecule with multiple types of elements.
Let's try to parse `"HMg"`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
expect(parseMolecule("HMg")).to.deep.equal({ H: 1, Mg: 1 });
</code></pre>

As expected, this test fails. `parse`{:.language-javascript} is returning `{ HMg: 1 }`{:.language-javascript}, rather
than correctly splitting `"H"`{:.language-javascript} and `"Mg"`{:.language-javascript}.

To fix this, we'll need to implement a new method on `molecule`{:.language-javascript} that
will split a formula into a number of parts. We'll start things off by
splitting formulas into its component elements:

<pre class='language-javascript'><code class='language-javascript'>
formula.match(/[A-Z][a-z]*/g) || [];
</code></pre>

The `|| []`{:.language-javascript} default is required to keep our base case of parsing `""`{:.language-javascript}
happy.

After rewriting `parse`{:.language-javascript} to use this new `parts`{:.language-javascript} method to assemble the
molecule object, our tests flip back to green.


<pre class='language-javascriptDiff'><p class='information'>index.js</p><code class='language-javascriptDiff'>
 export function molecule(formula) {
+    function parts() {
+        return formula.match(/[A-Z][a-z]*/g) || [];
+    }
+
     function parse() {
-        if (!formula) {
-            return {};
-        }
-        return {
-            [formula]: 1
-        };
+        return parts().reduce((result, part) => {
+            result[part] = 1;
+            return result;
+        }, {});
     }
 ...
     return {
-        parse
+        parse,
+        parts
     };
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>test/index.js</p><code class='language-javascriptDiff'>
 import { expect } from "chai";
-import { parseMolecule } from "../index";
+import { parseMolecule, molecule } from "../index";
 
 ...
     expect(parseMolecule("H")).to.deep.equal({ H: 1 });
+        expect(parseMolecule("HMg")).to.deep.equal({ H: 1, Mg: 1 });
+    });
+
+    describe("molecule", () => {
+        it("splits a formula into parts", () => {
+            expect(molecule("HMg").parts()).to.deep.equal(["H", "Mg"]);
+        });
     });
</code></pre>



# [Compiling Parts]({{page.repo}}/commit/7937320430dd466f718aa7df760194e51c044f99)

Things are getting more complicated. Instead of just breaking apart our
`formula`{:.language-javascript} and looking for elements, we need to look for pairs of
elements and their corresponding `count`{:.language-javascript}, or ratio in the molecule.

A nice way to do this is using regular expression match groups and ES6
pattern matching. We can define our regex, and wrap the element and
optional count in match groups:

<pre class='language-javascript'><code class='language-javascript'>
let regex = /([A-Z][a-z]*)(\d*)/g;
</code></pre>

As we iterate over our regex matches, we can destructure the result
into its corresponding `element`{:.language-javascript} and `count`{:.language-javascript} pair.

Finally, we refactored `parts`{:.language-javascript} to return an object with `part`{:.language-javascript} and
`count`{:.language-javascript} keys to keep things explicit. Thinking ahead, I think this might
come in handy when we need to deal with nested expressions.


<pre class='language-javascriptDiff'><p class='information'>index.js</p><code class='language-javascriptDiff'>
 ...
 function parts() {
-        return formula.match(/[A-Z][a-z]*/g) || [];
+        let parts, results = [];
+        let regex = /([A-Z][a-z]*)(\d*)/g;
+        while (parts = regex.exec(formula)) {
+            let [_, part, count] = parts;
+            results.push({
+                part,
+                count: parseInt(count) || 1
+            });
+        }
+        return results;
 }
 ...
 function parse() {
-        return parts().reduce((result, part) => {
-            result[part] = 1;
+        return parts().reduce((result, {part, count}) => {
+            result[part] = count;
         return result;
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>test/index.js</p><code class='language-javascriptDiff'>
 ...
         expect(parseMolecule("HMg")).to.deep.equal({ H: 1, Mg: 1 });
+        expect(parseMolecule("H2Mg")).to.deep.equal({ H: 2, Mg: 1 });
     });
 ...
         it("splits a formula into parts", () => {
-            expect(molecule("HMg").parts()).to.deep.equal(["H", "Mg"]);
+            expect(molecule("HMg").parts()).to.deep.equal([
+                { part: "H", count: 1 },
+                { part: "Mg", count: 1 },
+            ]);
         });
</code></pre>



# [Fixing an Edge Case]({{page.repo}}/commit/2c42b6ac79e66bab389b1447b6a419f3178e0139)

One thing I noticed while looking over our solution is that it
did not support multiple instances of the same element in a molecule.
For example, with `"HMgH"`{:.language-javascript}, the last `"H"`{:.language-javascript} element would override the
previous.

I added a test to confirm my suspicions, and quickly fixed the problem.
Instead of overriding the element in the `result`{:.language-javascript} object with `count`{:.language-javascript},
increment it (if it exists) by `count`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
result[part] = ~~result[part] + count;
</code></pre>

The `~~`{:.language-javascript} operator is rarely seen, but it's an incredibly useful
operator. In this case, if `result[part]`{:.language-javascript} is undefined, it will be
converted to `0`{:.language-javascript}, preventing a `NaN`{:.language-javascript} result from our addition.


<pre class='language-javascriptDiff'><p class='information'>index.js</p><code class='language-javascriptDiff'>
 ...
         return parts().reduce((result, {part, count}) => {
-            result[part] = count;
+            result[part] = ~~result[part] + count;
             return result;
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>test/index.js</p><code class='language-javascriptDiff'>
 ...
         expect(parseMolecule("H2Mg")).to.deep.equal({ H: 2, Mg: 1 });
+        expect(parseMolecule("H2MgH")).to.deep.equal({ H: 3, Mg: 1 });
     });
</code></pre>



# [Beginning Nested Expressions]({{page.repo}}/commit/b7beb6c1025a3336df58fefc61c6df39d8487898)

Next up on our feature todo list is adding support for nested
expressions. A simple nested expressions to get us going could be
`"[H]Mg"`{:.language-javascript}. Let's set our expectations with a test:

<pre class='language-javascript'><code class='language-javascript'>
expect(parseMolecule("[H]Mg")).to.deep.equal({ H: 1, Mg: 1 });
</code></pre>

Now each "part" in our `parts`{:.language-javascript} method could be either an element, or a
nested expressions within square brackets. Let's update our regular
expression to reflect that:

<pre class='language-javascript'><code class='language-javascript'>
let regex = /(\[(.*)\]|([A-Z][a-z]*))(\d*)/g;
</code></pre>

Thanks to the magic of match groups and destructing, we can assign the
nested expression (if it exists) to `square`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
let [_, __, square, part, count] = parts;
</code></pre>

Finally, if `square`{:.language-javascript} exists, let's recursively process the nested
expression and append its `parts`{:.language-javascript} onto our list of `results`{:.language-javascript}.

With those changes, our tests flip back to green. Beautiful.


<pre class='language-javascriptDiff'><p class='information'>index.js</p><code class='language-javascriptDiff'>
 ...
     let parts, results = [];
-        let regex = /([A-Z][a-z]*)(\d*)/g;
+        let regex = /(\[(.*)\]|([A-Z][a-z]*))(\d*)/g;
         while (parts = regex.exec(formula)) {
-            let [_, part, count] = parts;
-            results.push({
-                part,
-                count: parseInt(count) || 1
-            });
+            let [_, __, square, part, count] = parts;
+            if (square) {
+                let nested = molecule(square).parts();
+                results = results.concat(nested);
+            }
+            else {
+                results.push({
+                    part,
+                    count: parseInt(count) || 1
+                });
+            }
         }
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>test/index.js</p><code class='language-javascriptDiff'>
 ...
         expect(parseMolecule("H2MgH")).to.deep.equal({ H: 3, Mg: 1 });
+        expect(parseMolecule("[H]Mg")).to.deep.equal({ H: 1, Mg: 1 });
 });
</code></pre>



# [Refactoring]({{page.repo}}/commit/91b6ba9114b8837f5b92c7fff6a250a5c3f6f224)

Looking forward, the next feature we'll want to support is using ratios,
or `count`{:.language-javascript} on nested expressions. This means that we'll need some notion
of "multiplying" molecules by some `count`{:.language-javascript}.

I imagine calling `molcule(...).multiply(2)`{:.language-javascript} would return a new
`molecule`{:.language-javascript}. This means that `multiply`{:.language-javascript} will need access to our parsed
interpretation of the `formula`{:.language-javascript}.

We could have `multiply`{:.language-javascript} call `parts`{:.language-javascript}, multiply each element by `count`{:.language-javascript},
serialize the result back into a formula and then create and return a
new `molecule`{:.language-javascript}, but that's a very roundabout way of doing things.

Instead, let's define an internal `_parts`{:.language-javascript} list that's created every
time a `molecule`{:.language-javascript} is created. The `parts`{:.language-javascript} method will simply return
`_parts`{:.language-javascript}, and `multiply`{:.language-javascript} will be able to modify `_parts`{:.language-javascript} directly.

After doing our refactoring, all of our tests are still passing. We're
safe.


<pre class='language-javascriptDiff'><p class='information'>index.js</p><code class='language-javascriptDiff'>
 export function molecule(formula) {
-    function parts() {
-        let parts, results = [];
-        let regex = /(\[(.*)\]|([A-Z][a-z]*))(\d*)/g;
-        while (parts = regex.exec(formula)) {
-            let [_, __, square, part, count] = parts;
-            if (square) {
-                let nested = molecule(square).parts();
-                results = results.concat(nested);
-            }
-            else {
-                results.push({
-                    part,
-                    count: parseInt(count) || 1
-                });
-            }
+    let _parts = [];
+
+    let matches;
+    let regex = /(\[(.*)\]|([A-Z][a-z]*))(\d*)/g;
+    while (matches = regex.exec(formula)) {
+        let [_, __, square, part, count] = matches;
+        if (square) {
+            let nested = molecule(square).parts();
+            _parts = _parts.concat(nested);
+        }
+        else {
+            _parts.push({
+                part,
+                count: parseInt(count) || 1
+            });
         }
-        return results;
+    }
+
+    function parts() {
+        return _parts;
     }
</code></pre>



# [Multiplying Nested Expressions]({{page.repo}}/commit/7c413bd145b0fa46226be75d97df26b9f1054aa6)

With that refactor out of the way, we can easily implement `multiply`{:.language-javascript}.
To give ourselves an explicit objective, let's write a test first:

<pre class='language-javascript'><code class='language-javascript'>
expect(molecule("H").multiply(2).parse()).to.deep.equal({ H: 2 });
</code></pre>

Implementing `multiply`{:.language-javascript} is straight forward. We just loop over each of
the `_parts`{:.language-javascript} of the molecule, multiplying its `count`{:.language-javascript} by the provided
`count`{:.language-javascript}. Finally, we return `this`{:.language-javascript}, so calls to `molecule`{:.language-javascript} methods can
be chained together.

Next, let's write a test for handling ratios on nested expressions:

<pre class='language-javascript'><code class='language-javascript'>
expect(parseMolecule("[HO]2Mg")).to.deep.equal({ H: 2, O: 2, Mg: 1 });
</code></pre>

This test fails, as expected, but it's not difficult to get our suite
back to green. We just need to build our `nested`{:.language-javascript} molecule, `multiply`{:.language-javascript}
is by its corresponding `count`{:.language-javascript}, and finally append its `parts`{:.language-javascript} onto our
results array.


<pre class='language-javascriptDiff'><p class='information'>index.js</p><code class='language-javascriptDiff'>
 ...
         let [_, __, square, part, count] = matches;
+        count = parseInt(count) || 1;
         if (square) {
-            let nested = molecule(square).parts();
-            _parts = _parts.concat(nested);
+            let nested = molecule(square).multiply(count);
+            _parts = _parts.concat(nested.parts());
         }
 ...
             part,
-                count: parseInt(count) || 1
+                count
             });
 ...
 
+    function multiply(count) {
+        _parts.forEach((part) => {
+            part.count *= count;
+        });
+        return this;
+    }
+
     function parts() {
 ...
         parse,
-        parts
+        parts,
+        multiply
     };
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>test/index.js</p><code class='language-javascriptDiff'>
 ...
         expect(parseMolecule("[H]Mg")).to.deep.equal({ H: 1, Mg: 1 });
+        expect(parseMolecule("[HO]2Mg")).to.deep.equal({ H: 2, O: 2, Mg: 1 });
 });
 ...
         });
+        it("multiplies an object", () => {
+            expect(molecule("H").multiply(2).parse()).to.deep.equal({ H: 2 });
+        });
     });
</code></pre>



# [Regex Woes]({{page.repo}}/commit/31f05757dfafc05264d48c99fbe2292fa6fa3773)

Unfortunately, there's a big problem with our solution. Our regex
(`\[.*\]`{:.language-javascript}) is looking for opening and closing brackets and assuming that
everything within them are a nested expression.

This assumption breaks down when we have two nested expressions in the
same formula, like `"[H]O[H]"`{:.language-javascript}. Our regex will match on the first and
very last square brackets, returning `"H]O[H"`{:.language-javascript} as the nested expression.
We can write this as a test to see the failure in action:

<pre class='language-javascript'><code class='language-javascript'>
expect(molecule("[H]2O[H]").parts()).to.deep.equal([
    { part: "H", count: 2 },
    { part: "O", count: 1 },
    { part: "H", count: 1 }
]);
</code></pre>

Switching to a non-greedy regex (`\[.*?\]`{:.language-javascript}) would still fail, but this
time on nested subexpressions, like `"[H[O]]"`{:.language-javascript}.

We need a better way to parse out our formula parts.

Our new solution uses a regex to match on all opening brackets, closing
brackets, and elements with a trailing count:

<pre class='language-javascript'><code class='language-javascript'>
let regex = /((\[)|(\])|([A-Z][a-z]*))(\d*)/g;
</code></pre>

Every time we encounter an opening bracket, we push a new formula onto
our new `stack`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
if (open) {
    stack.push({
        formula: ""
    });
}
</code></pre>

A non-empty stack means that we're collecting the pieces of a nested
expression. That means we should just append any elements and counts we
find to that sub-expression's formula:

<pre class='language-javascript'><code class='language-javascript'>
else if (stack.length) {
    stack[stack.length - 1].formula += part + count;
}
</code></pre>

Finally, whenever we encounter a closing bracket, we want to create a
new `molecule`{:.language-javascript} out of the nested expression we just collected, and
appends its `parts`{:.language-javascript} onto our list of `parts`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
else if (close) {
    let nested = molecule(stack.pop().formula).multiply(count);
    _parts = _parts.concat(nested.parts());
}
</code></pre>

Now we're properly processing sub-expressions and our tests return to
green.


<pre class='language-javascriptDiff'><p class='information'>index.js</p><code class='language-javascriptDiff'>
 ...
     let matches;
-    let regex = /(\[(.*)\]|([A-Z][a-z]*))(\d*)/g;
+    let stack = [];
+    let regex = /((\[)|(\])|([A-Z][a-z]*))(\d*)/g;
     while (matches = regex.exec(formula)) {
-        let [_, __, square, part, count] = matches;
+        let [_, __, open, close, part, count] = matches;
         count = parseInt(count) || 1;
-        if (square) {
-            let nested = molecule(square).multiply(count);
+        if (open) {
+            stack.push({
+                formula: ""
+            });
+        }
+        else if (close) {
+            let nested = molecule(stack.pop().formula).multiply(count);
             _parts = _parts.concat(nested.parts());
         }
+        else if (stack.length) {
+            stack[stack.length - 1].formula += part + count;
+        }
         else {
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>test/index.js</p><code class='language-javascriptDiff'>
 ...
             ]);
+            expect(molecule("[H]2O[H]").parts()).to.deep.equal([
+                { part: "H", count: 2 },
+                { part: "O", count: 1 },
+                { part: "H", count: 1 }
+            ]);
         });
</code></pre>



# [Alternate Groupings and Bug Fixes]({{page.repo}}/commit/b4f9566b1f45b4faf762cd3dd39ea2990946b09d)

Last up on our feature list is the ability to use parentheses and curly
brackets in addition to square brackets as sub-expression dividers.

We can add a test for this:

<pre class='language-javascript'><code class='language-javascript'>
expect(parseMolecule("K4{ON(SO3)2}2")).to.deep.equal({K: 4, O: 14, N: 2, S: 4});
</code></pre>

The most straight-forward way to accomplish this is to just replace all
`"{"`{:.language-javascript} and `"("`{:.language-javascript} characters with `"["`{:.language-javascript}, and `"}"`{:.language-javascript} and `")"`{:.language-javascript} characters
with `"]"`{:.language-javascript} in our `formula`{:.language-javascript}:

<pre class='language-javascript'><code class='language-javascript'>
formula.replace(/[{(]/g, "[").replace(/[})]/g, "]");
</code></pre>

Unfortunately, this test also exposed another bug in our solution. it
looks like counts on sub-expressions aren't being applied to other
nested expressions.

We can fix this by giving our `stack`{:.language-javascript} a bit more state. In addition to
building up our current expressions's `formula`{:.language-javascript} as we go, we also want
to keep track of any nested `molecules`{:.language-javascript} we encounter, so we can multiply
them by our `count`{:.language-javascript}.

After making this change, all of our tests pass.


<pre class='language-javascriptDiff'><p class='information'>index.js</p><code class='language-javascriptDiff'>
 ...
 
+    formula = formula.replace(/[{(]/g, "[").replace(/[})]/g, "]");
+
     let matches;
 ...
             stack.push({
-                formula: ""
+                formula: "",
+                molecules: []
             });
 ...
         else if (close) {
-            let nested = molecule(stack.pop().formula).multiply(count);
-            _parts = _parts.concat(nested.parts());
+            let popped = stack.pop();
+            popped.molecules.push(molecule(popped.formula));
+            popped.molecules.forEach((molecule) => {
+                molecule.multiply(count);
+            });
+            if (!stack.length) {
+                popped.molecules.forEach((molecule) => {
+                    _parts = _parts.concat(molecule.parts());
+                });
+            }
+            else {
+                let last = stack[stack.length - 1];
+                last.molecules = last.molecules.concat(popped.molecules);
+            }
         }
</code></pre>

<pre class='language-javascriptDiff'><p class='information'>test/index.js</p><code class='language-javascriptDiff'>
 ...
         expect(parseMolecule("[HO]2Mg")).to.deep.equal({ H: 2, O: 2, Mg: 1 });
+        expect(parseMolecule("K4{ON(SO3)2}2")).to.deep.equal({K: 4, O: 14, N: 2, S: 4});
+        expect(parseMolecule("{[Co(NH3)4(OH)2]3Co}(SO4)3")).to.deep.equal({
+            Co: 4,
+            N: 12,
+            H: 42,
+            O: 18,
+            S: 3
+        });
     });
</code></pre>


# Final Thoughts

This was a doozy of a kata. 

All in all, there are a lot of ideas flying around here and I fear I didn’t explain myself as well as I could have. Balancing trying to keep things as concise, while staying true to the intent of explaining every change is definitely a challenge.

The limitations of regular expressions are explored in this problem was well. Initially, a totally regex based solution seemed like a good approach, but the nested structure of our data made regexes difficult to use.

When using regexes, it’s always important to keep in mind that there are entire classes of problem where they’re simply not suitable.

Finally, my final solution isn’t as clean and clear as I would have liked. By the time I landed on a working solution, I feared that more refactor commits would have muddied the water. In future problems, I need to focus on refactoring sooner and more often.
