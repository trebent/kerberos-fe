#! /bin/bash
set -euo pipefail

if ! command -v mkcert &>/dev/null; then
  echo "Error: mkcert is not installed. Please install it first: https://github.com/FiloSottile/mkcert" >&2
  exit 1
fi

mkcert -install

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

mkcert \
  -cert-file "$SCRIPT_DIR/krb.pem" \
  -key-file  "$SCRIPT_DIR/krb-key.pem" \
  trebent.test localhost

CAROOT="$(mkcert -CAROOT)"
cp "$CAROOT/rootCA.pem" "$SCRIPT_DIR/rootCA.pem"

echo "Certificates generated in $SCRIPT_DIR"