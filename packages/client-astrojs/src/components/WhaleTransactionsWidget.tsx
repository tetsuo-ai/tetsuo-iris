import React from 'react';

const transactions = [
  {
    "transaction_hash": "hGbTbGtE82qgTABgBhEkHpv1mRV8VQiw8UJ1qR5XZgUDWSDDHGHBs89ozintHsRSKEgoSYRASwoY9XtPJfaRz6G",
    "amount_tokens": 82015.226463,
    "amount_usd": 3111.01920942978,
    "price_usd": 0.0379322150726886,
    "timestamp": "2025-01-14T00:58:22Z"
  },
  {
    "transaction_hash": "4ux1LntaWW8wVdEY4M812D69NJBtxxDNNJguo8tLYg6Qp3M7yiZLE7ikUc1ZjUyj4pnANfStZHeFMkCu9weWnJAa",
    "amount_tokens": 133588.83441,
    "amount_usd": 5029.824,
    "price_usd": 0.037651529951694,
    "timestamp": "2025-01-14T00:56:51Z"
  },
  {
    "transaction_hash": "Fz5RoM8Gm2yLxyLuKzdM31wErLTq4oFDaVafDdRC1gW3H8eQ59DMox15Uqg3Ja77AW4D5uYDUwYequdqf6t7Qv7",
    "amount_tokens": 136806.837699,
    "amount_usd": 5103.0,
    "price_usd": 0.0373007671679944,
    "timestamp": "2025-01-14T00:56:33Z"
  },
  {
    "transaction_hash": "2yvrBjwTBVGx3z9irhrSEqtGzFRM34dVjtyaLCU3PB1Y1nzfV2HaEX6KesKcfncit2YAz1KnNRw7kJD8QdnjDBCA",
    "amount_tokens": 118273.519836,
    "amount_usd": 4405.746202528,
    "price_usd": 0.0372504869106549,
    "timestamp": "2025-01-14T00:46:37Z"
  },
  {
    "transaction_hash": "2Zw2zMWwZbJgKRN8hNPNzdWbaS838yZQ3j7kenVA4f8YzvsN1GLYXUXiJqQVVSXfLWSgJxujmffMdikcYkp9pMHW",
    "amount_tokens": 57759.231915,
    "amount_usd": 2138.1826845302,
    "price_usd": 0.03701889055029,
    "timestamp": "2025-01-14T00:43:54Z"
  },
  {
    "transaction_hash": "4CbmgsVgsbjjmFKYpB2mD8FtUCnpvc2AmieAH4cUBVMcnkmHFgGSqet9YQTqbh6waqj52iNQpjhJhrsSGYPApQq7",
    "amount_tokens": 49108.252978,
    "amount_usd": 1808.496,
    "price_usd": 0.0368267224006154,
    "timestamp": "2025-01-14T00:43:27Z"
  },
  {
    "transaction_hash": "gzPuma2Yro9z6GaeEPJYDxBvGXRp75ECezbmjVdf4erVcBTtSvjD93x1y7LJ2CgrnGKXW3iKKTvj8VQBavkb9RQ",
    "amount_tokens": 92834.162685,
    "amount_usd": 3424.232,
    "price_usd": 0.0368854729871257,
    "timestamp": "2025-01-14T00:40:51Z"
  },
  {
    "transaction_hash": "2Cfjr4zLMHs3994s4fDS7u4hUM5YLr453exwmJCjRPRxZiNRHLCk3UcwC2SY6378WZVVxCbRmKj3Qv4xfEiK64fr",
    "amount_tokens": 102103.746757,
    "amount_usd": 3736.80706560266,
    "price_usd": 0.0365981385041237,
    "timestamp": "2025-01-14T00:40:48Z"
  },
  {
    "transaction_hash": "4Hh4Co1z45v3ieisvaQVNYggv1kmDCiS8f2uE5BjLvb6qCnisy1Q8g65rSd74tCdykJr7kDCfZ5gb82ZWkiuwout",
    "amount_tokens": 106610.962872,
    "amount_usd": 3946.77728420216,
    "price_usd": 0.0370203699308182,
    "timestamp": "2025-01-14T00:29:31Z"
  },
  {
    "transaction_hash": "5nhLFgetjsMMVjUWP4Sj4VBLvVncmgYZKrPHcXtkfobeRk1gen8omP5SbFRvWzo5ciUcp6Ky5h9nRSPqt7A8aNNX",
    "amount_tokens": 173097.774563,
    "amount_usd": 6386.8,
    "price_usd": 0.0368970659277626,
    "timestamp": "2025-01-14T00:29:13Z"
  },
  {
    "transaction_hash": "3aYc8dGwJxhD4fWMzfTstDQCaB5jqPrHSwCUsMQV3w8744GFxGNGfWDLh3MsW7KC6su6gLZoGeRbZ7vTZYiAWGVW",
    "amount_tokens": 72095.968349,
    "amount_usd": 2641.46387699025,
    "price_usd": 0.0366381635128823,
    "timestamp": "2025-01-14T00:27:38Z"
  },
  {
    "transaction_hash": "2oTRMNh9v6S6rmj8aJT7tqCQierHyBGXk5MbM3HiKsncYWkyTftW3aUtm6gy67KskJZY1CfzYCHyq1zgDFGQzf7U",
    "amount_tokens": 57722.149092,
    "amount_usd": 2101.0570117722,
    "price_usd": 0.0363994938654042,
    "timestamp": "2025-01-14T00:26:23Z"
  },
  {
    "transaction_hash": "67erKnSNDqB56eNtbNmU6UVE6zUu2egwh2vi5SJENLmAM8rWot4PdBEpquvp962oQDCUBQKR1vq9YFuLiGRwDUbA",
    "amount_tokens": 131972.41695,
    "amount_usd": 4759.22257080482,
    "price_usd": 0.0360622521038463,
    "timestamp": "2025-01-14T00:25:59Z"
  },
  {
    "transaction_hash": "2o1hBDab666y4f3XgcvNhpiwEpRaFriKYAwGuGNTJsFmknCtvga3v5WNFdZ5Luic3Zx7neMTL4pCDTWGC7hR6TAA",
    "amount_tokens": 42007.438925,
    "amount_usd": 1505.95119200673,
    "price_usd": 0.0358496311735512,
    "timestamp": "2025-01-14T00:15:59Z"
  },
  {
    "transaction_hash": "boh8XsD2bm1JZEjKGsXGxn2Si9TppN549HWacjugttTmb12K4sdhNgFLJFvxL411SjvZd66LGk75coQTqMURaif",
    "amount_tokens": 30707.826773,
    "amount_usd": 1092.54,
    "price_usd": 0.0355785516206123,
    "timestamp": "2025-01-14T00:15:46Z"
  },
  {
    "transaction_hash": "5mi8kgBfGdDtxCTgr5vfBH3khGewDzxpEMxFNmGYqusPFrAMB1Nez2Z5se91j8MtuEBSKyrz1kbu2ijv7PR6VZni",
    "amount_tokens": 56443.314833,
    "amount_usd": 2001.5129606164,
    "price_usd": 0.0354605849521474,
    "timestamp": "2025-01-14T00:14:56Z"
  },
  {
    "transaction_hash": "3zuCB1Y31JbyqgNautErump4MPoAtDGXB3xbNdJ789hGr88nQsYhvwx9rC3eGPQJ4LnBYFXenxGPuMEFkdaMrF5R",
    "amount_tokens": 51254.002338,
    "amount_usd": 1830.44651678988,
    "price_usd": 0.035713240591804,
    "timestamp": "2025-01-14T00:04:01Z"
  },
  {
    "transaction_hash": "4ZyN2misF8TadbpQmSSqSxG49AXZtTUZPE7ECeLwP2EZQDyTJvC2YBQasF25xecJJc9z5XfZbY3n8v1Kq35LrqBe",
    "amount_tokens": 56531.584769,
    "amount_usd": 2010.36,
    "price_usd": 0.0355617131239953,
    "timestamp": "2025-01-14T00:03:59Z"
  },
  {
    "transaction_hash": "3Ug8S1zDxTCBecueNqiFZzz57f1hwcyyA97oHHya1qDGpsUuwVZgFY2yuHQ6mvxDXExLGC2HCAt8qqQbuDi25VWr",
    "amount_tokens": 263087.320519,
    "amount_usd": 9038.56368092075,
    "price_usd": 0.0343557555836979,
    "timestamp": "2025-01-14T00:03:05Z"
  },
  {
    "transaction_hash": "3WmCesu24t2b7LNywiWbJ1WbmqvFTTHyWdnagVsHx1iWmufSczbpkWiWaK9euDe9xq6S3bpfeaJPSsf1xZR6cyg4",
    "amount_tokens": 31276.771624,
    "amount_usd": 1093.301875,
    "price_usd": 0.0349557137208197,
    "timestamp": "2025-01-14T00:03:05Z"
  },
  {
    "transaction_hash": "3bc6Y3mg4yLqGT5LFXfMC3txkL8YJ8c9txJpNQAquyTb26LdRCoH6Axtb1P3wVAx9aveU4EFNric8gj9CMHTibHT",
    "amount_tokens": 75277.103609,
    "amount_usd": 2657.3312,
    "price_usd": 0.0353006568079792,
    "timestamp": "2025-01-14T00:03:05Z"
  },
  {
    "transaction_hash": "42wy5itUzPpfCnpHqmu5hxsnHRjEtN5NJ4sbMyjtqc72X8XCsaLp3oPB4dekEebPZMCXzceMh1ncR9pAeZMchDkb",
    "amount_tokens": 50236.760067,
    "amount_usd": 1749.283,
    "price_usd": 0.0348207766119274,
    "timestamp": "2025-01-14T00:03:05Z"
  },
  {
    "transaction_hash": "XbAgzMpke3HmXhJ9NJhmuzZqCZR5m8DjqoNk5mpRYs74zpqc5MyXv8eBCL3Lmn44FkqTZj6ufBt3LVovaj5Xq6t",
    "amount_tokens": 60756.940812,
    "amount_usd": 2133.3504,
    "price_usd": 0.0351128672952975,
    "timestamp": "2025-01-14T00:03:05Z"
  },
  {
    "transaction_hash": "3NWZJ3TrLGdfJnGppD1uDs8Q3wsfbqXAUG39QAqGy9xcE8UhW5DJNQRyMVtDsQMY4CfezniAWRaqjG4gVtpxCiJX",
    "amount_tokens": 34766.646294,
    "amount_usd": 1257.21036,
    "price_usd": 0.0361613930020328,
    "timestamp": "2025-01-13T23:59:13Z"
  },
  {
    "transaction_hash": "3E8hwFL5w4yjkpFVSw3pSQp1EDNV3YKs2NgU15qNohg3vkeipfSs6F66R1MFMzMYPMbqZAVakATRrmciMFyHALsc",
    "amount_tokens": 32253.74782,
    "amount_usd": 1167.7981272534,
    "price_usd": 0.0362065870227108,
    "timestamp": "2025-01-13T23:54:06Z"
  }
];

export default function WhaleTransactionsWidget() {
  return (
    <table className="w-full table-auto jetbrains-mono-400 text-zinc-200">
      <thead className="sticky top-0 bg-zinc-900">
        <tr className="text-left">
          <th className="p-2">Date</th>
          <th className="p-2">Price</th>
          <th className="p-2">Volume</th>
          <th className="p-2">TETSUO</th>
          <th className="p-2">Txn Hash</th>
        </tr>
      </thead>
      <tbody>
      {transactions.map((txn, i) => (
        <tr key={i} className="outline outline-1 outline-zinc-900">
          <td className="p-2">{new Date(txn.timestamp).toLocaleString(navigator.languages)}</td>
          <td className="p-2">${txn.price_usd.toFixed(5)}</td>
          <td className="p-2">${txn.amount_usd.toFixed(2)}</td>
          <td className="p-2">
            {Intl.NumberFormat(navigator.languages, {
              notation: 'compact',
              compactDisplay: 'short',
            }).format(txn.amount_tokens)}
          </td>
          <td className="p-2">
            <a
              href={`https://solscan.io/tx/${txn.transaction_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-500"
            >
              {txn.transaction_hash.slice(0, 4)}....{txn.transaction_hash.slice(-4)}
            </a>
          </td>
        </tr>
      ))}
      </tbody>
    </table>
  );
}
