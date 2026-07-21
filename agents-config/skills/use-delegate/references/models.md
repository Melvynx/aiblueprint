# Delegation models: current rankings and pricing

Last verified: 2026-07-20

**Refresh protocol**: if the date above is older than 14 days, refresh BEFORE planning a big delegation batch. Delegate the research (exa-search skill or a read-only executor): pull the DeepSWE leaderboard (https://deepswe.datacurve.ai/) and the provider pricing pages, then update both tables and the date. DeepSWE is the reference signal: 113 original long-horizon engineering tasks, contamination-free, cost-per-task published per model.

## DeepSWE leaderboard (best config per model, snapshot 2026-07-17)

| Model | Pass@1 | Avg cost/task | Read |
|---|---|---|---|
| gpt-5.6-sol [max] | 73% | $8.39 | Top score, best cost among frontier |
| claude-fable-5 [max] | 70% | $21.63 | Host tier: 2.6x sol cost, never a delegation target |
| gpt-5.6-terra [max] | 70% | $4.95 | Sol-level score at 59% of the cost |
| kimi-k3 [max] | 69% | $4.65 | Within noise of terra/sol, cheapest of the top pack |
| gpt-5.6-luna [max] | 67% | $3.03 | Acceptable floor for trivial bulk work |
| gpt-5.5 [xhigh] | 67% | $7.23 | Superseded by the 5.6 family |
| claude-opus-4.8 [max] | 59% | $13.22 | Dominated: lower score, higher cost |

## API list pricing (per 1M tokens)

| Model | Input | Cached input | Output | Context |
|---|---|---|---|---|
| Kimi K3 (Moonshot) | $3.00 | $0.30 | $15.00 | 1M |
| GPT-5.6 Sol | $5.00 | $0.50 | $30.00 | 1.05M |
| GPT-5.6 Terra | $2.50 | $0.25 | $15.00 | 1.05M |
| GPT-5.6 Luna | $1.00 | ~$0.10 | $6.00 | 1.05M |

## Access notes (this machine)

- Kimi K3: flat-rate through the kimi-for-coding subscription in opencode (`-m kimi-for-coding/k3`), so marginal cost per delegation is ~zero. The opencode-go gateway is unfunded (insufficient balance): do not route through it. Open weights due 2026-07-27; 1M context; native vision; Terminal-Bench 88.3.
- GPT-5.6 sol/terra/luna: covered by the Codex subscription (`codex exec -m gpt-5.6-<tier>`); config default is sol + effort high.
- Current call (2026-07-20): Kimi K3 is the default executor (top-pack score, subscription-covered). Terra for low-stakes tasks. Sol for compute-heavy work. Luna only for trivial bulk edits.
