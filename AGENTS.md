# Working on anonymous-browser

- Keep code concise and functions focused. Do not add tests unless asked.
- Run `npm ci` and `npm run build` when setting up a checkout.
- Validate package changes by packing and installing the tarball in a temporary consumer.
- Keep GoLogin as the owner of Orbita, profile configuration and persistence.
- Preserve operation results when cleanup fails. Never save a profile while its owned process is alive.
- This repository is public. Keep tokens, profile IDs, cookies, private project data and raw diagnostic output out of commits and release assets.
- Keep deployment and release documentation aligned with `.codex/skills/release/SKILL.md`.
- Release through the version-tag GitHub Actions workflow. Never overwrite published release assets.
- Consumer integrations and production deployments belong in their own repositories.
