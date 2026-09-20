const fs = require('fs');
const path = require('path');

module.exports = async function (context) {
  if (context.electronPlatformName !== 'linux') return;
  const name = context.packager.executableName;
  const exe = path.join(context.appOutDir, name);
  fs.renameSync(exe, `${exe}.bin`);
  fs.writeFileSync(
    exe,
    `#!/bin/bash
HERE="$(dirname "$(readlink -f "$0")")"
ARGS=(--no-sandbox)
if [ ! -w /dev/shm ]; then
  export TMPDIR="\${XDG_CACHE_HOME:-$HOME/.cache}/${name}-tmp"
  mkdir -p "$TMPDIR"
  ARGS+=(--disable-dev-shm-usage)
fi
exec "$HERE/${name}.bin" "\${ARGS[@]}" "$@"
`,
    { mode: 0o755 }
  );
};
