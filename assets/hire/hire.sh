#!/usr/bin/env bash
# hire — accept/decline helper over goblin. Human gate stays: nothing sends without confirm.
# Links live in ~/.config/hire/links.conf (0600, never git):  service_name=URL per line.
set -u
LINKS="${HIRE_LINKS:-$HOME/.config/hire/links.conf}"
cmd="${1:-list}"
case "$cmd" in
  list)
    goblin hunt "hire:" --plain
    ;;
  accept|decline)
    n="${2:?usage: hire accept|decline <n> [service]}"
    service="${3:-teaser}"
    subj="$(goblin peek unread 2>/dev/null | grep -m1 "hire:" || true)"
    echo "Request #$n (subject guess: $subj)"
    printf 'Reply-to address: '; read -r to
    [ -z "$to" ] && { echo "hire: no address, abort"; exit 1; }
    tmp="$(mktemp)"; trap 'rm -f "$tmp"' EXIT
    if [ "$cmd" = accept ]; then
      link="$(grep -m1 "^${service}=" "$LINKS" 2>/dev/null | cut -d= -f2-)"
      [ -z "$link" ] && { echo "hire: no link for [$service] in $LINKS"; exit 1; }
      printf 'Taken. Pay here, then I start: %s\nProof terms (first 5): public testimonial + before/after rights, no names without permission.\n' "$link" > "$tmp"
      subject="re: hire request #$n — taken"
    else
      printf 'Pass — full / out of scope. Try again later or take the menu as-is.\n' > "$tmp"
      subject="re: hire request #$n — pass"
    fi
    echo "--- draft ---"; cat "$tmp"; echo "-------------"
    printf 'Send to %s? [y/N] ' "$to"; read -r yn
    [ "$yn" = y ] || { echo "hire: not sent"; exit 0; }
    goblin send --to "$to" --subject "$subject" --body-file "$tmp"
    ;;
  *) echo "usage: hire list | hire accept <n> [service] | hire decline <n>"; exit 1 ;;
esac
