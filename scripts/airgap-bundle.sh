#!/usr/bin/env bash
# Build an air-gap bundle of the Argo CD Rancher extension.
#
# Run on a CONNECTED build machine. Produces in ./airgap/:
#   - ui-extension-<name>-<version>.tar  : extension catalog image (nginx + Helm repo + JS bundle)
#   - <chart>.tgz                        : the Helm chart (for a CLI install, optional)
#   - images.txt / SHA256SUMS
#
# Usage: scripts/airgap-bundle.sh <registry> <org>
#   e.g. scripts/airgap-bundle.sh harbor.corp.local platform
#
# The image is tagged with the PRIVATE registry name so that, inside the
# air-gapped network, you only need `docker load` + `docker push`.
set -euo pipefail

REGISTRY="${1:?usage: $0 <registry> <org>}"
ORG="${2:?usage: $0 <registry> <org>}"
RUNTIME="${RUNTIME:-docker}"   # or podman
PUSH="${PUSH:-0}"              # 1: also push the image to <registry>/<org>

cd "$(dirname "$0")/.."

for cmd in node yarn jq yq helm git "${RUNTIME}"; do
  command -v "${cmd}" >/dev/null || { echo "missing prerequisite: ${cmd}" >&2; exit 1; }
done

NAME=$(jq -r .name package.json)
VERSION=$(jq -r .version package.json)
PKG_VERSION=$(jq -r .version pkg/argocd/package.json)

if [[ "${VERSION}" != "${PKG_VERSION}" ]]; then
  echo "version mismatch: package.json=${VERSION} pkg/argocd/package.json=${PKG_VERSION} - keep them in sync" >&2
  exit 1
fi

ORG=$(echo "${ORG}" | tr "[:upper:]" "[:lower:]")
IMAGE="${REGISTRY%/}/${ORG}/ui-extension-${NAME}:${VERSION}"

echo "==> Tests"
yarn -s test

echo "==> Building catalog image ${IMAGE}"
# -c: container image instead of GitHub Pages ; -f: rebuild the chart ; -l: podman
EXTRA=()
[[ "${RUNTIME}" == "podman" ]] && EXTRA+=(-l)
yarn -s publish-pkgs -c -f -r "${REGISTRY}" -o "${ORG}" "${EXTRA[@]}"

OUT=airgap
rm -rf "${OUT}" && mkdir -p "${OUT}"

echo "==> Verifying catalog image content"
# publish-pkgs does not fail when the chart cannot be packaged: check the
# Helm index served by the image really lists the extension.
WORK=$(mktemp -d)
CID=$("${RUNTIME}" create "${IMAGE}")
trap '"${RUNTIME}" rm -f "${CID}" >/dev/null 2>&1 || true; rm -rf "${WORK}"' EXIT
"${RUNTIME}" cp "${CID}:/home/plugin-server/plugin-contents/." "${WORK}/"

if ! yq -e ".entries.\"${NAME}\"[] | select(.version == \"${VERSION}\")" "${WORK}/index.yaml" >/dev/null; then
  echo "ERROR: ${IMAGE} does not list chart ${NAME} ${VERSION} in its index.yaml:" >&2
  cat "${WORK}/index.yaml" >&2
  exit 1
fi
echo "    index.yaml lists ${NAME} ${VERSION}"

# Push only once the image has been verified
if [[ "${PUSH}" == "1" ]]; then
  echo "==> Pushing ${IMAGE}"
  "${RUNTIME}" push "${IMAGE}"
fi

echo "==> Saving image"
"${RUNTIME}" save -o "${OUT}/ui-extension-${NAME}-${VERSION}.tar" "${IMAGE}"
echo "${IMAGE}" > "${OUT}/images.txt"

# Helm chart(s) + raw extension build (JS bundle), taken from the image itself
cp "${WORK}/plugin/${NAME}/${NAME}-${VERSION}.tgz" "${OUT}/${NAME}-${VERSION}-chart.tgz"
cp "${WORK}/plugin/${NAME}-${VERSION}.tgz" "${OUT}/${NAME}-${VERSION}-dist.tgz"
cp "${WORK}/index.yaml" "${OUT}/index.yaml"

(cd "${OUT}" && sha256sum ./* > SHA256SUMS)

echo
echo "Bundle ready in ${OUT}/ :"
ls -lh "${OUT}"
echo
echo "Inside the air-gapped network:"
echo "  ${RUNTIME} load -i ui-extension-${NAME}-${VERSION}.tar && ${RUNTIME} push ${IMAGE}"
echo "Then in Rancher: Extensions > (⋮) Manage Extension Catalogs > Import Extension Catalog > ${IMAGE}"
