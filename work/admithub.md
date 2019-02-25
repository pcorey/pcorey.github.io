---
layout: work
title:  "Scalable Messaging at AdmitHub"
hideFooter: false
hideNewsletter: true
previous:
    url: /work/methodist
    title: "Realtime Bed Control with Methodist"
    description: "Read about how the Methodist Le Bonheur Healthcare in Memphis, Tennessee saved millions in licencing costs by switching off of third-party internal software, and onto a system that I helped develop."
---

The heart and soul of <a href="https://www.admithub.com/">AdmitHub</a>, one of my long-term clients, is real-time messaging. AdmitHub builds messaging products targeted at graduating high school seniors looking for guidance in the college application process.

During our time working together, I helped AdmitHub overcome many engineering obstacles related to their real-time messaging platform and <strong>increase the size their user base by a factor of ten and quadruple their average user engagement rates</strong>.

## Twilio

AdmitHub’s primary medium of interaction with its users is via text message. They use a host of <a href="https://www.twilio.com/">Twilio</a> products to manage SMS communications, and while Twilio is a fantastic product, it doesn’t come without its rough edges.

<img src="/img/projects/phone-mockup.png" style="width: 33%; float: right; margin: 0 0 2em 2em;">

In order to ensure that inbound text messages are never lost, I helped build out a “front-end” micro-service that sits between Twilio and AdmitHub’s application servers. The purpose of this additional layer was to store all incoming messages from Twilio and forward them along to a heavy-weight application server. By keeping the micro-service small and stateless, it could be quickly scaled up and down to meet rapidly changing load demands, while never missing a message.

The system has held up in both testing and real-world high-load situations (college fairs, product launches, etc…). With minimal hardware, <strong>the system has been shown to handle tens of thousands of concurrent messages</strong> while never missing a beat.

## Facebook and Web

While text messaging was AdmitHub’s initial bread and butter, they quickly realized that students use a variety of messaging platforms.

In light of this, I helped AdmitHub unbraid their messaging system’s internal logic from the Twilio-specific transport code. By correctly architecting this abstraction, we were able to add additional messaging transports, such as a web messaging client and an integration with <a href="https://www.messenger.com/t/1736529336578069">Facebook Messenger</a>.

By expanding to new messaging mediums, AdmitHub was able to reduce the friction of communicating with students who were reluctant to provide their phone numbers.
