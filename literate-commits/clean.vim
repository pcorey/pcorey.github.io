Go
;g/^commit/normal d}dd
;g/^---/d
;g/^index/d
;g/^diff/d
;g/^new file/d
;g/^\\ No newline/d
;g/^@@.*@@$/d
;g/^@@/exe "normal! dt@..dwc$ ...\<Esc>"
;g/^+++/exe "normal! dwd2li\<CR><pre class='language-javascriptDiff'><p class='information'>\<Esc>"
;g/pre class/exe "normal! A</p><code class='language-javascriptDiff'>\<Esc>"
;g/^    /normal! 0d4l
;g/^ # \w/normal! dl
;g/^\n    /exe "normal! o<pre class='language-javascript'><code class='language-javascript'>\<Esc>V}2<"
;g/pre class/exe "normal! }O</code></pre>"
gg;%s/`.\{-}`/\0{:.language-javascript}/g
