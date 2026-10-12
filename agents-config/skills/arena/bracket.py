#!/usr/bin/env python3
"""bracket.py: the tournament state machine behind /arena.

The whole arena lives in one JSON file (arena.json), so the orchestrator never
loses track of who is alive, who fought whom and what happens next, even if its
own context gets compacted halfway through a 100-agent run.

    python3 bracket.py plan --agents 100             # rounds, sub-agent calls and waves. Writes nothing.
    python3 bracket.py init --agents 100 --seed 7 --task-file task.md [--baseline-file old.md]
    python3 bracket.py init --quick --task "..."     # 16 agents
    python3 bracket.py next                          # what to do now, and the exact command for it
    python3 bracket.py prompts <phase>               # write the sub-agent briefs, list the jobs left, in waves
    python3 bracket.py check <phase>                 # which outputs are still missing
    python3 bracket.py pairings                      # this round's matches, including the bye
    python3 bracket.py collect                       # read every judge verdict and record the winners
    python3 bracket.py record <match_id> <winner_id> [--reason "..."]
    python3 bracket.py advance                       # close the round, eliminate the losers, pair the survivors
    python3 bracket.py status                        # alive and eliminated, per round
    python3 bracket.py winner                        # the survivor, what it beat, the attacks it survived
    python3 bracket.py card <agent_id>               # one competitor's strategy card

Phases, in order: spawn, then per round attack, defend, judge; then final (only when
there is a rejected answer to beat). Every command takes --dir; without it, the run
named in .arena/LATEST is used.

Python 3.8+, standard library only.
"""
import argparse
import json
import math
import os
import random
import re
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
SELF = os.path.abspath(__file__)
STRATEGIES_PATH = os.path.join(HERE, "strategies.json")
SKILL_PATH = os.path.join(HERE, "SKILL.md")
RUBRIC_PATH = os.path.join(HERE, "rubric.md")

DEFAULT_AGENTS = 100
QUICK_AGENTS = 16
DEFAULT_WAVE = 10          # Claude Code runs at most 10 tool calls at once by default
ROOT = ".arena"
LATEST = "LATEST"
STATE_FILE = "arena.json"
PHASES = ("spawn", "attack", "defend", "judge", "final")
TEMPLATES = ("competitor", "attacker", "defender", "judge", "final")
CALLS_PER_MATCH = 5        # 2 attacks, 2 defenses, 1 judge

# Mirrors the table in rubric.md. tests/test_bracket.py checks they agree.
WEIGHTS = (
    ("correctness", 30),
    ("completeness", 25),
    ("specificity", 15),
    ("robustness", 20),
    ("clarity", 10),
)


class ArenaError(Exception):
    pass


# ---------------------------------------------------------------- the cards

def load_strategies(path=STRATEGIES_PATH):
    with open(path, encoding="utf-8") as fh:
        data = json.load(fh)
    for key in ("reasoning", "workflows", "strategies"):
        items = data.get(key) or []
        if not items:
            raise ArenaError("strategies.json has no '%s' entries" % key)
        ids = [it["id"] for it in items]
        if len(set(ids)) != len(ids):
            raise ArenaError("strategies.json has a duplicate id in '%s'" % key)
        for it in items:
            if not it.get("name") or not it.get("how"):
                raise ArenaError("strategies.json entry '%s' needs a name and a how" % it["id"])
    return data


def combo_count(data):
    return len(data["reasoning"]) * len(data["workflows"]) * len(data["strategies"])


def _edge_colour(edges, k):
    """Properly edge-colour a bipartite (multi)graph with k colours, then balance it.

    edges are (row, col) pairs and k must be at least the largest degree. Proper
    means no two edges at the same row, or at the same col, share a colour. Every
    bipartite graph has one (Konig), found here with alternating-path swaps. Then
    de Werra's swaps even the colour classes out until each is used floor or ceil
    of len(edges) / k times.
    """
    colour = [None] * len(edges)
    at = ({}, {})

    def slot(side, node):
        return at[side].setdefault(node, {})

    def put(e, c):
        u, v = edges[e]
        colour[e] = c
        slot(0, u)[c] = e
        slot(1, v)[c] = e

    def take(e):
        u, v = edges[e]
        del slot(0, u)[colour[e]]
        del slot(1, v)[colour[e]]

    def walk(side, node, first, other):
        path, c = [], first
        while True:
            e = slot(side, node).get(c)
            if e is None or e in path:
                return path
            path.append(e)
            node = edges[e][1 - side]
            side = 1 - side
            c = other if c == first else first

    def swap(path, a, b):
        new = {e: (b if colour[e] == a else a) for e in path}
        for e in path:
            take(e)
        for e in path:
            put(e, new[e])

    for e, (u, v) in enumerate(edges):
        free_u = [c for c in range(k) if c not in slot(0, u)]
        free_v = set(c for c in range(k) if c not in slot(1, v))
        c = next((c for c in free_u if c in free_v), None)
        if c is None:
            a, b = free_u[0], min(free_v)
            swap(walk(1, v, a, b), a, b)
            c = a
        put(e, c)

    while True:
        count = [0] * k
        for c in colour:
            count[c] += 1
        hi = max(range(k), key=lambda c: (count[c], -c))
        lo = min(range(k), key=lambda c: (count[c], c))
        if count[hi] - count[lo] <= 1:
            return colour
        swapped = False
        for side in (0, 1):
            for node in sorted(at[side]):
                s = at[side][node]
                if hi in s and lo not in s:
                    path = walk(side, node, hi, lo)
                    if sum(colour[e] == hi for e in path) > sum(colour[e] == lo for e in path):
                        swap(path, hi, lo)
                        swapped = True
                        break
            if swapped:
                break
        if not swapped:
            raise ArenaError("could not balance the strategy cards")


def deal(n, seed, data):
    """Deal n distinct (reasoning, workflow, strategy) index triples, one per agent.

    Deterministic for a given seed and strategies.json. Guarantees:
      - no card is dealt twice
      - every reasoning mode, workflow and strategy is dealt as evenly as possible
        (any two counts differ by at most 1), so 100 agents use all of them
      - while every reasoning mode and every workflow has no more agents than there
        are strategies (up to 144 agents with the shipped cards): no two agents share
        a reasoning mode and a workflow, a reasoning mode and a strategy, or a
        workflow and a strategy. Any two agents differ in at least two of the three.

    How: agent slot i gets reasoning i mod R and workflow (i + i // lcm(R, W)) mod W,
    which never repeats a workflow inside a reasoning mode and stays balanced. The
    strategies are then a balanced proper edge colouring of that reasoning x
    workflow grid. The seed shuffles every list's labels and who gets which card.
    """
    R, W, S = len(data["reasoning"]), len(data["workflows"]), len(data["strategies"])
    total = R * W * S
    if n < 1 or n > total:
        raise ArenaError("can deal between 1 and %d cards, not %d" % (total, n))
    rng = random.Random("arena-deal:%s" % seed)
    pr, pw, ps = list(range(R)), list(range(W)), list(range(S))
    rng.shuffle(pr)
    rng.shuffle(pw)
    rng.shuffle(ps)
    lcm = R * W // math.gcd(R, W)
    cells = [(i % R, (i + i // lcm) % W) for i in range(n)]
    deg_r = max(sum(1 for r, _ in cells if r == x) for x in range(R))
    deg_w = max(sum(1 for _, w in cells if w == x) for x in range(W))
    if deg_r <= S and deg_w <= S:
        order = list(range(n))
        rng.shuffle(order)
        colours = _edge_colour([cells[i] for i in order], S)
        strategy_of = {order[j]: colours[j] for j in range(n)}
        triples = [(r, w, strategy_of[i]) for i, (r, w) in enumerate(cells)]
    else:
        # Past that size a repeat pair is unavoidable. Stay balanced and never repeat a card.
        count, pairs_rs, pairs_ws, used, triples = [0] * S, {}, {}, set(), []
        for r, w in cells:
            low = min(count)
            s = min((c for c in range(S) if (r, w, c) not in used),
                    key=lambda c: (count[c] - low, pairs_rs.get((r, c), 0), pairs_ws.get((w, c), 0), c))
            used.add((r, w, s))
            count[s] += 1
            pairs_rs[(r, s)] = pairs_rs.get((r, s), 0) + 1
            pairs_ws[(w, s)] = pairs_ws.get((w, s), 0) + 1
            triples.append((r, w, s))
    dealt = [(pr[r], pw[w], ps[s]) for r, w, s in triples]
    rng.shuffle(dealt)
    return dealt


def agent_ids(n):
    width = max(3, len(str(n)))
    return ["a%0*d" % (width, i) for i in range(1, n + 1)]


def bracket_sizes(n):
    """Alive count at the start of each round, ending at 1. 100 -> 50 -> 25 -> 13 -> 7 -> 4 -> 2 -> 1."""
    sizes = [n]
    while sizes[-1] > 1:
        sizes.append((sizes[-1] + 1) // 2)
    return sizes


# ---------------------------------------------------------------- paths

def spawn_out(d, aid):
    return os.path.join(d, "r0", aid + ".md")


def attack_out(d, rnd, mid, attacker):
    return os.path.join(d, "r%d" % rnd, "%s.%s.attack.md" % (mid, attacker))


def defense_out(d, rnd, mid, aid):
    return os.path.join(d, "r%d" % rnd, "%s.%s.defense.md" % (mid, aid))


def revised_out(d, rnd, mid, aid):
    return os.path.join(d, "r%d" % rnd, "%s.%s.solution.md" % (mid, aid))


def verdict_out(d, rnd, mid):
    return os.path.join(d, "r%d" % rnd, "%s.verdict.json" % mid)


def final_out(d):
    return os.path.join(d, "final.verdict.json")


def prompt_path(d, rnd, job_id):
    sub = "final" if rnd is None else "r%d" % rnd
    return os.path.join(d, "prompts", sub, job_id + ".md")


def _has_output(path):
    return os.path.isfile(path) and os.path.getsize(path) > 0


# ---------------------------------------------------------------- the bracket

def new_state(n, seed, data, run_dir, wave=DEFAULT_WAVE, has_baseline=False):
    run_dir = os.path.abspath(run_dir)
    ids = agent_ids(n)
    agents = {}
    for aid, (r, w, s) in zip(ids, deal(n, seed, data)):
        agents[aid] = {
            "card": {
                "reasoning": dict(data["reasoning"][r]),
                "workflow": dict(data["workflows"][w]),
                "strategy": dict(data["strategies"][s]),
            },
            "solution": spawn_out(run_dir, aid),
            "alive": True,
            "eliminated_in": None,
            "eliminated_by": None,
            "byes": 0,
        }
    state = {
        "version": 1,
        "created": time.strftime("%Y-%m-%d %H:%M:%S"),
        "seed": seed,
        "agents_n": n,
        "cards_available": combo_count(data),
        "wave": wave,
        "dir": run_dir,
        "has_baseline": bool(has_baseline),
        "agents": agents,
        "rounds": [],
        "champion": None,
        "final": None,
    }
    open_round(state, ids)
    return state


def pair_round(state, rnd, alive):
    """Seeded pairing. An odd pool gives one bye, to an agent with the fewest byes so far.
    Where it can, it pairs agents with different reasoning modes, so every attack comes
    from a genuinely different angle. The first-listed side is random, which is the
    order the judge reads them in."""
    agents = state["agents"]
    rng = random.Random("arena-pair:%s:%d" % (state["seed"], rnd))
    pool = sorted(alive)
    rng.shuffle(pool)
    bye = None
    if len(pool) % 2:
        fewest = min(agents[a]["byes"] for a in pool)
        bye = next(a for a in pool if agents[a]["byes"] == fewest)
        pool.remove(bye)
    width = max(2, len(str(len(pool) // 2)))
    matches = []
    while pool:
        a = pool.pop(0)
        mode = agents[a]["card"]["reasoning"]["id"]
        j = next((k for k, b in enumerate(pool) if agents[b]["card"]["reasoning"]["id"] != mode), 0)
        b = pool.pop(j)
        if rng.random() < 0.5:
            a, b = b, a
        matches.append({
            "id": "r%d-m%0*d" % (rnd, width, len(matches) + 1),
            "a": a, "b": b,
            "winner": None, "loser": None, "reason": None,
            "survived": [], "scores": None, "source": None,
        })
    return matches, bye


def open_round(state, alive):
    """Open the next round, or crown the champion when one agent is left."""
    alive = sorted(alive)
    if len(alive) == 1:
        state["champion"] = alive[0]
        if state.get("has_baseline") and not state.get("final"):
            rng = random.Random("arena-final:%s" % state["seed"])
            x = "champion" if rng.random() < 0.5 else "baseline"
            state["final"] = {"X": x, "Y": "baseline" if x == "champion" else "champion", "result": None}
        return None
    rnd = len(state["rounds"]) + 1
    matches, bye = pair_round(state, rnd, alive)
    rd = {"n": rnd, "alive": alive, "matches": matches, "bye": bye, "closed": False}
    state["rounds"].append(rd)
    return rd


def current_round(state):
    if state["champion"] or not state["rounds"]:
        return None
    rd = state["rounds"][-1]
    return None if rd["closed"] else rd


def norm_agent(state, raw):
    raw = str(raw).strip().lower()
    if raw in state["agents"]:
        return raw
    digits = raw.lstrip("a")
    if digits.isdigit():
        for aid in state["agents"]:
            if int(aid[1:]) == int(digits):
                return aid
    raise ArenaError("no agent called '%s'" % raw)


def find_match(state, mid):
    rd = current_round(state)
    if rd is None:
        raise ArenaError("no round is open" + (" (the arena has a champion)" if state["champion"] else ""))
    raw = str(mid).strip().lower()
    for m in rd["matches"]:
        if m["id"] == raw:
            return rd, m
    tail = raw.split("-m")[-1].lstrip("m")
    if tail.isdigit():
        for m in rd["matches"]:
            if int(m["id"].split("-m")[-1]) == int(tail):
                return rd, m
    raise ArenaError("no match '%s' in round %d (run pairings)" % (mid, rd["n"]))


def record(state, mid, winner, reason=None, survived=None, scores=None, source="manual"):
    rd, m = find_match(state, mid)
    winner = norm_agent(state, winner)
    if winner not in (m["a"], m["b"]):
        raise ArenaError("%s is not in %s (%s vs %s)" % (winner, m["id"], m["a"], m["b"]))
    previous = m["winner"]
    m["winner"] = winner
    m["loser"] = m["b"] if winner == m["a"] else m["a"]
    m["reason"] = reason or None
    m["survived"] = list(survived or [])
    m["scores"] = scores
    m["source"] = source
    return m, previous


def advance(state):
    """Close the current round: eliminate every loser, carry the winners' revised
    solutions forward, give the bye its free pass, and open the next round."""
    rd = current_round(state)
    if rd is None:
        raise ArenaError("no round is open" + (" (the arena has a champion)" if state["champion"] else ""))
    unrecorded = [m["id"] for m in rd["matches"] if not m["winner"]]
    if unrecorded:
        raise ArenaError("round %d has %d unrecorded match(es): %s"
                         % (rd["n"], len(unrecorded), ", ".join(unrecorded)))
    survivors = []
    for m in rd["matches"]:
        loser = state["agents"][m["loser"]]
        loser["alive"] = False
        loser["eliminated_in"] = rd["n"]
        loser["eliminated_by"] = m["winner"]
        for aid in (m["a"], m["b"]):
            rev = revised_out(state["dir"], rd["n"], m["id"], aid)
            if _has_output(rev):
                state["agents"][aid]["solution"] = rev
        survivors.append(m["winner"])
    if rd["bye"]:
        state["agents"][rd["bye"]]["byes"] += 1
        survivors.append(rd["bye"])
    rd["closed"] = True
    open_round(state, survivors)
    return survivors


def rounds_played(state):
    return sum(1 for rd in state["rounds"] if rd["closed"])


def alive_ids(state):
    return sorted(a for a, v in state["agents"].items() if v["alive"])


# ---------------------------------------------------------------- verdicts

def weighted_total(scores):
    """0 to 100 from five 0 to 10 scores, weighted as in rubric.md. None if any is missing."""
    if not isinstance(scores, dict):
        return None
    total = 0.0
    for key, weight in WEIGHTS:
        v = scores.get(key)
        if isinstance(v, bool):
            return None
        try:
            v = float(v)
        except (TypeError, ValueError):
            return None
        total += max(0.0, min(10.0, v)) * weight
    return round(total / 10.0, 2)


def _truthy(v):
    if isinstance(v, str):
        return v.strip().lower() in ("true", "yes", "1")
    return bool(v)


def extract_json(text):
    text = text.strip()
    try:
        return json.loads(text)
    except ValueError:
        pass
    i, j = text.find("{"), text.rfind("}")
    if i != -1 and j > i:
        try:
            return json.loads(text[i:j + 1])
        except ValueError:
            return None
    return None


def decide(verdict, a, b):
    """Apply the rubric's arithmetic to a judge's verdict.

    The winner is the higher weighted total. A fatal solution cannot beat a
    non-fatal one. On an exact tie: fewer standing attacks, then higher
    correctness, then the judge's own pick. If the judge's pick disagrees with its
    own scores, the scores win and the note says so.
    Returns (winner, {a: total, b: total}, note).
    """
    if not isinstance(verdict, dict):
        raise ArenaError("verdict is not a JSON object")
    raw_scores = verdict.get("scores") or {}
    scores = {str(k).strip().lower(): v for k, v in raw_scores.items()} if isinstance(raw_scores, dict) else {}
    sa, sb = scores.get(a), scores.get(b)
    pick_raw = str(verdict.get("winner") or "").strip().lower()
    in_a = re.search(r"\b%s\b" % re.escape(a), pick_raw) is not None
    in_b = re.search(r"\b%s\b" % re.escape(b), pick_raw) is not None
    pick = a if (in_a and not in_b) else b if (in_b and not in_a) else None
    ta, tb = weighted_total(sa), weighted_total(sb)
    totals = {a: ta, b: tb}
    if ta is None or tb is None:
        if pick:
            return pick, totals, "scores incomplete, used the judge's pick"
        raise ArenaError("verdict has neither complete scores nor a clear winner")
    fa, fb = _truthy(sa.get("fatal")), _truthy(sb.get("fatal"))
    if fa != fb:
        winner = b if fa else a
    elif ta != tb:
        winner = a if ta > tb else b
    else:
        standing = verdict.get("standing") if isinstance(verdict.get("standing"), dict) else {}
        standing = {str(k).strip().lower(): v for k, v in standing.items()}
        na = len(standing.get(a) or []) if isinstance(standing.get(a), list) else None
        nb = len(standing.get(b) or []) if isinstance(standing.get(b), list) else None
        ca, cb = float(sa.get("correctness", 0)), float(sb.get("correctness", 0))
        if na is not None and nb is not None and na != nb:
            winner = a if na < nb else b
        elif ca != cb:
            winner = a if ca > cb else b
        elif pick:
            winner = pick
        else:
            raise ArenaError("exact tie and the judge did not pick a winner")
    note = ""
    if pick and pick != winner:
        note = "judge picked %s but its own scores favour %s, so the scores win" % (pick, winner)
    return winner, totals, note


def collect(state):
    """Record every verdict the judges have written for the open round (or the final
    check). An unreadable verdict is set aside as <name>.unreadable so the judge job
    shows up as missing again and gets re-run."""
    d = state["dir"]
    results = []
    if state["champion"]:
        fin = state.get("final")
        if not fin or fin.get("result"):
            return results
        path = final_out(d)
        if not _has_output(path):
            return [("final", "missing", "")]
        with open(path, encoding="utf-8", errors="replace") as fh:
            v = extract_json(fh.read())
        try:
            if isinstance(v, dict) and isinstance(v.get("scores"), dict):
                v = dict(v, scores={str(k).strip().lower(): s for k, s in v["scores"].items()})
            w, totals, note = decide(v, "x", "y")
        except ArenaError as e:
            os.replace(path, path + ".unreadable")
            return [("final", "unreadable", str(e))]
        better = fin[w.upper()]
        fin["result"] = {
            "better": better,
            "champion_total": totals["x" if fin["X"] == "champion" else "y"],
            "baseline_total": totals["x" if fin["X"] == "baseline" else "y"],
            "reason": str(v.get("reason") or "")[:400],
            "fixed": [str(x) for x in (v.get("fixed") or [])][:10] if isinstance(v.get("fixed"), list) else [],
        }
        return [("final", "recorded", ("%s is better. %s" % (better, note)).strip())]
    rd = current_round(state)
    if rd is None:
        return results
    for m in rd["matches"]:
        if m["winner"]:
            continue
        path = verdict_out(d, rd["n"], m["id"])
        if not _has_output(path):
            results.append((m["id"], "missing", ""))
            continue
        with open(path, encoding="utf-8", errors="replace") as fh:
            v = extract_json(fh.read())
        try:
            winner, totals, note = decide(v, m["a"], m["b"])
        except ArenaError as e:
            os.replace(path, path + ".unreadable")
            results.append((m["id"], "unreadable", str(e)))
            continue
        survived = v.get("survived") if isinstance(v.get("survived"), list) else []
        record(state, m["id"], winner,
               reason=str(v.get("reason") or "")[:400],
               survived=[str(x) for x in survived][:10],
               scores=totals, source="judge")
        loser = m["loser"]
        line = "%s beat %s, %s to %s" % (winner, loser, _fmt(totals[winner]), _fmt(totals[loser]))
        results.append((m["id"], "recorded", line + (". " + note if note else "")))
    return results


def _fmt(x):
    return "?" if x is None else ("%g" % x)


# ---------------------------------------------------------------- jobs and prompts

def phase_jobs(state, phase):
    """Every sub-agent job for a phase, with its prompt file and the outputs it must write.
    Matches that already have a recorded winner are skipped."""
    if phase not in PHASES:
        raise ArenaError("unknown phase '%s' (one of: %s)" % (phase, ", ".join(PHASES)))
    d = state["dir"]
    jobs = []
    if phase == "spawn":
        for aid in sorted(state["agents"]):
            jobs.append({"id": aid + ".spawn", "kind": "competitor", "round": 0, "agent": aid,
                         "outputs": [spawn_out(d, aid)]})
    elif phase == "final":
        fin = state.get("final")
        if state["champion"] and fin and not fin.get("result"):
            jobs.append({"id": "final.judge", "kind": "final", "round": None, "outputs": [final_out(d)]})
    else:
        rd = current_round(state)
        if rd is None:
            return []
        n = rd["n"]
        for m in rd["matches"]:
            if m["winner"]:
                continue
            a, b = m["a"], m["b"]
            if phase == "attack":
                for me, opp in ((a, b), (b, a)):
                    jobs.append({"id": "%s.%s.attack" % (m["id"], me), "kind": "attacker", "round": n,
                                 "agent": me, "opponent": opp, "match": m["id"],
                                 "outputs": [attack_out(d, n, m["id"], me)]})
            elif phase == "defend":
                for me, opp in ((a, b), (b, a)):
                    jobs.append({"id": "%s.%s.defend" % (m["id"], me), "kind": "defender", "round": n,
                                 "agent": me, "opponent": opp, "match": m["id"],
                                 "outputs": [defense_out(d, n, m["id"], me), revised_out(d, n, m["id"], me)]})
            else:
                jobs.append({"id": "%s.judge" % m["id"], "kind": "judge", "round": n,
                             "match": m["id"], "a": a, "b": b,
                             "outputs": [verdict_out(d, n, m["id"])]})
    for j in jobs:
        j["prompt"] = prompt_path(d, j["round"], j["id"])
    return jobs


def missing_jobs(jobs):
    return [j for j in jobs if not all(_has_output(p) for p in j["outputs"])]


_TEMPLATE_RE = re.compile(r"<!-- template:([a-z]+) -->\s*```text\n(.*?)\n```\s*<!-- /template:\1 -->", re.S)
_PLACEHOLDER_RE = re.compile(r"\{\{(\w+)\}\}")


def load_templates(path=SKILL_PATH):
    with open(path, encoding="utf-8") as fh:
        text = fh.read()
    found = {m.group(1): m.group(2) for m in _TEMPLATE_RE.finditer(text)}
    missing = [t for t in TEMPLATES if t not in found]
    if missing:
        raise ArenaError("SKILL.md is missing prompt templates: %s" % ", ".join(missing))
    return found


def fill(template, values):
    """One pass, so a task that itself contains {{braces}} is left exactly as written."""
    wanted = set(_PLACEHOLDER_RE.findall(template))
    missing = sorted(wanted - set(values))
    if missing:
        raise ArenaError("no value for placeholder(s): %s" % ", ".join(missing))
    return _PLACEHOLDER_RE.sub(lambda m: str(values[m.group(1)]), template)


def read_task(state):
    """The task exactly as init stored it (init adds one trailing newline to the file)."""
    with open(os.path.join(state["dir"], "task.md"), encoding="utf-8") as fh:
        return fh.read().rstrip("\n")


def _card_values(card):
    return {
        "reasoning_name": card["reasoning"]["name"], "reasoning_how": card["reasoning"]["how"],
        "workflow_name": card["workflow"]["name"], "workflow_how": card["workflow"]["how"],
        "strategy_name": card["strategy"]["name"], "strategy_how": card["strategy"]["how"],
    }


def render_job(state, job, templates, task):
    d = state["dir"]
    agents = state["agents"]
    v = {"task": task, "arena_dir": d, "rubric": os.path.join(d, "rubric.md"), "n": state["agents_n"]}
    kind = job["kind"]
    if kind == "competitor":
        aid = job["agent"]
        v.update(_card_values(agents[aid]["card"]))
        if state.get("has_baseline"):
            v["baseline_note"] = (
                "The user already got an answer to this task and was NOT satisfied with it. It is at "
                "%s. Read it first and work out exactly why it fell short. Then beat it. Do not just "
                "polish it: the winner of this arena is compared with that answer at the end."
                % os.path.join(d, "baseline.md"))
        else:
            v["baseline_note"] = "There is no earlier answer to beat. Start from the task."
        v.update(agent=aid, out=job["outputs"][0])
    elif kind == "attacker":
        me, opp = job["agent"], job["opponent"]
        v.update(_card_values(agents[me]["card"]))
        v.update(agent=me, target=opp, match=job["match"], round=job["round"],
                 own_solution=agents[me]["solution"], target_solution=agents[opp]["solution"],
                 out=job["outputs"][0])
    elif kind == "defender":
        me, opp = job["agent"], job["opponent"]
        v.update(_card_values(agents[me]["card"]))
        v.update(agent=me, attacker=opp, match=job["match"], round=job["round"],
                 own_solution=agents[me]["solution"],
                 attacks=attack_out(d, job["round"], job["match"], opp),
                 defense_out=job["outputs"][0], solution_out=job["outputs"][1])
    elif kind == "judge":
        n, mid, a, b = job["round"], job["match"], job["a"], job["b"]
        v.update(match=mid, round=n, first=a, second=b,
                 first_solution=revised_out(d, n, mid, a), second_solution=revised_out(d, n, mid, b),
                 first_attacks=attack_out(d, n, mid, b), second_attacks=attack_out(d, n, mid, a),
                 first_defense=defense_out(d, n, mid, a), second_defense=defense_out(d, n, mid, b),
                 out=job["outputs"][0])
    elif kind == "final":
        v.update(rounds=rounds_played(state),
                 x_solution=os.path.join(d, "final", "X.md"),
                 y_solution=os.path.join(d, "final", "Y.md"),
                 out=job["outputs"][0])
    return fill(templates[kind], v)


def write_prompts(state, phase):
    jobs = phase_jobs(state, phase)
    if not jobs:
        return jobs
    templates = load_templates()
    task = read_task(state)
    for j in jobs:
        for p in j["outputs"] + [j["prompt"]]:
            os.makedirs(os.path.dirname(p), exist_ok=True)
        body = render_job(state, j, templates, task)
        with open(j["prompt"], "w", encoding="utf-8") as fh:
            fh.write(body + "\n")
    if phase == "spawn":
        for aid in state["agents"]:
            os.makedirs(os.path.join(state["dir"], "scratch", aid), exist_ok=True)
    if phase == "final":
        # Blind copies: the final judge sees X and Y, never which one is the champion.
        fin = state["final"]
        sources = {"champion": state["agents"][state["champion"]]["solution"],
                   "baseline": os.path.join(state["dir"], "baseline.md")}
        os.makedirs(os.path.join(state["dir"], "final"), exist_ok=True)
        for label in ("X", "Y"):
            with open(sources[fin[label]], encoding="utf-8", errors="replace") as src, \
                    open(os.path.join(state["dir"], "final", label + ".md"), "w", encoding="utf-8") as dst:
                dst.write(src.read())
    return jobs


def next_action(state):
    """(phase, jobs_left, jobs_total). phase is one of spawn, attack, defend, judge,
    final, collect, advance, done."""
    spawn = phase_jobs(state, "spawn")
    left = missing_jobs(spawn)
    if left:
        return "spawn", left, spawn
    if state["champion"]:
        fin = state.get("final")
        if fin and not fin.get("result"):
            jobs = phase_jobs(state, "final")
            left = missing_jobs(jobs)
            return ("final", left, jobs) if left else ("collect", [], jobs)
        return "done", [], []
    for phase in ("attack", "defend", "judge"):
        jobs = phase_jobs(state, phase)
        left = missing_jobs(jobs)
        if left:
            return phase, left, jobs
    rd = current_round(state)
    if any(not m["winner"] for m in rd["matches"]):
        return "collect", [], []
    return "advance", [], []


# ---------------------------------------------------------------- plan

def plan_rows(n, wave=DEFAULT_WAVE):
    rows = []
    for rnd, alive in enumerate(bracket_sizes(n)[:-1], start=1):
        m = alive // 2
        waves = 2 * math.ceil(2 * m / wave) + math.ceil(m / wave)
        rows.append({"round": rnd, "alive": alive, "matches": m, "bye": alive % 2,
                     "calls": CALLS_PER_MATCH * m, "waves": waves})
    return rows


def plan_totals(n, wave=DEFAULT_WAVE):
    rows = plan_rows(n, wave)
    calls = n + sum(r["calls"] for r in rows)
    waves = math.ceil(n / wave) + sum(r["waves"] for r in rows)
    return {"agents": n, "rounds": len(rows), "calls": calls, "waves": waves, "rows": rows}


# ---------------------------------------------------------------- state io

def run_dir_from(args):
    if getattr(args, "dir", None):
        return os.path.abspath(args.dir)
    latest = os.path.join(ROOT, LATEST)
    if os.path.isfile(latest):
        with open(latest, encoding="utf-8") as fh:
            return fh.read().strip()
    raise ArenaError("no arena here. Run init first, or pass --dir")


def load_state(args):
    d = run_dir_from(args)
    path = os.path.join(d, STATE_FILE)
    if not os.path.isfile(path):
        raise ArenaError("no %s in %s" % (STATE_FILE, d))
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def save_state(state):
    path = os.path.join(state["dir"], STATE_FILE)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(state, fh, indent=1)
        fh.write("\n")
    os.replace(tmp, path)


def _cmd(*parts):
    return 'python3 "%s" %s' % (SELF, " ".join(parts))


def _card_line(card):
    return "%s + %s + %s" % (card["reasoning"]["name"], card["workflow"]["name"], card["strategy"]["name"])


# ---------------------------------------------------------------- commands

def _agents_arg(args):
    if args.quick and args.agents is not None:
        raise ArenaError("pass --quick or --agents, not both")
    if args.quick:
        return QUICK_AGENTS
    return DEFAULT_AGENTS if args.agents is None else args.agents


def cmd_plan(args):
    n = _agents_arg(args)
    if n < 1:
        raise ArenaError("--agents must be at least 1")
    t = plan_totals(n, args.wave)
    if args.json:
        print(json.dumps(t, indent=1))
        return 0
    print("%d agents, %d rounds, waves of %d" % (n, t["rounds"], args.wave))
    print("")
    print("  round  alive  matches  bye  sub-agent calls  waves")
    print("  spawn  %5d  %7s  %3s  %15d  %5d" % (n, "-", "-", n, math.ceil(n / args.wave)))
    for r in t["rows"]:
        print("  %5d  %5d  %7d  %3s  %15d  %5d"
              % (r["round"], r["alive"], r["matches"], "yes" if r["bye"] else "-", r["calls"], r["waves"]))
    print("  total                     %15d  %5d" % (t["calls"], t["waves"]))
    print("")
    print("  alive per round: %s" % " -> ".join(str(s) for s in bracket_sizes(n)))
    print("  plus 1 call for the final check when there is a rejected answer to beat")
    return 0


def cmd_init(args):
    n = _agents_arg(args)
    if args.wave < 1:
        raise ArenaError("--wave must be at least 1")
    data = load_strategies()
    if n < 1 or n > combo_count(data):
        raise ArenaError("--agents must be between 1 and %d (the number of distinct cards)" % combo_count(data))
    if args.task_file:
        with open(args.task_file, encoding="utf-8") as fh:
            task = fh.read()
    else:
        task = args.task or ""
    task = task.strip()
    if not task:
        raise ArenaError("the task is empty. Pass --task-file or --task")
    baseline = None
    if args.baseline_file:
        with open(args.baseline_file, encoding="utf-8") as fh:
            baseline = fh.read().strip()
        if not baseline:
            raise ArenaError("the baseline file is empty")
    seed = args.seed if args.seed is not None else random.SystemRandom().randrange(1, 1000000)
    default_dir = not args.dir
    d = os.path.abspath(args.dir or os.path.join(ROOT, "run-%s-s%s" % (time.strftime("%Y%m%d-%H%M%S"), seed)))
    if os.path.exists(os.path.join(d, STATE_FILE)):
        raise ArenaError("%s already has an arena in it. Pick another --dir" % d)
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, "task.md"), "w", encoding="utf-8") as fh:
        fh.write(task + "\n")
    if baseline:
        with open(os.path.join(d, "baseline.md"), "w", encoding="utf-8") as fh:
            fh.write(baseline + "\n")
    # The run gets its own copy of the rubric: frozen for this run, and inside the
    # working directory, so judges can read it without a permission prompt each.
    with open(RUBRIC_PATH, encoding="utf-8") as src, \
            open(os.path.join(d, "rubric.md"), "w", encoding="utf-8") as dst:
        dst.write(src.read())
    state = new_state(n, seed, data, d, wave=args.wave, has_baseline=bool(baseline))
    save_state(state)
    if default_dir:
        os.makedirs(ROOT, exist_ok=True)
        with open(os.path.join(ROOT, LATEST), "w", encoding="utf-8") as fh:
            fh.write(d + "\n")
    t = plan_totals(n, args.wave)
    print("arena ready: %s" % d)
    print("seed %s. %d agents, %d distinct cards dealt from %d, no repeats."
          % (seed, n, n, combo_count(data)))
    print("%d rounds (%s). %d sub-agent calls in %d waves of %d%s."
          % (t["rounds"], " -> ".join(str(s) for s in bracket_sizes(n)), t["calls"] + (1 if baseline else 0),
             t["waves"] + (1 if baseline else 0), args.wave, ", including the final check" if baseline else ""))
    print("next: %s" % _cmd("next"))
    return 0


def cmd_next(args):
    state = load_state(args)
    phase, left, jobs = next_action(state)
    rd = current_round(state)
    total_rounds = len(bracket_sizes(state["agents_n"])) - 1
    if phase == "spawn":
        print("spawn: %d competitors, then %d round(s)" % (state["agents_n"], total_rounds))
    elif rd:
        print("round %d of %d, %d alive" % (rd["n"], total_rounds, len(rd["alive"])))
    elif state["champion"]:
        print("champion: %s after %d round(s)" % (state["champion"], rounds_played(state)))
    if phase in PHASES:
        print("NEXT: %s. %d of %d job(s) to run." % (phase, len(left), len(jobs)))
        print("  1. %s" % _cmd("prompts", phase))
        print("  2. launch the jobs it lists, one wave of %d at a time" % state["wave"])
        print("  3. %s" % _cmd("next"))
    elif phase == "collect":
        print("NEXT: collect. Every verdict for this step is on disk.")
        print("  %s" % _cmd("collect"))
    elif phase == "advance":
        print("NEXT: advance. Every match in round %d has a winner." % rd["n"])
        print("  %s" % _cmd("advance"))
    else:
        print("DONE. %s" % _cmd("winner"))
    return 0


def cmd_prompts(args):
    state = load_state(args)
    jobs = write_prompts(state, args.phase)
    if not jobs:
        print("nothing to run for %s right now. %s" % (args.phase, _cmd("next")))
        return 0
    left = missing_jobs(jobs)
    w = state["wave"]
    rd = current_round(state)
    where = "round 0" if args.phase == "spawn" else ("final" if args.phase == "final" else "round %d" % rd["n"])
    waves = [left[i:i + w] for i in range(0, len(left), w)]
    print("%s, %s: %d job(s), %d still to run, %d wave(s) of up to %d"
          % (where, args.phase, len(jobs), len(left), len(waves), w))
    for k, wave in enumerate(waves, start=1):
        print("wave %d" % k)
        for j in wave:
            print("  %-26s %s" % (j["id"], j["prompt"]))
    if left:
        print("")
        print("Each job is one Agent call: subagent_type general-purpose, description \"arena <job id>\",")
        print("prompt \"Read <prompt path> and follow it exactly. It is your whole brief.\"")
        print("A wave is one message with all of its Agent calls. Let it finish before the next wave.")
    print("then: %s" % _cmd("next"))
    return 0


def cmd_check(args):
    state = load_state(args)
    jobs = phase_jobs(state, args.phase)
    left = missing_jobs(jobs)
    print("%s: %d of %d job(s) done" % (args.phase, len(jobs) - len(left), len(jobs)))
    for j in left:
        gone = [p for p in j["outputs"] if not _has_output(p)]
        print("  missing %-26s %s" % (j["id"], ", ".join(gone)))
    return 1 if left else 0


def cmd_pairings(args):
    state = load_state(args)
    rd = current_round(state)
    if rd is None:
        if state["champion"]:
            print("No matches left. %s is the last one standing." % state["champion"])
            return 0
        raise ArenaError("no round is open")
    if args.json:
        print(json.dumps(rd, indent=1))
        return 0
    agents = state["agents"]
    print("round %d: %d alive, %d match(es), bye: %s"
          % (rd["n"], len(rd["alive"]), len(rd["matches"]), rd["bye"] or "none"))
    for m in rd["matches"]:
        ra = agents[m["a"]]["card"]["reasoning"]["name"]
        rb = agents[m["b"]]["card"]["reasoning"]["name"]
        res = ("winner %s" % m["winner"]) if m["winner"] else "open"
        print("  %s  %s vs %s  (%s vs %s)  %s" % (m["id"], m["a"], m["b"], ra, rb, res))
    if rd["bye"]:
        print("  bye     %s goes through without a match" % rd["bye"])
    return 0


def cmd_record(args):
    state = load_state(args)
    m, previous = record(state, args.match_id, args.winner_id, reason=args.reason,
                         survived=args.survived, source="manual")
    save_state(state)
    extra = " (was %s)" % previous if previous and previous != m["winner"] else ""
    print("%s: %s beat %s%s" % (m["id"], m["winner"], m["loser"], extra))
    return 0


def cmd_collect(args):
    state = load_state(args)
    results = collect(state)
    save_state(state)
    if not results:
        print("nothing to collect. %s" % _cmd("next"))
        return 0
    bad = 0
    for mid, what, note in results:
        if what != "recorded":
            bad += 1
        print("  %-10s %-10s %s" % (mid, what, note))
    rd = current_round(state)
    if rd:
        done = sum(1 for m in rd["matches"] if m["winner"])
        print("round %d: %d of %d match(es) recorded" % (rd["n"], done, len(rd["matches"])))
    if bad:
        print("%d verdict(s) missing or unreadable. Re-run those judges: %s" % (bad, _cmd("next")))
        return 1
    print("then: %s" % _cmd("next"))
    return 0


def cmd_advance(args):
    state = load_state(args)
    rd = current_round(state)
    closing = rd["n"] if rd else None
    survivors = advance(state)
    save_state(state)
    print("round %s closed: %d through, %d eliminated"
          % (closing, len(survivors), len(rd["matches"])))
    if state["champion"]:
        print("CHAMPION: %s. %s" % (state["champion"], _cmd("next")))
    else:
        nr = state["rounds"][-1]
        print("round %d open: %d match(es)%s. %s"
              % (nr["n"], len(nr["matches"]), ", bye %s" % nr["bye"] if nr["bye"] else "", _cmd("next")))
    return 0


def status_rows(state):
    rows = []
    for rd in state["rounds"]:
        recorded = sum(1 for m in rd["matches"] if m["winner"])
        rows.append({"round": rd["n"], "alive": len(rd["alive"]), "matches": len(rd["matches"]),
                     "bye": rd["bye"], "eliminated": recorded,
                     "state": "closed" if rd["closed"] else "open, %d of %d recorded" % (recorded, len(rd["matches"]))})
    return rows


def cmd_status(args):
    state = load_state(args)
    rows = status_rows(state)
    alive = alive_ids(state)
    if args.json:
        print(json.dumps({"dir": state["dir"], "seed": state["seed"], "agents": state["agents_n"],
                          "alive": len(alive), "eliminated": state["agents_n"] - len(alive),
                          "champion": state["champion"], "rounds": rows}, indent=1))
        return 0
    print("arena %s" % state["dir"])
    print("seed %s, %d agents, waves of %d, %d distinct cards available"
          % (state["seed"], state["agents_n"], state["wave"], state["cards_available"]))
    print("  round  alive  matches  bye     eliminated  state")
    for r in rows:
        print("  %5d  %5d  %7d  %-6s  %10d  %s"
              % (r["round"], r["alive"], r["matches"], r["bye"] or "-", r["eliminated"], r["state"]))
    print("now: %d alive, %d eliminated%s"
          % (len(alive), state["agents_n"] - len(alive),
             ", champion %s" % state["champion"] if state["champion"] else ""))
    return 0


def winner_report(state):
    champ = state["champion"]
    if not champ:
        return None
    agent = state["agents"][champ]
    path = []
    survived = []
    for rd in state["rounds"]:
        if rd["bye"] == champ:
            path.append({"round": rd["n"], "bye": True})
        for m in rd["matches"]:
            if champ in (m["a"], m["b"]):
                opp = m["b"] if m["a"] == champ else m["a"]
                sc = m.get("scores") or {}
                path.append({"round": rd["n"], "bye": False, "beat": opp, "match": m["id"],
                             "score": sc.get(champ), "opponent_score": sc.get(opp),
                             "reason": m.get("reason"), "survived": m.get("survived") or []})
                survived.extend(m.get("survived") or [])
    return {"champion": champ, "card": agent["card"], "card_line": _card_line(agent["card"]),
            "solution": agent["solution"], "rounds": rounds_played(state), "agents": state["agents_n"],
            "matches_won": sum(1 for p in path if not p["bye"]), "path": path,
            "attacks_survived": survived, "final": (state.get("final") or {}).get("result")}


def cmd_winner(args):
    state = load_state(args)
    rep = winner_report(state)
    if rep is None:
        rd = current_round(state)
        print("no winner yet: round %s, %d alive. %s"
              % (rd["n"] if rd else "?", len(alive_ids(state)), _cmd("next")))
        return 1
    if args.json:
        print(json.dumps(rep, indent=1))
        return 0
    print("CHAMPION  %s" % rep["champion"])
    print("card      %s" % rep["card_line"])
    print("solution  %s" % rep["solution"])
    print("rounds    %d played, %d agents in, 1 left, %d match(es) won"
          % (rep["rounds"], rep["agents"], rep["matches_won"]))
    for p in rep["path"]:
        if p["bye"]:
            print("  round %d  bye" % p["round"])
            continue
        print("  round %d  beat %s, %s to %s. %s"
              % (p["round"], p["beat"], _fmt(p["score"]), _fmt(p["opponent_score"]), p["reason"] or ""))
        for s in p["survived"]:
            print("           survived: %s" % s)
    fin = rep["final"]
    if fin:
        verdict = ("the winner beats it" if fin["better"] == "champion"
                   else "the answer you rejected scored higher. Say so")
        print("vs the answer you rejected: winner %s, rejected %s, %s. %s"
              % (_fmt(fin["champion_total"]), _fmt(fin["baseline_total"]), verdict, fin["reason"]))
    return 0


def cmd_card(args):
    state = load_state(args)
    aid = norm_agent(state, args.agent_id)
    a = state["agents"][aid]
    c = a["card"]
    print("%s  %s" % (aid, "alive" if a["alive"] else "eliminated in round %s by %s"
                      % (a["eliminated_in"], a["eliminated_by"])))
    for part in ("reasoning", "workflow", "strategy"):
        print("  %-9s %s. %s" % (part, c[part]["name"], c[part]["how"]))
    print("  solution  %s" % a["solution"])
    return 0


def build_parser():
    common = argparse.ArgumentParser(add_help=False)
    common.add_argument("--dir", help="the arena run directory (default: the one in .arena/LATEST)")
    p = argparse.ArgumentParser(prog="bracket.py", description="Tournament state for /arena.")
    sub = p.add_subparsers(dest="cmd")
    sub.required = True

    s = sub.add_parser("plan", help="rounds, sub-agent calls and waves for N agents")
    s.add_argument("--agents", type=int)
    s.add_argument("--quick", action="store_true")
    s.add_argument("--wave", type=int, default=DEFAULT_WAVE)
    s.add_argument("--json", action="store_true")
    s.set_defaults(func=cmd_plan)

    s = sub.add_parser("init", parents=[common], help="deal the cards and write arena.json")
    s.add_argument("--agents", type=int, help="number of competitors (default %d)" % DEFAULT_AGENTS)
    s.add_argument("--quick", action="store_true", help="%d competitors" % QUICK_AGENTS)
    s.add_argument("--seed", type=int, help="fixes the cards and the pairings (default: random, recorded)")
    s.add_argument("--task-file", help="the task, word for word, as every competitor will get it")
    s.add_argument("--task", help="the task as a string, instead of --task-file")
    s.add_argument("--baseline-file", help="the answer the user was not satisfied with")
    s.add_argument("--wave", type=int, default=DEFAULT_WAVE, help="parallel sub-agents per wave (default 10)")
    s.set_defaults(func=cmd_init)

    s = sub.add_parser("next", parents=[common], help="what to do now")
    s.set_defaults(func=cmd_next)

    for name, fn, hlp in (("prompts", cmd_prompts, "write the briefs for a phase and list the jobs left"),
                          ("check", cmd_check, "list the jobs whose outputs are missing")):
        s = sub.add_parser(name, parents=[common], help=hlp)
        s.add_argument("phase", choices=PHASES)
        s.set_defaults(func=fn)

    s = sub.add_parser("pairings", parents=[common], help="this round's matches, including the bye")
    s.add_argument("--json", action="store_true")
    s.set_defaults(func=cmd_pairings)

    s = sub.add_parser("record", parents=[common], help="record a match result by hand")
    s.add_argument("match_id")
    s.add_argument("winner_id")
    s.add_argument("--reason")
    s.add_argument("--survived", action="append", help="an attack the winner survived (repeatable)")
    s.set_defaults(func=cmd_record)

    s = sub.add_parser("collect", parents=[common], help="record every verdict the judges wrote")
    s.set_defaults(func=cmd_collect)

    s = sub.add_parser("advance", parents=[common], help="close the round and pair the survivors")
    s.set_defaults(func=cmd_advance)

    s = sub.add_parser("status", parents=[common], help="alive and eliminated, per round")
    s.add_argument("--json", action="store_true")
    s.set_defaults(func=cmd_status)

    s = sub.add_parser("winner", parents=[common], help="the survivor and how it got there")
    s.add_argument("--json", action="store_true")
    s.set_defaults(func=cmd_winner)

    s = sub.add_parser("card", parents=[common], help="one competitor's strategy card")
    s.add_argument("agent_id")
    s.set_defaults(func=cmd_card)
    return p


def main(argv=None):
    args = build_parser().parse_args(argv)
    try:
        return args.func(args)
    except ArenaError as e:
        print("error: %s" % e, file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
