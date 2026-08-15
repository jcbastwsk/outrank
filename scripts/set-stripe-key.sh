#!/bin/bash
# Paste the Stripe secret key once. It is not printed back.
set -euo pipefail
ENV="/home/jcb/src/outrank/.env.local"
printf "Paste sk_test_... then Enter (input hidden): "
read -r KEY
KEY="$(printf '%s' "$KEY" | tr -d '[:space:]')"
if [[ ! "$KEY" =~ ^sk_(test|live)_ ]]; then
  echo "That did not look like a Stripe secret key. Nothing written."
  exit 1
fi
touch "$ENV"
chmod 600 "$ENV"
if grep -q '^STRIPE_SECRET_KEY=' "$ENV"; then
  python3 - "$ENV" "$KEY" << 'PY'
from pathlib import Path
import sys
path, key = Path(sys.argv[1]), sys.argv[2]
lines = path.read_text().splitlines()
out = []
found = False
for line in lines:
    if line.startswith("STRIPE_SECRET_KEY="):
        out.append(f"STRIPE_SECRET_KEY={key}")
        found = True
    else:
        out.append(line)
if not found:
    out.append(f"STRIPE_SECRET_KEY={key}")
path.write_text("\n".join(out) + "\n")
PY
else
  echo "STRIPE_SECRET_KEY=$KEY" >> "$ENV"
fi
unset KEY
echo "Saved. Prefix is $(python3 -c "from pathlib import Path; v=next(l for l in Path('$ENV').read_text().splitlines() if l.startswith('STRIPE_SECRET_KEY=')); print(v.split('=',1)[1][:8]+'…')")"
echo "Tell Grok to restart the app."
