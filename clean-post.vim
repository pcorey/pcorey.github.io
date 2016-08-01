gg:%s/\t/    /g
gg:%s/’/'/g
gg:%s/“/"/g
gg:%s/”/"/g
:g/^\n    /exe "normal! o<pre class='language-javascript'><code class='language-javascript'>\<Esc>"
:g/pre class/exe "normal! }O</code></pre>"
:g/pre class/exe "normal! V}2<"
gg:%s/`.\{-}`/\0{:.language-javascript}/g
