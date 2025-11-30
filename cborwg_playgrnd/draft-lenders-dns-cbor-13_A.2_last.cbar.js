10([
  simple(0),
  h'20010db800000000000000000000',
  'nc',
  [
    ["example", "org"],
    ["_coap", "_udp", "local"],
    ["ns1", 0],
    ["ns2", 0]
  ],
  [
    /* PTR (12) question for "example.org" */
    [
      simple(0),
      12
    ],
    /* Answer section: */
    [[
      /* PTR (12) for "example.org" */
      /* (both elided since they are the same as in question) */
      /* is "_coap._udp.local" with TTL 3600 */
      3600,
      /* appends 2 => ["_coap", "_udp", "local"] to virtual packing table */
      simple(2)
    ]],
    /* Authority section: */
    [
      [
        /* NS (2) for "example.org" */
        /* (name elided since its the same as in question) */
        /* is "ns1.example.org" with TTL 3600 */
        3600, 2,
        /* appends 5 => ["ns1", simple(0)] to virtual packing table */
        simple(5)  /* expands to ["example", "org"] */
      ],
      [
        /* NS (2) for "example.org" */
        /* (name elided since its the same as in question) */
        /* is "ns2.example.org" with TTL 3600 */
        3600, 2,
        /* appends 6 => ["ns2", simple(0)] to virtual packing table */
        simple(6)  /* expands to ["example", "org"] */
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
