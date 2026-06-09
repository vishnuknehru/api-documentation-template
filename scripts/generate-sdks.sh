#!/usr/bin/env bash
# generate-sdks.sh
# Generates client SDKs for all API versions using openapi-generator-cli.
# Requires: Docker

set -e

CONTENT_DIR="$(cd "$(dirname "$0")/../content" && pwd)"
OUTPUT_DIR="$(cd "$(dirname "$0")/../frontend/public/sdks" && pwd)"

LANGUAGES=(
  "python"
  "java"
  "typescript-fetch"
  "csharp"
  "go"
)

# Display name → file name mapping
declare -A LANG_FILE
LANG_FILE["python"]="python"
LANG_FILE["java"]="java"
LANG_FILE["typescript-fetch"]="typescript"
LANG_FILE["csharp"]="csharp"
LANG_FILE["go"]="go"

mkdir -p "$OUTPUT_DIR"

echo ""
echo "🔍 Scanning APIs in $CONTENT_DIR/apis/"
echo ""

for api_dir in "$CONTENT_DIR/apis"/*/; do
  api=$(basename "$api_dir")

  if [ ! -f "$api_dir/api.config.json" ]; then
    echo "  ⚠  Skipping $api (no api.config.json)"
    continue
  fi

  versions_dir="$api_dir/versions"
  if [ ! -d "$versions_dir" ]; then
    echo "  ⚠  Skipping $api (no versions/ directory)"
    continue
  fi

  for version_dir in "$versions_dir"/*/; do
    version=$(basename "$version_dir")
    spec_file="$version_dir/openapi.yaml"

    if [ ! -f "$spec_file" ]; then
      echo "  ⚠  Skipping $api/$version (no openapi.yaml)"
      continue
    fi

    echo "📦 Generating SDKs for $api $version..."
    mkdir -p "$OUTPUT_DIR/$api/$version"

    for lang in "${LANGUAGES[@]}"; do
      filename="${LANG_FILE[$lang]}"
      out_dir=$(mktemp -d)
      zip_path="$OUTPUT_DIR/$api/$version/${filename}.zip"

      echo "   → $lang..."

      docker run --rm \
        -v "$spec_file:/spec/openapi.yaml:ro" \
        -v "$out_dir:/out" \
        openapitools/openapi-generator-cli:latest generate \
        -i /spec/openapi.yaml \
        -g "$lang" \
        -o /out \
        --additional-properties="packageName=${api}_client,projectName=${api}-client" \
        2>/dev/null || {
          echo "     ⚠  Failed to generate $lang SDK for $api/$version"
          rm -rf "$out_dir"
          continue
        }

      # Add sandbox configuration README
      cat > "$out_dir/SANDBOX_QUICKSTART.md" << EOF
# ${api} ${version} SDK — Sandbox Quickstart

This SDK was auto-generated from the OpenAPI specification.

## Sandbox configuration (pre-configured)

\`\`\`
Base URL:      http://localhost:4000/sandbox/${api}/${version}
Client ID:     sandbox_client_id_abc123
Client Secret: sandbox_secret_xyz789
\`\`\`

## Production configuration

Replace the sandbox base URL and credentials with your real values before deploying.

## Get an access token

\`\`\`bash
curl -X POST http://localhost:4000/oauth/token \\
  -H 'Content-Type: application/json' \\
  -d '{"client_id":"sandbox_client_id_abc123","client_secret":"sandbox_secret_xyz789"}'
\`\`\`

## See also

- API Documentation: http://localhost:3000/${api}/${version}/guides/getting-started
- Full SDK docs: See README.md inside this archive
EOF

      # Zip the output
      (cd "$out_dir" && zip -qr "$zip_path" .)
      rm -rf "$out_dir"

      echo "     ✓  $zip_path"
    done
  done
done

echo ""
echo "✅ SDK generation complete. Files written to:"
echo "   $OUTPUT_DIR"
echo ""
echo "   SDKs are served at /sdks/{api}/{version}/{language}.zip"
echo ""
