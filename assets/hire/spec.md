# Hire request spec (v2, direct delivery)

Delivery: form POSTs to our inbox via relay (no sender mailbox needed on the client).
Fallback: mailto with identical subject/body. Either way Goblin filters on the subject below.
Relay activation: first submit triggers a confirm mail to us — click once, then it flows.

## Subject (rigid, Goblin filters on this)

```
hire: <teaser|pmv|setup|fix|sponsor> | <NAME> | <YYYY-MM-DD>
```

## Body (key: value lines)

```
service: <service>
name: <NAME>
contact: <email or handle>
links: <clips, repo, references>
deadline: <date or - >
budget: <amount or ->
what: <5 lines max>
```

## Goblin side (terminal)

```
goblin steal                 # new letters
goblin hunt "hire:"          # all requests
goblin read <n>              # open one
```

`goblin watch` buzzes on arrival (IDLE + 5-min net).

## Reply templates (paste private links by hand — never in git)

Accept (`hire: X` → yes):

```
Subject: re: hire: <service> | <NAME> | <date>
Taken. Scope: <one line>. Date: <date>. Pay here, then I start: <PRIVATE LINK>.
Proof terms (first 5): public testimonial + before/after rights, no names without permission.
```

Decline:

```
Subject: re: hire: <service> | <NAME> | <date>
Pass — <one honest line: full / out of scope / date>. Try again <when> or take the menu as-is.
```

Private links live in `~/.config/hire/links.conf` (0600, never git):

```
teaser_full=https://buy.stripe.com/fZu00ieJC37U31dh1vfQI00
teaser_proof=https://buy.stripe.com/aFa6oG44YgYKgS3bHbfQI01
```

## Ledger

Forward any payment mail to the agent: `slots.json` (`proof_slots_used`, sponsors) updates, wall etches, delivery reply drafts.
