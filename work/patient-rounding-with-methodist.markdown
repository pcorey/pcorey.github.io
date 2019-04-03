---
layout: work
title: "Patient Rounding with Methodist"
hideFooter: false
hideNewsletter: true
next:
    url: /work/scalable-messaging-at-admithub
    title: "Scalable Messaging at AdmitHub"
    description: "I helped AdmitHub build a scalable SMS messaging system that allowed them to increase the size their user base by a factor of ten and quadruple their average user engagement rates."
previous:
    url: /work/secure-meteor
    title: "Secure Meteor"
    description: "I wrote Secure Meteor as a culmination of all my time spent evangelizing Meteor security and helping teams to better secure their applications."
---

In 2018 I was contacted by Methodist Le Bonheur Healthcare, the largest multi-facility hospital system in Memphis, Tennessee, to architect and design a “patient rounding” system for use by nurses throughout their hospitals.

Nurses making their rounds through the hospital frequently survey patients, asking about the quality of their stay and how they’re feeling about their course of treatment. Methodist’s proprietary rounding solution was costing them $220,000 per year in licensing and contract fees.

[Once again](/work/real-time-bed-control-with-methodist), they felt they would be better served by an in-house replacement.

<img src="/img/rounds1.png" style="width: 100%; margin: 0 auto; display: block;">

Working with a small team of Methodist developers, I designed and implemented a __Node.js-based__ back-end to meet all of their requirements while still planning for future extensibility. The architecture we landed on was entirely data driven; questions, question sets, and even answer types could be defined by hospital administrators, and room and patient data was pulled directly from Methodist’s Electronic Medical Records (EMR) system.

A flexible front-end was required to support such a powerful, data-driven approach. I helped Methodist lay the groundwork by building a __React-based__, offline-capable web application that used a __GraphQL__ API to communicate with our new data-driven back-end.

After rolling out our solution to their network of hospital facilities, __Methodist was able to save nearly a quarter of a million dollars per year in licensing and contract fees__.

<img src="/img/rounds2.png" style="width: 100%; margin: 0 auto; display: block;">
