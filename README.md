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

First run will create `~/.config/cloudflare-maintenance-page-cli/config.json`.

It will prompt for your Cloudflare credentials:

- **Account ID** and **Zone ID**: [where to find them?](https://developers.cloudflare.com/fundamentals/account/find-account-and-zone-ids/)
- **API token**: [how to create one?](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/) (needs Edit Workers permissions)

To edit the config, just run `cfmp config`.

The config has two sections:

- `CLOUDFLARE` - your Cloudflare credentials and worker name
- `PAGE` - customize the maintenance page

This project was created using `bun init` in bun v1.2.19. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
