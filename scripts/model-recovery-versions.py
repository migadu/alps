#!/usr/bin/env python3
"""Bounded exhaustive model of METADATA credential versions.

Atomic steps are complete, fresh METADATA commands. Schedules include pauses
before/after every command, stale commits, concurrent pruning, and rescue of a
write incorporated by another writer. A stopped actor can resume arbitrarily
late. Each actor tries to consume the same code; two authenticated actors are a
safety violation. This is a bounded model, not a proof for arbitrary execution.
"""
from collections import deque


def explore(nodes, attempts, *, fence=True, fresh=True):
    # Entry: (key, committed, code_available, applied_operation_bitset).
    # Actor: (pc, attempt, key, pending_deletes, rescue, available, applied).
    actors = tuple((0, 0, (0, i), (), False, True, 0) for i in range(nodes))
    initial = ((((1, -1), True, True, 0),), actors, 0)
    pending, seen = deque([initial]), {initial}
    terminals = 0
    while pending:
        entries, actors, authenticated = pending.popleft()
        if authenticated.bit_count() > 1:
            return False, len(seen), terminals
        if all(actor[0] == 6 for actor in actors):
            terminals += 1
        for who, actor in enumerate(actors):
            pc, attempt, key, deletes, rescue, available, applied = actor
            if pc == 6:
                continue
            values = {key: (committed, available, applied)
                      for key, committed, available, applied in entries}
            latest = max(values)
            committed = max((key for key in values if values[key][0]), default=None)
            current_available, current_applied = values[committed][1:]
            next_pc, authenticated_next = pc + 1, authenticated
            if pc == 0:  # list versions; plan pruning and allocate proposal
                deletes = tuple(key for key in values if key not in (latest, committed))
                key = (latest[0] + 1, who * attempts + attempt)
                if not fresh:
                    available, applied = current_available, current_applied
            elif pc == 1:  # each prune is a separate SETMETADATA NIL
                if deletes:
                    values.pop(deletes[0], None)
                    deletes, next_pc = deletes[1:], 1
            elif pc == 2:  # publish proposal before reading the record
                values[key] = (False, True, 0)
            elif pc == 3:  # fresh record read, including ancestry
                if fresh:
                    available, applied = current_available, current_applied
                if rescue:
                    if not applied & (1 << who):
                        next_pc = 6
                elif not available:
                    next_pc = 6
                else:
                    available, applied = False, applied | (1 << who)
            elif pc == 4:  # immutable snapshot; reply may be delayed
                values[key] = (True, available, applied)
            elif pc == 5:  # fresh fence validation before authentication
                if not fence or (latest == key and committed == key):
                    authenticated_next |= 1 << who
                    next_pc = 6
                elif current_applied & (1 << who) and attempt + 1 < attempts:
                    attempt, rescue, next_pc = attempt + 1, True, 0
                else:
                    next_pc = 6
            next_actors = list(actors)
            next_actors[who] = (next_pc, attempt, key, deletes, rescue, available, applied)
            state = (tuple(sorted((key, *value) for key, value in values.items())),
                     tuple(next_actors), authenticated_next)
            if state not in seen:
                seen.add(state)
                pending.append(state)
    return True, len(seen), terminals


if __name__ == '__main__':
    for nodes, attempts in ((2, 2), (3, 1)):
        safe, states, terminals = explore(nodes, attempts)
        assert safe, 'two redemptions authenticated in the bounded model'
        print(f'{nodes} nodes, {attempts} attempts: {states} states, {terminals} terminal states; safe')
    # Negative controls: the model must catch removal of either ordering rule.
    assert not explore(2, 1, fence=False)[0], 'missing-fence mutant escaped'
    assert not explore(2, 1, fresh=False)[0], 'pre-proposal-read mutant escaped'
    print('both unsafe protocol variants rejected')
