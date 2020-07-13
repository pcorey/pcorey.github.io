(this.webpackJsonpchord_react = this.webpackJsonpchord_react || []).push([
  [0],
  {
    207: function (e, t, n) {
      var a = n(193),
        r = ["workerGetSubstitutions"];
      e.exports = function () {
        var e = new Worker(n.p + "b980ccea7b0c5037aeb4.worker.js", {
          name: "[hash].worker.js",
        });
        return a(e, r), e;
      };
    },
    217: function (e, t, n) {
      e.exports = n(391);
    },
    389: function (e, t, n) {
      var a = n(193),
        r = ["workerGetVoicings"];
      e.exports = function () {
        var e = new Worker(n.p + "bc3631a90f420b96dbf4.worker.js", {
          name: "[hash].worker.js",
        });
        return a(e, r), e;
      };
    },
    390: function (e, t, n) {},
    391: function (e, t, n) {
      "use strict";
      n.r(t),
        n.d(t, "workerGetVoicings", function () {
          return ee;
        });
      var a = n(18),
        r = n(27),
        i = n.n(r),
        o = n(40);
      Boolean(
        "localhost" === window.location.hostname ||
          "[::1]" === window.location.hostname ||
          window.location.hostname.match(
            /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
          )
      );
      var c = n(21),
        u = n(5),
        s = n(19),
        l = (n(90), n(0)),
        f = n.n(l),
        b = n(1),
        m = n.n(b),
        h = function (e) {
          var t =
            e.backingStorePixelRatio ||
            e.webkitBackingStorePixelRatio ||
            e.mozBackingStorePixelRatio ||
            e.msBackingStorePixelRatio ||
            e.oBackingStorePixelRatio ||
            e.backingStorePixelRatio ||
            1;
          return (window.devicePixelRatio || 1) / t;
        },
        d = n(20);
      function p() {
        var e = Object(s.a)([
          "\n  width: 0;\n  height: 0;\n  border-left: 1rem solid transparent;\n  border-right: 1rem solid transparent;\n  border-bottom: 1rem solid #eee;\n",
        ]);
        return (
          (p = function () {
            return e;
          }),
          e
        );
      }
      function v() {
        var e = Object(s.a)([
          "\n  width: 100%;\n  height: 100%;\n  margin-bottom: 1rem;\n  cursor: pointer;\n",
        ]);
        return (
          (v = function () {
            return e;
          }),
          e
        );
      }
      function g() {
        var e = Object(s.a)([
          "\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: space-between;\n",
        ]);
        return (
          (g = function () {
            return e;
          }),
          e
        );
      }
      d.a.div(g()),
        d.a.canvas(v()),
        d.a.div(p()),
        n(401),
        n(53),
        n(399),
        n(400),
        n(222);
      m.a
        .chain(m.a.range(3, 13))
        .flatMap(function (e) {
          return m.a.combinations(["1", "3", "5", "7", "9", "11", "13"], e);
        })
        .size()
        .value();
      var y = function (e) {
          switch (e) {
            case "1":
              return 0;
            case "b2":
            case "b9":
              return 1;
            case "2":
            case "9":
              return 2;
            case "b3":
            case "#9":
              return 3;
            case "3":
              return 4;
            case "4":
            case "11":
              return 5;
            case "#4":
            case "#11":
            case "b5":
              return 6;
            case "5":
              return 7;
            case "#5":
            case "b6":
            case "b13":
              return 8;
            case "6":
            case "bb7":
            case "13":
              return 9;
            case "b7":
              return 10;
            case "7":
              return 11;
            default:
              console.warn('Unrecognized degree "'.concat(e, '".'));
          }
        },
        j = m.a
          .chain([
            ["maj", "1 3 5"],
            ["6", "1 3 (5) 6"],
            ["maj/9", "1 3 (5) 9"],
            ["6/9", "(1) 3 (5) 6 9"],
            ["sus4", "1 4 5"],
            ["sus2", "1 2 5"],
            ["maj7", "(1) 3 (5) 7"],
            ["maj9", "(1) 3 (5) 7 9"],
            ["maj11", "(1) (3) (5) 7 (9) 11"],
            ["maj13", "(1) 3 (5) 7 (9) (11) 13"],
            ["maj7/6", "(1) 3 (5) 6 7"],
            ["maj7#5", "(1) 3 #5 7"],
            ["maj9#5", "(1) 3 #5 7 9"],
            ["/#11", "1 3 (5) #11"],
            ["maj7/#11", "(1) 3 (5) 7 #11"],
            ["maj7#9#11", "(1) 3 (5) 7 #9 #11"],
            ["maj9#11", "(1) 3 (5) 7 9 #11"],
            ["maj13#11", "(1) 3 (5) 7 9 #11 13"],
            ["sus2/#11", "(1) 2 5 #11"],
            ["/9#11", "(1) 3 (5) 9 #11"],
            ["maj7/6#11", "(1) 3 (5) 6 7 #11"],
            ["6/9#11", "(1) 3 (5) 6 9 #11"],
            ["6/b9#11", "(1) 3 (5) 6 b9 #11"],
            ["maj7/6#9b5", "(1) 3 b5 6 7 #9"],
            ["6/#11", "(1) 3 (5) 6 #11"],
            ["m", "1 b3 5"],
            ["m/9", "(1) b3 (5) 9"],
            ["mM7", "(1) b3 (5) 7"],
            ["mM9", "(1) b3 (5) 7 9"],
            ["m7", "(1) b3 (5) b7"],
            ["m7b5", "(1) b3 b5 b7"],
            ["m7/11", "(1) b3 (5) b7 11"],
            ["m9", "(1) b3 (5) b7 9"],
            ["m11", "(1) b3 (5) b7 9 11"],
            ["m6", "(1) b3 5 6"],
            ["m6/9", "(1) b3 (5) 6 9"],
            ["m13", "(1) b3 (5) b7 9 (11) 13"],
            ["m7/6/11", "(1) b3 (5) 6 b7 11"],
            ["m7/6", "(1) b3 (5) 6 b7"],
            ["mM7/6/9", "(1) b3 (5) 6 7 9"],
            ["m13/#11", "(1) b3 (5) b7 9 #11 13"],
            ["m6/9/11", "(1) b3 (5) 6 b7 9 11"],
            ["m6/9/#11", "(1) b3 (5) 6 9 #11"],
            ["mM7/6", "(1) b3 (5) 6 7"],
            ["mM7/9/11", "(1) b3 (5) 7 9 11"],
            ["mM7/11", "(1) b3 (5) 7 11"],
            ["m7b9", "(1) b3 (5) b7 b9"],
            ["m6/11", "(1) b3 (5) 6 11"],
            ["7", "(1) 3 (5) b7"],
            ["7b9", "(1) 3 (5) b7 b9"],
            ["dim7", "(1) b3 b5 6"],
            ["7#9", "(1) 3 (5) b7 #9"],
            ["7#9#5", "(1) 3 #5 b7 #9"],
            ["m7#5", "(1) b3 #5 b7"],
            ["7b5", "(1) 3 b5 b7"],
            ["7/6", "(1) 3 (5) 6 b7"],
            ["7/6/11", "(1) 3 (5) 6 b7 11"],
            ["9", "(1) 3 (5) b7 9"],
            ["13", "(1) 3 (5) b7 (9) (11) 13"],
            ["7sus", "1 4 (5) b7"],
            ["7/6sus", "(1) 4 (5) 6 b7"],
            ["7/11", "(1) 3 (5) b5 11"],
            ["13b9", "(1) 3 (5) b7 b9 (11) 13"],
            ["11", "(1) (3) (5) b7 (9) 11"],
            ["13sus", "(1) 4 (5) b7 9 (11) 13"],
            ["7b9#5", "(1) 3 #5 b7 b9"],
            ["7#5", "(1) 3 #5 b7"],
            ["7b9b5", "(1) 3 b5 b7 b9"],
            ["7b9#11", "(1) 3 (5) b7 b9 #11"],
            ["7#9b5", "(1) 3 b5 b7 #9"],
            ["13#9", "(1) 3 (5) b7 #9 (11) 13"],
            ["13#11", "(1) 3 (5) b7 9 #11 13"],
            ["11b9", "(1) 3 (5) b7 b9 11"],
            ["11b9#5", "(1) 3 #5 b7 b9 11"],
            ["11#5", "(1) 3 #5 b7 9 11"],
            ["6#9", "(1) 3 (5) 6 b7 #9"],
            ["9b5", "(1) 3 b5 b7 9"],
            ["9#5", "(1) 3 #5 b7 9"],
            ["9#5b5", "(1) 3 #5 b5 b7 9"],
            ["#11", "(1) 3 (5) b7 9 #11"],
            ["aug", "1 3 #5"],
            ["7/#11", "(1) 3 (5) b7 #11"],
            ["dim", "1 b3 b5"],
          ])
          .flatMap(function (e) {
            var t = Object(u.a)(e, 2),
              n = t[0],
              a = t[1],
              r = m.a
                .chain(a)
                .split(/\s+/)
                .map(function (e) {
                  return m.a.trim(e, "()");
                })
                .value(),
              i = m.a
                .chain(a)
                .split(/\s+/)
                .filter(function (e) {
                  return m.a.startsWith(e, "(");
                })
                .map(function (e) {
                  return m.a.trim(e, "()");
                })
                .value();
            return m.a
              .chain(m.a.range(m.a.size(i) + 1))
              .flatMap(function (e) {
                return m.a.combinations(i, e);
              })
              .map(function (e) {
                var t = m.a
                    .chain(e)
                    .map(function (e) {
                      return "no ".concat(m.a.replace(e, /#|b/, ""));
                    })
                    .join(" ")
                    .value(),
                  a = m.a.without.apply(m.a, [r].concat(Object(c.a)(e))),
                  i = m.a.join(a, " "),
                  o = m.a.trim("".concat(n, " ").concat(t)),
                  u = (function (e) {
                    return m.a
                      .chain(e)
                      .map(y)
                      .thru(function (e) {
                        return m.a.size(e) !==
                          m.a.chain(e).uniq().size().value()
                          ? void 0
                          : e;
                      })
                      .value();
                  })(a),
                  s = m.a.find(r, function (e) {
                    return "3" === e;
                  }),
                  l = m.a.find(r, function (e) {
                    return "b3" === e;
                  }),
                  f = m.a.find(r, function (e) {
                    return "7" === e;
                  }),
                  b = m.a.find(r, function (e) {
                    return "b7" === e;
                  }),
                  h =
                    s && f
                      ? "major"
                      : s && b
                      ? "dominant"
                      : l
                      ? "minor"
                      : void 0,
                  d = {
                    alterations: m.a.filter(r, function (e) {
                      return (
                        (e.includes("#") || e.includes("b")) &&
                        !m.a.includes(["b3", "b7"], e)
                      );
                    }),
                    name: o,
                    degrees: a,
                    formula: i,
                    parent: r,
                    missing: e,
                    quality: u,
                    family: h,
                  };
                return (d.value = JSON.stringify(d)), d;
              })
              .value();
          })
          .reject(function (e) {
            var t = e.degrees;
            return m.a.size(t) < 3;
          })
          .reject(function (e) {
            var t = e.degrees;
            return m.a.size(t) > 6;
          })
          .tap(function (e) {
            return console.log(
              "Generated ".concat(m.a.size(e), " chord qualities. *whew*")
            );
          })
          .value(),
        O = m.a.fromPairs([
          ["C", 0],
          ["C#", 1],
          ["Db", 1],
          ["D", 2],
          ["D#", 3],
          ["Eb", 3],
          ["E", 4],
          ["F", 5],
          ["F#", 6],
          ["Gb", 6],
          ["G", 7],
          ["G#", 8],
          ["Ab", 8],
          ["A", 9],
          ["A#", 10],
          ["Bb", 10],
          ["B", 11],
        ]),
        S = [
          {
            id: "Chord Chemistry 11.I",
            description: f.a.createElement(
              "span",
              null,
              f.a.createElement(
                "blockquote",
                null,
                "For basic major, minor, or dominant 7th chords, any extension may theoretically be substituted.",
                f.a.createElement(
                  "footer",
                  null,
                  "\u2014",
                  " ",
                  f.a.createElement(
                    "a",
                    { href: "https://amzn.to/2YQ8xYM" },
                    "Ted Greene in ",
                    f.a.createElement("em", null, "Chord Chemistry")
                  )
                )
              )
            ),
            test: function (e, t, n, a, r, i) {
              var o = a.family,
                c = (a.name, a.degrees, a.alterations);
              return n === r && o === i.family && m.a.isEqual(c, i.alterations);
            },
          },
          {
            id: "Chord Chemistry 11.IIIa",
            description: f.a.createElement(
              "span",
              null,
              f.a.createElement(
                "blockquote",
                null,
                "Dominant chords with altered tones ... can be used effectively ... when the ",
                f.a.createElement("em", null, "next"),
                " chord is ... one whose root is a 4th higher.",
                f.a.createElement(
                  "footer",
                  null,
                  "\u2014",
                  " ",
                  f.a.createElement(
                    "a",
                    { href: "https://amzn.to/2YQ8xYM" },
                    "Ted Greene in ",
                    f.a.createElement("em", null, "Chord Chemistry")
                  )
                )
              )
            ),
            test: function (e, t, n, a, r, i, o) {
              var c = a.family,
                u = (a.name, a.degrees, a.alterations);
              return (
                O[m.a.get(o, "root")] === (O[n] + 5) % 12 &&
                "dominant" === c &&
                !m.a
                  .chain(u)
                  .intersection(["b5", "#5", "b9", "#9"])
                  .isEmpty()
                  .value()
              );
            },
          },
          {
            id: "Chord Chemistry 11.IIIb",
            description: f.a.createElement(
              "span",
              null,
              f.a.createElement(
                "blockquote",
                null,
                "Dominant chords with altered tones ... can be used effectively ... when the ",
                f.a.createElement("em", null, "next"),
                " chord is ... one whose root is a 1/2 step lower.",
                f.a.createElement(
                  "footer",
                  null,
                  "\u2014",
                  " ",
                  f.a.createElement(
                    "a",
                    { href: "https://amzn.to/2YQ8xYM" },
                    "Ted Greene in ",
                    f.a.createElement("em", null, "Chord Chemistry")
                  )
                )
              )
            ),
            test: function (e, t, n, a, r, i, o) {
              var c = a.family,
                u = (a.name, a.degrees, a.alterations);
              return (
                O[m.a.get(o, "root")] + 1 === O[n] &&
                "dominant" === c &&
                !m.a
                  .chain(u)
                  .intersection(["b5", "#5", "b9", "#9"])
                  .isEmpty()
                  .value()
              );
            },
          },
          {
            id: "Chord Chemistry 11.IIIc",
            description: f.a.createElement(
              "span",
              null,
              f.a.createElement(
                "blockquote",
                null,
                "Dominant chords with altered tones ... can be used effectively ... when the ",
                f.a.createElement("em", null, "next"),
                " chord is ... a minor type chord with the same root. lower.",
                f.a.createElement(
                  "footer",
                  null,
                  "\u2014",
                  " ",
                  f.a.createElement(
                    "a",
                    { href: "https://amzn.to/2YQ8xYM" },
                    "Ted Greene in ",
                    f.a.createElement("em", null, "Chord Chemistry")
                  )
                )
              )
            ),
            test: function (e, t, n, a, r, i, o) {
              var c = a.family,
                u = (a.name, a.degrees, a.alterations);
              return (
                O[m.a.get(o, "root")] === O[n] &&
                "dominant" === c &&
                !m.a
                  .chain(u)
                  .intersection(["b5", "#5", "b9", "#9"])
                  .isEmpty()
                  .value() &&
                "minor" === m.a.get(o, "quality.family")
              );
            },
          },
          {
            id: "Guitar Style Major Chords",
            description: f.a.createElement(
              "span",
              null,
              f.a.createElement(
                "blockquote",
                null,
                "[For major chords], substitute relative minor or secondary relative minor chords.",
                f.a.createElement(
                  "footer",
                  null,
                  "\u2014",
                  " ",
                  f.a.createElement(
                    "a",
                    { href: "https://amzn.to/2YNsYcG" },
                    "Joe Pass in ",
                    f.a.createElement("em", null, "Guitar Style")
                  )
                )
              )
            ),
            test: function (e, t, n, a, r, i, o) {
              var c = a.family,
                u = (a.name, a.degrees, a.alterations),
                s = O[n] === (O[r] + 4) % 12,
                l = O[n] === (O[r] + 9) % 12;
              return (
                (s || l) &&
                "major" === i.family &&
                "minor" === c &&
                m.a.isEmpty(u)
              );
            },
          },
          {
            id: "Guitar Style Minor Chords",
            description: f.a.createElement(
              "span",
              null,
              f.a.createElement(
                "blockquote",
                null,
                "[For minor chords], substitute relative major chords.",
                f.a.createElement(
                  "footer",
                  null,
                  "\u2014",
                  " ",
                  f.a.createElement(
                    "a",
                    { href: "https://amzn.to/2YNsYcG" },
                    "Joe Pass in ",
                    f.a.createElement("em", null, "Guitar Style")
                  )
                )
              )
            ),
            test: function (e, t, n, a, r, i, o) {
              var c = a.family,
                u = (a.name, a.degrees, a.alterations);
              return (
                O[n] === (O[r] + 3) % 12 &&
                "minor" === i.family &&
                "major" === c &&
                m.a.isEmpty(u)
              );
            },
          },
          {
            id: "Guitar Style Seventh Chords",
            description: f.a.createElement(
              "span",
              null,
              f.a.createElement(
                "blockquote",
                null,
                "[For seventh chords], substitute dominant minor chords.",
                f.a.createElement(
                  "footer",
                  null,
                  "\u2014",
                  " ",
                  f.a.createElement(
                    "a",
                    { href: "https://amzn.to/2YNsYcG" },
                    "Joe Pass in ",
                    f.a.createElement("em", null, "Guitar Style")
                  )
                )
              )
            ),
            test: function (e, t, n, a, r, i, o) {
              var c = a.family,
                u = (a.name, a.degrees, a.alterations);
              return (
                O[n] === (O[r] + 7) % 12 &&
                "dominant" === i.family &&
                "minor" === c &&
                m.a.isEmpty(u)
              );
            },
          },
        ];
      function w() {
        var e = Object(s.a)(["\n  cursor: pointer;\n"]);
        return (
          (w = function () {
            return e;
          }),
          e
        );
      }
      function x() {
        var e = Object(s.a)([
          "\n  display: flex;\n  width: 100%;\n  align-items: flex-end;\n",
        ]);
        return (
          (x = function () {
            return e;
          }),
          e
        );
      }
      function E() {
        var e = Object(s.a)([
          "\n  display: flex;\n  flex-direction: column;\n  width: auto;\n  background-color: #eee;\n  grid-column: 1 / span 6;\n  padding: 1rem;\n  align-items: flex-end;\n  margin-bottom: 1rem;\n",
        ]);
        return (
          (E = function () {
            return e;
          }),
          e
        );
      }
      m.a.keyBy(S, "id"), d.a.div(E()), d.a.div(x()), d.a.a(w()), n(106);
      var k = function (e, t) {
          var n = m.a.size(t) >= m.a.size(e),
            a = n ? [t, e] : [e, t],
            r = Object(u.a)(a, 2),
            i = r[0],
            o = r[1];
          return m.a
            .chain(i)
            .thru(function (e) {
              return (
                (t = e),
                (n = m.a.size(o)),
                m.a
                  .chain(m.a.size(t) - n + 1)
                  .range()
                  .reduce(function (e, a) {
                    return (
                      e.push(m.a.chain(t).clone().drop(a).take(n).value()), e
                    );
                  }, [])
                  .value()
              );
              var t, n;
            })
            .map(function (a) {
              return {
                sum: m.a
                  .chain(a)
                  .zip(o)
                  .map(function (e) {
                    var t = Object(u.a)(e, 2),
                      n = t[0],
                      a = t[1];
                    return Math.abs(n - a);
                  })
                  .sum()
                  .value(),
                current: n ? a : t,
                previous: n ? e : a,
              };
            })
            .minBy("sum")
            .value();
        },
        C = function (e, t, n) {
          return n[e] + t;
        };
      function F() {
        var e = Object(s.a)([
          "\n  width: 100%;\n  height: 100%;\n  cursor: pointer;\n",
        ]);
        return (
          (F = function () {
            return e;
          }),
          e
        );
      }
      var G = d.a.canvas(F()),
        B = function (e) {
          var t = e.frets,
            n = e.setFretHeight,
            a = e.setFretWidth,
            r = e.onClickFret,
            c = e.tuning,
            s = e.chord,
            b = e.previousChord,
            d = e.allowOpen,
            p = e.sharps,
            v = e.maxReach,
            g = e.capo,
            S = e.getVoicings,
            w = Object(l.useRef)(),
            x = Object(l.useState)(!1),
            E = Object(u.a)(x, 2),
            F = E[0],
            B = E[1],
            M = Object(l.useState)(void 0),
            q = Object(u.a)(M, 2),
            z = q[0],
            D = q[1],
            P = m.a
              .chain(j)
              .flatMap(function (e) {
                return m.a.map(Object.keys(O), function (t) {
                  return { root: t, quality: e };
                });
              })
              .filter(function (e) {
                var t = e.root,
                  n = e.quality;
                if (m.a.isEmpty(s.notes)) return !1;
                var a = m.a
                    .chain(s.notes)
                    .map(function (e) {
                      var t = Object(u.a)(e, 2),
                        n = t[0],
                        a = t[1];
                      return (c[n] + a) % 12;
                    })
                    .uniq()
                    .sortBy(m.a.identity)
                    .value(),
                  r = m.a
                    .chain(n.quality)
                    .map(function (e) {
                      return (O[t] + e) % 12;
                    })
                    .sortBy(m.a.identity)
                    .value();
                return m.a.isEqual(a, r);
              })
              .map(function (e) {
                var t = e.root,
                  n = e.quality;
                return "".concat(t).concat(n.name);
              })
              .sortBy(m.a.identity)
              .value();
          Object(l.useEffect)(
            function () {
              (function () {
                var e = Object(o.a)(
                  i.a.mark(function e() {
                    var n;
                    return i.a.wrap(function (e) {
                      for (;;)
                        switch ((e.prev = e.next)) {
                          case 0:
                            return (
                              (e.next = 2),
                              S({
                                chord: s,
                                tuning: c,
                                allowOpen: d,
                                frets: t,
                                maxReach: v,
                                capo: g,
                              })
                            );
                          case 2:
                            (n = e.sent), D(n), B(!1);
                          case 5:
                          case "end":
                            return e.stop();
                        }
                    }, e);
                  })
                );
                return function () {
                  return e.apply(this, arguments);
                };
              })()();
            },
            [g, s, c, d, t, v, S]
          );
          var N = m.a
              .chain(s.quality)
              .get("quality")
              .uniq()
              .map(function (e) {
                return (e + O[s.root]) % 12;
              })
              .value(),
            A = (function (e, t) {
              var n =
                  (e && e.includes("#")) || p
                    ? [
                        "C",
                        "C#",
                        "D",
                        "D#",
                        "E",
                        "F",
                        "F#",
                        "G",
                        "G#",
                        "A",
                        "A#",
                        "B",
                      ]
                    : [
                        "C",
                        "Db",
                        "D",
                        "Eb",
                        "E",
                        "F",
                        "Gb",
                        "G",
                        "Ab",
                        "A",
                        "Bb",
                        "B",
                      ],
                a = m.a.findIndex(
                  ["C", "D", "E", "F", "G", "A", "B"],
                  function (t) {
                    return e && t === e.substr(0, 1);
                  }
                ),
                r = m.a
                  .chain(["C", "D", "E", "F", "G", "A", "B"])
                  .drop(a)
                  .concat(m.a.take(["C", "D", "E", "F", "G", "A", "B"], a))
                  .value(),
                i = m.a
                  .chain([0, 2, 4, 5, 7, 9, 11])
                  .map(function (t) {
                    return (t + O[e]) % 12;
                  })
                  .map(function (e, t) {
                    var a = r[t],
                      i = n[e],
                      o = Math.min(
                        Math.abs(O[i] - O[a]),
                        Math.abs(O[i] - O[a] + 12)
                      );
                    return (
                      a +
                      m.a
                        .chain(o)
                        .range()
                        .map(function (e) {
                          return o === Math.abs(O[i] - O[a]) && O[i] < O[a]
                            ? "b"
                            : "#";
                        })
                        .join("")
                        .value()
                    );
                  })
                  .value();
              return (
                m.a
                  .chain(t)
                  .get("degrees")
                  .map(function (t) {
                    var a = parseInt(m.a.replace(t, /#|b/, "")) - 1,
                      r = m.a.replace(t, /[^#b]+/, ""),
                      o = i[a % m.a.size(i)];
                    return (
                      (n[(y(t) + O[e]) % 12] = m.a.replace(
                        "".concat(o).concat(r),
                        /#b|b#/,
                        ""
                      )),
                      t
                    );
                  })
                  .value(),
                n
              );
            })(s.root, s.quality),
            R = function (e, t, n, a, r) {
              if (!r)
                return (n
                  ? [
                      "C",
                      "C#",
                      "D",
                      "D#",
                      "E",
                      "F",
                      "F#",
                      "G",
                      "G#",
                      "A",
                      "A#",
                      "B",
                    ]
                  : [
                      "C",
                      "Db",
                      "D",
                      "Eb",
                      "E",
                      "F",
                      "Gb",
                      "G",
                      "Ab",
                      "A",
                      "Bb",
                      "B",
                    ])[(a[e] + t) % 12];
              var i = (a[e] + t) % 12;
              return A[i]
                ? A[i]
                : A[(i + 1) % 12]
                ? (A[(i + 1) % 12] + "b").replace(/#b|b#/g, "")
                : (A[(i - 1 + 12) % 12] + "#").replace(/#b|b#/g, "");
            },
            I = function (e) {
              return window
                .getComputedStyle(e)
                .getPropertyValue("height")
                .slice(0, -2);
            },
            J = function (e, n) {
              return (e * n - 3) / t;
            },
            T = function (e) {
              return e / 1.5;
            },
            U = function (e, t, n) {
              return [(e * n) / 2, (t * n) / 2];
            },
            Y = function (e, n, a, r) {
              return [n - (a * t) / 2, e - (r * (m.a.size(c) - 1)) / 2];
            },
            W = m.a
              .chain(s)
              .get("notes")
              .filter(function (e) {
                var t = Object(u.a)(e, 2),
                  n = t[0],
                  a = t[1];
                return m.a
                  .chain(s.quality)
                  .get("quality")
                  .map(function (e) {
                    return (e + O[s.root]) % 12;
                  })
                  .includes(
                    (function (e, t, n) {
                      return (n[e] + t) % 12;
                    })(n, a, c)
                  )
                  .value();
              })
              .value(),
            H = m.a.filter(z, function (e) {
              return m.a.every(W, function (t) {
                return m.a
                  .chain(e)
                  .map(function (e) {
                    return e.toString();
                  })
                  .includes(t.toString())
                  .value();
              });
            }),
            V = m.a
              .chain(z)
              .thru(function (e) {
                return (function (e, t) {
                  var n = m.a
                      .chain(e)
                      .reduce(function (e, n, a) {
                        return (
                          m.a.forEach(n, function (r) {
                            var i = Object(u.a)(r, 2),
                              o = i[0],
                              c = i[1];
                            e[[o, c]] || (e[[o, c]] = 0),
                              (e[[o, c]] = t(e[[o, c]], {
                                string: o,
                                fret: c,
                                voicing: n,
                                i: a,
                              }));
                          }),
                          e
                        );
                      }, {})
                      .value(),
                    a = 2 * m.a.chain(n).values().max().value();
                  return m.a
                    .chain(n)
                    .mapValues(function (e) {
                      return e / a;
                    })
                    .value();
                })(e, function (e, t) {
                  var n = t.voicing;
                  if (!m.a.isEmpty(m.a.get(b, "notes"))) {
                    var a =
                      (function (e, t) {
                        if (m.a.isEmpty(e.notes))
                          return function () {
                            return 0;
                          };
                        var n = m.a
                          .chain(e.notes)
                          .map(function (e) {
                            var n = Object(u.a)(e, 2),
                              a = n[0],
                              r = n[1];
                            return C(a, r, t);
                          })
                          .sort()
                          .value();
                        return function (a) {
                          if (m.a.isEmpty(e.notes)) return 0;
                          var r = m.a
                            .chain(a)
                            .map(function (e) {
                              var n = Object(u.a)(e, 2),
                                a = n[0],
                                r = n[1];
                              return C(a, r, t);
                            })
                            .sort()
                            .value();
                          return k(n, r).sum;
                        };
                      })(
                        b,
                        c
                      )(n) || 0.1;
                    return m.a.max([e || 0, 1 / a]);
                  }
                  return 1;
                });
              })
              .mapValues(function (e, t) {
                var n = JSON.parse("[".concat(t, "]")),
                  a = Object(u.a)(n, 2),
                  r = a[0],
                  i = a[1];
                return m.a
                  .chain(H)
                  .some(function (e) {
                    return m.a
                      .chain(e)
                      .map(function (e) {
                        return e.toString();
                      })
                      .includes([r, i].toString())
                      .value();
                  })
                  .value() &&
                  (m.a.size(H) > 1 || m.a.size(W) < m.a.chain(H).first().size())
                  ? e
                  : 0;
              })
              .value();
          Object(l.useEffect)(function () {
            var e = w.current,
              r = e.getContext("2d"),
              i = h(r),
              o = I(e),
              l = J(o, i),
              f = T(l),
              b = (f / i) * m.a.size(c),
              d = U(b, o, i),
              v = Object(u.a)(d, 2),
              y = v[0],
              j = v[1],
              O = Y(y, j, l, f),
              S = Object(u.a)(O, 2),
              x = S[0],
              E = S[1];
            (e.width = 2 * b * i),
              (e.height = o * i),
              (e.style.width = "".concat(2 * b, "px")),
              (e.style.height = "".concat(o, "px")),
              (r.lineWidth = 3),
              (r.lineCap = "square"),
              (r.strokeStyle = "#eee"),
              (r.fillStyle = "#eee"),
              (r.textBaseline = "middle"),
              (r.fillStyle = "#FFF"),
              n(l),
              a(f);
            for (var k = 1; k < t + 1; k++)
              r.beginPath(),
                r.moveTo(E, x + k * l),
                r.lineTo(E + f * (m.a.size(c) - 1), x + k * l),
                r.stroke(),
                m.a.includes([3, 5, 7, 9, 12, 15, 18], k) &&
                  (r.beginPath(),
                  r.arc(
                    E + 2 * f + f / 2,
                    x + k * l + l / 2,
                    f / 4 - 3,
                    0,
                    2 * Math.PI
                  ),
                  r.fill()),
                m.a.includes([1, 13], k) &&
                  (r.beginPath(),
                  r.moveTo(E, x + k * l + 3),
                  r.lineTo(E + f * (m.a.size(c) - 1), x + k * l + 3),
                  r.stroke());
            r.beginPath();
            for (var C = 0; C < m.a.size(c); C++)
              r.moveTo(E + C * f, x + l), r.lineTo(E + C * f, x + l * t);
            if ((r.stroke(), F))
              return (
                (r.font = "bold ".concat(
                  0.4 * f,
                  "px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif"
                )),
                (r.fillStyle = "rgba(255,255,255,0.66)"),
                r.beginPath(),
                r.rect(0, 0, b * i, o * i),
                r.fill(),
                (r.fillStyle = "#666"),
                (r.textAlign = "center"),
                void r.fillText("Loading...", (b * i) / 2, (o * i) / 2)
              );
            for (var G = 0; G < t; G++)
              for (var B = 0; B < m.a.size(c); B++)
                (r.fillStyle = "rgba(0,0,255,".concat(
                  V[[B, G]] ? Math.max(0.1, V[[B, G]]) : 0,
                  ")"
                )),
                  r.beginPath(),
                  r.rect(E + (B - 1) * f + f / 2, x + G * l, f, l),
                  r.fill();
            (r.fillStyle = "#666"),
              (r.strokeStyle = "#666"),
              (r.lineWidth = 4),
              (r.textAlign = "center"),
              (r.font = "bold ".concat(
                0.4 * f,
                "px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif"
              ));
            for (
              var M = m.a
                  .chain(s.notes)
                  .reduce(function (e, t) {
                    return (e[t] = !0), e;
                  }, {})
                  .value(),
                q = 0;
              q < t + 1;
              q++
            )
              for (var z = 0; z < m.a.size(c); z++)
                if (M[[z, q]])
                  (r.fillStyle = "#666"),
                    r.beginPath(),
                    r.arc(
                      E + z * f,
                      x + q * l + l / 2,
                      f / 2 - 3,
                      0,
                      2 * Math.PI
                    ),
                    r.fill(),
                    (r.fillStyle = "#FFF"),
                    r.fillText(
                      R(z, q, p, c, s.quality),
                      E + z * f,
                      x + q * l + l / 2
                    );
                else if (m.a.includes(N, (c[z] + q) % 12)) {
                  if (V[[z, q]]) {
                    var D = Object(u.a)(
                        r.getImageData(E + z * f - 6, x + q * l + l / 2, 1, 1)
                          .data,
                        3
                      ),
                      A = D[0],
                      W = D[1],
                      H = D[2];
                    (r.fillStyle = "rgb("
                      .concat(A, ", ")
                      .concat(W, ", ")
                      .concat(H, ")")),
                      r.beginPath(),
                      r.arc(
                        E + z * f,
                        x + q * l + l / 2,
                        f / 4,
                        0,
                        2 * Math.PI
                      ),
                      r.fill(),
                      (r.fillStyle = "white");
                  } else
                    (r.fillStyle = "#FFF"),
                      r.beginPath(),
                      r.arc(
                        E + z * f,
                        x + q * l + l / 2,
                        f / 4,
                        0,
                        2 * Math.PI
                      ),
                      r.fill(),
                      (r.fillStyle = "#999");
                  r.fillText(
                    R(z, q, p, c, s.quality),
                    E + z * f,
                    x + q * l + l / 2
                  );
                }
            (r.fillStyle = "rgba(0,0,0,0.068)"),
              r.beginPath(),
              r.rect(0, x - 1.5, b * i, x + g * l - 1.5),
              r.fill(),
              (r.textAlign = "left"),
              (r.fillStyle = "#999"),
              (r.font = "bold ".concat(
                0.4 * f,
                "px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif"
              )),
              m.a.map(P, function (e, t) {
                r.fillText(e, E + 6 * f, x + t * l + 1.5 * l);
              });
          });
          return f.a.createElement(G, {
            ref: w,
            onClick: function (e) {
              var n = w.current,
                a = n.getContext("2d"),
                i = h(a),
                o = e.nativeEvent.offsetX * i,
                s = e.nativeEvent.offsetY * i,
                l =
                  (function (e) {
                    return window
                      .getComputedStyle(e)
                      .getPropertyValue("width")
                      .slice(0, -2);
                  })(n) / 2,
                f = I(n),
                b = J(f, i),
                d = T(b),
                p = U(l, f, i),
                v = Object(u.a)(p, 2),
                g = v[0],
                y = v[1],
                j = Y(g, y, b, d),
                O = Object(u.a)(j, 2),
                S = O[0],
                x = O[1],
                E = Math.floor((s - S) / b),
                k = Math.floor((o - x - d / 2) / d) + 1;
              m.a.isFunction(r) &&
                E >= 0 &&
                E < t &&
                k >= 0 &&
                k < m.a.size(c) &&
                r({ string: k, fret: E }, e);
            },
          });
        },
        M = n(114),
        q = n.n(M),
        z =
          (m.a
            .chain([
              {
                text: "Standard tuning - EADGBE",
                value: JSON.stringify([40, 45, 50, 55, 59, 64]),
              },
              {
                text: "Drop D tuning - DADGBE",
                value: JSON.stringify([38, 45, 50, 55, 59, 64]),
              },
              {
                text: "DADGAD tuning",
                value: JSON.stringify([38, 45, 50, 55, 60, 62]),
              },
              {
                text: "New standard tuning - CGDAEG",
                value: JSON.stringify([36, 43, 50, 57, 64, 67]),
              },
              {
                text: "Ukulele (High G) tuning - GBCD",
                value: JSON.stringify([67, 60, 64, 69]),
              },
              {
                text: "Ukulele (Low G) tuning - GBCD",
                value: JSON.stringify([55, 60, 64, 69]),
              },
            ])
            .sortBy("text")
            .map(function (e) {
              return Object(a.a)({ key: JSON.stringify(e) }, e);
            })
            .value(),
          n(386),
          n(209));
      function D() {
        var e = Object(s.a)([
          "\n  display: grid;\n  grid-template-columns: repeat(6, 1fr);\n  grid-gap: 0;\n  grid-auto-flow: row dense;\n",
        ]);
        return (
          (D = function () {
            return e;
          }),
          e
        );
      }
      function P() {
        var e = Object(s.a)([
          "\n  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,\n    Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;\n  font-weight: normal;\n  margin: 1rem 0 2rem;\n",
        ]);
        return (
          (P = function () {
            return e;
          }),
          e
        );
      }
      function N() {
        var e = Object(s.a)([
          "\n  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,\n    Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;\n  font-weight: 100;\n  text-transform: uppercase;\n  padding-top: 4rem;\n  margin-bottom: 0;\n",
        ]);
        return (
          (N = function () {
            return e;
          }),
          e
        );
      }
      function A() {
        var e = Object(s.a)([
          "\n  padding: 1rem;\n  background-color: #eee;\n",
        ]);
        return (
          (A = function () {
            return e;
          }),
          e
        );
      }
      function R() {
        var e = Object(s.a)([
          "\n  flex: 0;\n  padding: 1em;\n  background-color: white;\n",
        ]);
        return (
          (R = function () {
            return e;
          }),
          e
        );
      }
      function I() {
        var e = Object(s.a)([
          "\n  flex: 2;\n  background-color: #f8f8f8;\n  padding: 0 2rem 2rem 2rem;\n  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,\n    Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;\n  overflow: auto;\n",
        ]);
        return (
          (I = function () {
            return e;
          }),
          e
        );
      }
      function J() {
        var e = Object(s.a)([
          "\n  display: flex;\n  height: 100vh;\n  max-height: 100vh;\n  max-width: 800px;\n  margin: 0 auto;\n  padding: 0 2rem;\n",
        ]);
        return (
          (J = function () {
            return e;
          }),
          e
        );
      }
      d.a.div(J()),
        d.a.div(I()),
        d.a.div(R()),
        d.a.div(A()),
        d.a.h1(N()),
        d.a.p(P()),
        d.a.div(D());
      var T = f.a.createContext({ height: 0, width: 0 }),
        U = function (e) {
          var t = e.getVoicings,
            n = (e.getSubstitutions, e.hash),
            r = n.allowOpen,
            i = n.allowPartialQualities,
            o = n.sharps,
            s = n.tuning,
            b = n.chords,
            h = n.frets,
            d = n.maxReach,
            p = n.capo,
            v =
              (new URLSearchParams(window.location.search),
              Object(l.useState)(r)),
            g = Object(u.a)(v, 2),
            y = g[0],
            j = (g[1], Object(l.useState)(i)),
            O = Object(u.a)(j, 2),
            S = (O[0], O[1], Object(l.useState)(s)),
            w = Object(u.a)(S, 2),
            x = w[0],
            E = (w[1], Object(l.useState)(!1)),
            k = Object(u.a)(E, 2),
            C = (k[0], k[1], Object(l.useState)(d)),
            F = Object(u.a)(C, 2),
            G = F[0],
            M = (F[1], Object(l.useState)(p)),
            q = Object(u.a)(M, 2),
            D = q[0],
            P = (q[1], Object(z.a)()),
            N = Object(u.a)(P, 2),
            A = N[0],
            R = N[1],
            I = Object(l.useState)(o),
            J = Object(u.a)(I, 2),
            U = J[0],
            Y = (J[1], Object(l.useState)(0)),
            W = Object(u.a)(Y, 2),
            H = W[0],
            V = W[1],
            Q = Object(l.useState)(h),
            L = Object(u.a)(Q, 2),
            _ = L[0],
            X = (L[1], Object(l.useState)(void 0)),
            $ = Object(u.a)(X, 2),
            K = ($[0], $[1]),
            Z = Object(l.useState)(void 0),
            ee = Object(u.a)(Z, 2),
            te = (ee[0], ee[1]),
            ne = Object(l.useState)(b),
            ae = Object(u.a)(ne, 2),
            re = ae[0],
            ie = ae[1],
            oe = function (e) {
              switch (e.key) {
                case "ArrowRight":
                  V(Math.min(H + 1, m.a.size(re) - 1));
                  break;
                case "ArrowLeft":
                  V(Math.max(H - 1, 0));
                  break;
                case "+":
                  re.splice(H + 1, 0, {
                    key: Math.random(),
                    quality: void 0,
                    notes: [],
                    voicings: [],
                  }),
                    ie(Object(c.a)(re)),
                    V(H + 1);
                  break;
                case "-":
                  m.a.isEmpty(re[H].notes)
                    ? m.a.size(re) > 1
                      ? (re.splice(H, 1),
                        V(Math.max(0, H - 1)),
                        ie(Object(c.a)(re)))
                      : ie([
                          {
                            key: Math.random(),
                            root: null,
                            quality: void 0,
                            notes: [],
                          },
                        ])
                    : (re.splice(
                        H,
                        1,
                        Object(a.a)(Object(a.a)({}, re[H]), {}, { notes: [] })
                      ),
                      ie(Object(c.a)(re)));
              }
            };
          return (
            Object(l.useEffect)(
              function () {
                return (
                  document.addEventListener("keyup", oe),
                  function () {
                    document.removeEventListener("keyup", oe);
                  }
                );
              },
              [H, re]
            ),
            f.a.createElement(
              T.Provider,
              { value: { height: 0, width: 0 } },
              f.a.createElement(
                B,
                Object.assign(
                  { key: JSON.stringify({ windowWidth: A, windowHeight: R }) },
                  {
                    getVoicings: t,
                    frets: _,
                    setFretHeight: K,
                    setFretWidth: te,
                    sharps: U,
                    allowOpen: y,
                    tuning: x,
                    maxReach: G,
                    capo: D,
                    chord: re[H],
                    previousChord: H > 0 ? re[H - 1] : void 0,
                    onClickFret: function (e, t) {
                      var n = e.string,
                        r = e.fret;
                      m.a
                        .chain(re[H].notes)
                        .map(function (e) {
                          return JSON.stringify(e);
                        })
                        .includes(JSON.stringify([n, r]))
                        .value()
                        ? (re.splice(
                            H,
                            1,
                            Object(a.a)(
                              Object(a.a)({}, re[H]),
                              {},
                              {
                                notes: m.a
                                  .chain(re[H].notes)
                                  .reject(function (e) {
                                    return (
                                      JSON.stringify(e) ===
                                      JSON.stringify([n, r])
                                    );
                                  })
                                  .sortBy(m.a.identity)
                                  .value(),
                              }
                            )
                          ),
                          ie(Object(c.a)(re)))
                        : m.a
                            .chain(re[H].notes)
                            .map(function (e) {
                              var t = Object(u.a)(e, 2),
                                n = t[0];
                              t[1];
                              return n;
                            })
                            .includes(n)
                            .value()
                        ? (re.splice(
                            H,
                            1,
                            Object(a.a)(
                              Object(a.a)({}, re[H]),
                              {},
                              {
                                notes: [].concat(
                                  Object(c.a)(
                                    m.a
                                      .chain(re[H].notes)
                                      .reject(function (e) {
                                        var t = Object(u.a)(e, 2),
                                          a = t[0];
                                        t[1];
                                        return a === n;
                                      })
                                      .sortBy(m.a.identity)
                                      .value()
                                  ),
                                  [[n, r]]
                                ),
                              }
                            )
                          ),
                          ie(Object(c.a)(re)))
                        : (re.splice(
                            H,
                            1,
                            Object(a.a)(
                              Object(a.a)({}, re[H]),
                              {},
                              {
                                notes: m.a.sortBy(
                                  [].concat(Object(c.a)(re[H].notes), [[n, r]]),
                                  m.a.identity
                                ),
                              }
                            )
                          ),
                          ie(Object(c.a)(re)));
                    },
                  }
                )
              )
            )
          );
        },
        Y = n(37),
        W = n.n(Y),
        H = n(207),
        V = n.n(H),
        Q = (n(389), {}),
        L = function (e, t) {
          Q[e] = t;
        },
        _ = function (e) {
          return Q[e];
        },
        X = function (e, t, n, a, r) {
          return function (e) {
            return m.a
              .chain(m.a.product(m.a.range(t), m.a.range(a, r + 1)))
              .filter(function (t) {
                var a = Object(u.a)(t, 2),
                  r = a[0],
                  i = a[1],
                  o = n[r] + i;
                return o === e || o % 12 === e;
              })
              .value();
          };
        },
        $ = function (e) {
          return (
            m.a.size(e) !== m.a.chain(e).map(m.a.first).uniq().size().value()
          );
        },
        K = function (e, t, n) {
          return function (a) {
            var r = m.a.reject(a, function (e) {
                var a = Object(u.a)(e, 2);
                a[0];
                return a[1] === n && t;
              }),
              i = m.a.minBy(r, function (e) {
                var t = Object(u.a)(e, 2);
                t[0];
                return t[1];
              }),
              o = Object(u.a)(i, 2)[1],
              c = m.a.maxBy(r, function (e) {
                var t = Object(u.a)(e, 2);
                t[0];
                return t[1];
              });
            return Object(u.a)(c, 2)[1] - o > e;
          };
        },
        Z = (n(390), m.a.keyBy(S, "id")),
        ee = function (e) {
          var t = e.quality,
            n = e.root,
            a = e.tuning,
            r = e.allowOpen,
            i = e.frets,
            o = e.maxReach,
            c = e.capo;
          return m.a
            .chain(t)
            .get("quality")
            .map(function (e) {
              return (e + O[n]) % 12;
            })
            .thru(function (e) {
              return (function (e, t, n) {
                var a =
                    arguments.length > 3 && void 0 !== arguments[3]
                      ? arguments[3]
                      : 18,
                  r =
                    arguments.length > 4 && void 0 !== arguments[4]
                      ? arguments[4]
                      : 5,
                  i =
                    arguments.length > 5 && void 0 !== arguments[5]
                      ? arguments[5]
                      : 0;
                if (m.a.isEmpty(e)) return [];
                var o = m.a.size(t);
                return m.a
                  .chain(e)
                  .map(X(0, o, t, i, a))
                  .thru(function (e) {
                    return m.a.product.apply(null, e);
                  })
                  .reject($)
                  .reject(K(r, n, i))
                  .value();
              })(e, a, r, i, o, c);
            })
            .uniqWith(m.a.isEqual)
            .value();
        },
        te = window.location.hash.slice(1),
        ne = (function () {
          var e = Object(o.a)(
            i.a.mark(function e(t) {
              var n, a, r, o, c, u;
              return i.a.wrap(function (e) {
                for (;;)
                  switch ((e.prev = e.next)) {
                    case 0:
                      return (
                        (n = t.chord),
                        (a = t.tuning),
                        (r = t.allowOpen),
                        (o = t.frets),
                        (c = t.maxReach),
                        (u = t.capo),
                        JSON.stringify({
                          quality: n.quality,
                          root: n.root,
                          tuning: a,
                          allowOpen: r,
                          frets: o,
                          maxReach: c,
                          capo: u,
                        }),
                        e.abrupt(
                          "return",
                          ee({
                            quality: n.quality,
                            root: n.root,
                            tuning: a,
                            allowOpen: r,
                            frets: o,
                            maxReach: c,
                            capo: u,
                          })
                        )
                      );
                    case 3:
                    case "end":
                      return e.stop();
                  }
              }, e);
            })
          );
          return function (t) {
            return e.apply(this, arguments);
          };
        })(),
        ae = (function () {
          var e = Object(o.a)(
            i.a.mark(function e(t) {
              var n, r, o, c, u, s, l, f;
              return i.a.wrap(function (e) {
                for (;;)
                  switch ((e.prev = e.next)) {
                    case 0:
                      if (
                        ((n = t.chord),
                        (r = t.tuning),
                        (o = t.allowPartialQualities),
                        (c = t.sharps),
                        (u = t.previousChord),
                        (s = t.nextChord),
                        (l = JSON.stringify({
                          chord: n,
                          tuning: r,
                          allowPartialQualities: o,
                          sharps: c,
                          previousChord: u,
                          nextChord: s,
                        })),
                        !_(l))
                      ) {
                        e.next = 5;
                        break;
                      }
                      return (
                        console.log("Found cached substitutions."),
                        e.abrupt("return", _(l))
                      );
                    case 5:
                      return (
                        console.time("Time to generate substitutions"),
                        (e.t0 = m.a),
                        (e.next = 9),
                        V()().workerGetSubstitutions({
                          chord: n,
                          tuning: r,
                          allowPartialQualities: o,
                          sharps: c,
                          previousChord: u,
                          nextChord: s,
                        })
                      );
                    case 9:
                      return (
                        (e.t1 = e.sent),
                        (f = e.t0.chain
                          .call(e.t0, e.t1)
                          .map(function (e) {
                            return Object(a.a)(
                              Object(a.a)({}, e),
                              {},
                              {
                                substitutions: m.a.map(
                                  e.substitutions,
                                  function (e) {
                                    return Z[e];
                                  }
                                ),
                              }
                            );
                          })
                          .value()),
                        L(l, f),
                        console.timeEnd("Time to generate substitutions"),
                        e.abrupt("return", f)
                      );
                    case 14:
                    case "end":
                      return e.stop();
                  }
              }, e);
            })
          );
          return function (t) {
            return e.apply(this, arguments);
          };
        })();
      W.a.render(
        f.a.createElement(U, {
          hash: (function (e) {
            var t = {
              sharps: !1,
              allowPartialQualities: !0,
              allowOpen: !1,
              tuning: [40, 45, 50, 55, 59, 64],
              frets: 18,
              maxReach: 5,
              capo: 0,
              chords: [
                {
                  key: Math.random(),
                  root: void 0,
                  qualities: [],
                  notes: [
                    [1, 3],
                    [2, 2],
                    [3, 0],
                    [4, 1],
                  ],
                },
              ],
            };
            try {
              var n = m.a.isEmpty(e)
                ? t
                : JSON.parse(q.a.inflate(atob(e), { to: "string" }));
              return m.a.isArray(n) ? m.a.extend(t, { chords: n }) : n;
            } catch (a) {
              return console.error("Error parsing hash.", a), t;
            }
          })(te),
          getVoicings: ne,
          getSubstitutions: ae,
        }),
        document.getElementById("root")
      ),
        "serviceWorker" in navigator &&
          navigator.serviceWorker.ready.then(function (e) {
            e.unregister();
          });
    },
  },
  [[217, 1, 2]],
]);
//# sourceMappingURL=main.9376f2a2.chunk.js.map
