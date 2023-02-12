# muSCTP: Multiflow Unsymmetric Sessionful Concise Tunneled Protocol

Ranging network protocols (boundaries really are blurred) by upper scale:

```
      Very      . Low end     . Middle    . Higher   .   Very      . Ultra High
   constrained  .             . (today)   . end      . Highload    . (future)
                .             .           .          .             .
   IoT/Embedded . older hw    . casual    . low-end  . Big DC      .
                . and sw,     . user's    . servers, . servers,    .
                . future      . desktop   . VMs      . HPC clus-   .
                . embedded    .           .          . ters        .
                .             .           .          .             .
   < 1 Mbps,    . 10-100 Mbps . 1 Gbps,   . 10 Gbps, . 40-800 Gbps . > 8 Tbps
   MTU 60-128   . IPv4        . IPv4/IPv6 . IPv4/6   . IPv6/custom .
   Bytes        \__ MTU 576-1500 Bytes __/ \_ MTU 1500-9000 Bytes _/
                .             .           .          .             .
   |<------ CoAP ------>|     .           .          .             .
                .             .           .          .             .
             |<----------------------- TCP ----------------------->|
                .             .           .          .             .
          |<------------------------ muSCTP ------------------------>|
                .             .           .          .             .
                .   |<--------------------- SCTP --------------------->|
                .             .           .          .             .
                .     |<--------------------- DCCP --------------------->|
                .             .           .          .             .
                .         |<-------------------- QUIC -------------------->|
                .             .           .          .             .
   |<-------x-----x--- custom protocols per task / field ---x--------x------->|
```

### Message-oriented transport and session protocol suitable for IoT and censorship circumventing

This is a general-purpose OSI Layer 4 (Transport) and Layer 5 (Session) protocol, offering to applications both a message-oriented transport, like SCTP, and unstructured bytestream transport, like TCP or QUIC (in fact, it may be viewed as "QUIC done right").

Like SCTP and QUIC, muSCTP multiplexes several streams inside one association ("connection", in TCP terms), while eliminating so called "Head-of-Line Blocking" (HoL) - a packet loss in one stream blocks delivery in just that stream and does not cause the entire connection to stall (TCP problem), allowing for parallel delivery in other streams.

The most important disctinctions of muSCTP from predecessor protocols (TCP, SCTP, QUIC) are:

1. Ability to work on extremely low packet sizes - e.g. just 33 byte UDP payload of minimal-sized 6LoWPAN packet is enough!
2. Generalizing traditional "Layer 3 is IP or IPv6 packet" to _tunneling over arbitrary protocols_ (UDP being just the simplest case, but it is easy to define a new tunnel type) and support for tunneling over **asymmetric protocols** - where server can't initiate packets on it's own but only can reply to client (e.g. exactly one client packet in HTTP/1.0 request and exactly one server's reply to it).
3. There is no concept of "port" (except of in tunnel addresses) - there are "services" at association setup and ephemeral ids for subsequent packets.

Encryption and message authentication are done in per-packet (IPsec) style, because TLS does not satisfy such requirements.

Despite of such hard constraints, muSCTP offers less than in SCTP but still reasonable limits to user application:

* up to 1024 concurrent structured streams of ordered messages, up to 1 Gb each (HoL is per stream)
* up to 1024 concurrent structured streams of unordered ("urgent") messages, up to (depending on priority) 64 Kb - 512 Mb each (HoL is per message)
* up to 1024 concurrent unstructured byte streams (HoL is per stream), each is like one TCP connection or QUIC stream

Given that typical browser does not make more than several dozens HTTP/1.1 connections concurrently (i.e. at the same time), and that default maximum for simultaneous QUIC streams in nginx is 128, these limits are quite enough not only for IoT but also for "unconstrained" Internet's today end-user applications.

And major advantage or muSCTP over QUIC is **multipath** - ability not to just NAT rebinding when client's address changes, but parallel work over different addresses and even protocols (e.g. a mobile client utilizing both Wi-Fi and EDGE at the same time)!

### Intent and idea origin

It was discovered that operating on constrained MTU links such as 6LoWPAN and censorship circumventing tasks have something in common, so this was abstracted away and formulated in academic form in 3 point list above. For example, consider some The Great Draconian Land Firewall which was circumvented by encapsulating into short "ping" packets. Then, this way was discovered by censors and fixed, now people are doing exchange over HTTP/1.0 (1.1 and HTTPS is prohibited there) to urls like /cat0001234.jpg, and this is also now going to be found and denied. Now they are going to post real cat images with just _some_ bytes being packet data now.

Every such step in this cat-and-mouse game is a pain. Ways of tunneling generic protocols (TCP) on constrained links are often ineffective, especially if the application above does know nothing about it. Specialized application protocols could be much better, but then at each step of this war is a boring task of reimplementing e.g. retransmits, `cwnd` etc. in _slightly different_ way. Abstracting such things and keeping underlying modules as simple as possible may be a way to react more fast.

The opposite use case is also true - this may be used in "peaceful" Internet, too. Consider an example below of 33-byte 6LoWPAN and 90-byte direct 802.15.4 frame on the same node - given a slow speed of adoption of different ways of header compression (e.g. the time between RFC 4919, RFC 6282 and RFC 7400), muSCTP could offer a faster IoT development at least in experimentation area.

## Next step in evolution of transport protocols

To give reader a very broad perspective, muSCTP could be described as borrowing and mixing concepts from SCTP, CoAP, DCCP, SST, TLS, IPsec/IKEv2, Multilink PPP, `sysctl()`, MQTT and even X11.

### From a higher (application) level view

muSCTP is oriented on working with _messages_ instead of unstructured bytes, eliminating the need of endless reinventing the wheel by many protocols designers of their own scheme for spliiting TCP's bytes to records (from simplest Type-Length-Contents protocols to very complex syntax as in IMAP4). Messages are blocks of bytes of length known with advance, together with some bits of information left for Presentation Layer (Layer 6 of OSI). In ordered streams, messages have 64-bit identificators unique within a _session_, with support for acknowledgement by application and retransmit of messages in case of connection loss and restart - if such Quality of Service was requested (this is almost the same as in MQTT, for familiar readers).

Sessions allow to store state at client/server, both for retransmitting lost messages and to speed up initial exchange (e.g. crypto setup), which is crucial for slow links with small packet sizes. Also, sessions allow for client authentication be done in proper, "traditional" way "once at the start", instead of flawed "HTTP Cookie" model leading to problems from unnecessary wasting resources to numerous security attacks such as ALPACA or CRIME (BTW, with message paradigm compression could be disabled for individual messages, eliminating possibility of such attacks even if application really needs to pass such secrets).

Having messages also allows for eaiser scheduling data on different paths - something which is very hard to be done in performant way (see Multipath TCP challenges).

### From a lower (network/tunnel) level view

muSCTP is a Host-to-Host protocol, and it is agnostic to underlying protocol - lower-level ("tunnel") protocol must provide for at least checksum, and may be for encryption/integrity checking.

Instead of rigid binding "Layer 4 packet has 16-bit port number and goes directly into Layer 3 packet, and only IPv4 or IPv6", muSCTP eliminates the problem of managing finite 16-bit number port space, blurry divided to public and ephemeral parts, by offering an up to 16-byte "service name" at connection setup and pair of 29-bit numbers serving like "ephemeral ports" later. Then, muSCTP packet is encapsulated into "tunnel protocol" packet, selected from supported "tunnel backends".

In simple and understandable case, a "tunnel" may be just several fields in UDP payload - and tunnel address will, of course, have "IP:port" pair. This is just how QUIC, or SCTP tunneling over port 9899 [RFC 6951], or DCCP-UDP Encapsulation over port 6511 [RFC 6773] works.

But it is also could be encapsulated directly into IP datagram, into Ethernet frame, or even some other application protocol like HTTP - a "tunnel" specification and implementation must provide way how to do this. Tunnel addresses are given as standard `sockaddr_storage` structures (up to 128 bytes), and an endpoint can have several of them, possibly of different protocols, at the same time.

For example, consider IEEE 802.15.4 node with two tunnels:
* one is UDP in 6LoWPAN for connectivity with outer Internet, with small available size, possibly just 33 bytes
* other is for connectivity with neighbour node when muSCTP packet os directly encapsulated into 802.15.4 MAC Frame with AES disabled (muSCTP utilizing own crypto) so that from 102 packet bytes about 90 are available for user data

Another node may have same protocols, and two such node could possibly exchange packets over both of them, employing load balancing.

## Decentralized management and extensibility

Several places in protocol are using up-to-128-byte strings as identificators, while negotiating abbreviated versions of them as numbers for brewity, called "atoms". This allows to avoid long cycles of assigning "what which number means" and deprecating them for many years, while still allowing for some common denominators be managed by IANA (see how this is done for SSH). For example, an implementation could support tunnels named "UDP-example1" and then "UDP-newcrypto-my.org" without need to request them from central authority. This is also why crypto is done at tunnel level - be the security flaw be discovered, a tunnel module could be replaced with newer version, leaving core protocol untouched - in contrast to TLS version deprecating cycles lasting for decades.

# To be continued

# LICENSE / Copyright

The protocol specification will be eventually fully translated to English and copyright passed to IETF (or at least IRTF) as part of standard RFC issue process.

Portions are taken from usrsctp implementation, subject to their copyrights.

The rest of this implementation is available at triple+ license:

1. One of listed open-source licenses, provided that using project's source size is more than twice as this (muSCTP) implementation's source size:
    - BSD for projects under BSD license (e.g. BSD-family operating systems kernels).
    - Perl Artistic License for Perl itself and projects written in Perl, or projects under Artistic license
    - Tcl/Tk License for Tcl (and projects written in Tcl)
2. CDDL for all others.
3. Or you could buy commercial license if neither of these is appropriate for you.

# NOTA BENE

1. This is **not** a ready "plug into your app" library - chances are high you will need to write a "tunnel backend" for your lower-level protocol (see "Intent and idea origin" section above). However, the entire intent of muSCTP is to abosorb complexity in itself and make tunnel backends as simple ("dumb") as possible (except of crypto part).
2. This is a VERY early Work In Progress. The spec is not settled, don't expect it even to compile except sometimes.

