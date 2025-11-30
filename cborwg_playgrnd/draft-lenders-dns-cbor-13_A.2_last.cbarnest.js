10([
  'nc',
  10([
  simple(0),
  h'20010db800000000000000000000',
  h'FF /dummy/', [
    /* PTR (12) question for "example.org" */
    [
    /* appends 0 => ["example", "org"] to virtual packing table */
    "example",
    /* appends 1 => ["org"] to virtual packing table */
    "org",
      12
    ],
    /* Answer section: */
    [[
      /* PTR (12) for "example.org" */
      /* (both elided since they are the same as in question) */
      /* is "_coap._udp.local" with TTL 3600 */
      3600,
      /* appends 2 => ["_coap", "_udp", "local"] to virtual packing table */
    "_coap",
    /* appends 3 => ["_udp", "local"] to virtual packing table */
    "_udp",
    /* appends 4 => ["local"] to virtual packing table */
    "local"
    ]],
    /* Authority section: */
    [
      [
        /* NS (2) for "example.org" */
        /* (name elided since its the same as in question) */
        /* is "ns1.example.org" with TTL 3600 */
        3600, 2,
        /* appends 5 => ["ns1", simple(0)] to virtual packing table */
      "ns1", simple(0)  /* expands to ["example", "org"] */
      ],
      [
        /* NS (2) for "example.org" */
        /* (name elided since its the same as in question) */
        /* is "ns2.example.org" with TTL 3600 */
        3600, 2,
        /* appends 6 => ["ns2", simple(0)] to virtual packing table */
      "ns2", simple(0)  /* expands to ["example", "org"] */
      ]
    ],
    /* Additional section */
    [
      [
        /* AAAA (28) for "_coap._udp.local" */
        /* is 2001:db8::1 with TTL 3600 */
        simple(2),    /* expands to ["_coap", "_udp", "local"] */
        3600, 28, h'1d0001'
      ],
      [
        /* AAAA (28) for "_coap._udp.local" */
        /* is 2001:db8::2 with TTL 3600 */
        simple(2),    /* expands to ["_coap", "_udp", "local"] */
        3600, 28, h'1d0002'
      ],
      [
        /* AAAA (28) for "ns1.example.org" */
        /* is 2001:db8::35 with TTL 3600   */
        simple(5),    /* expands to ["ns1", ["example", "org"]] */
        3600, 28, h'1d0035'
      ],
      [
        /* AAAA (28) for "ns2.example.org" */
        /* is 2001:db8::3535 with TTL 3600 */
        simple(6),    /* expands to ["ns2", ["example", "org"] */
        3600, 28, h'1d3535'
      ]
    ]
  ]
])
])
