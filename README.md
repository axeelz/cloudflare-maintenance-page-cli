# cloudflare-maintenance-page-cli

![screenshot](https://github.com/user-attachments/assets/3121c725-2ca6-49f3-8498-62296a82b84c)

## setup

To install dependencies:

```bash
bun install
```

To link globally:

```bash
bun link
```

Then use `cfmp` anywhere.

## commands

- `cfmp deploy` - deploys the maintenance page worker to Cloudflare at /maintenance on your domain
- `cfmp enable` - enables maintenance mode (routes all traffic to the worker)
- `cfmp disable` - disables maintenance mode (back to normal)

## configuration

At the first run, it will create `~/.config/cloudflare-maintenance-page-cli/config.json`, then prompt for your Cloudflare information:

- **Account** and **Zone**: [what is this?](https://developers.cloudflare.com/fundamentals/account/find-account-and-zone-ids/)
- **API token**: [how to create one?](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/) (needs Edit Workers permissions)

To edit the config, just run `cfmp config`.

> Your API token is NOT stored in plain text in the config file. It is stored securely using the operating system's keychain. To delete it, you can run `cfmp config --delete`.

The config has two sections:

- `CLOUDFLARE` - your Cloudflare information
- `PAGE` - customize the maintenance page

> You can also use environment variables (example `CLOUDFLARE_ACCOUNT_ID=your_id... cfmp deploy`). This doesn't apply to the token.

## worker

The CLI will deploy a Cloudflare Worker on your Cloudflare account named `maintenance-<domain>-<start_of_zone_id>`.

Cloudflare Workers limits apply according to your plan. See [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/#worker-limits).

---

This project was created using `bun init` in bun v1.2.19. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
