imgpipel
=================

A new CLI generated with oclif


[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/imgpipel.svg)](https://npmjs.org/package/imgpipel)
[![Downloads/week](https://img.shields.io/npm/dw/imgpipel.svg)](https://npmjs.org/package/imgpipel)


<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g imgpipel
$ imgpipel COMMAND
running command...
$ imgpipel (--version)
imgpipel/0.0.0 darwin-arm64 node-v20.10.0
$ imgpipel --help [COMMAND]
USAGE
  $ imgpipel COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`imgpipel hello PERSON`](#imgpipel-hello-person)
* [`imgpipel hello world`](#imgpipel-hello-world)
* [`imgpipel help [COMMAND]`](#imgpipel-help-command)
* [`imgpipel plugins`](#imgpipel-plugins)
* [`imgpipel plugins add PLUGIN`](#imgpipel-plugins-add-plugin)
* [`imgpipel plugins:inspect PLUGIN...`](#imgpipel-pluginsinspect-plugin)
* [`imgpipel plugins install PLUGIN`](#imgpipel-plugins-install-plugin)
* [`imgpipel plugins link PATH`](#imgpipel-plugins-link-path)
* [`imgpipel plugins remove [PLUGIN]`](#imgpipel-plugins-remove-plugin)
* [`imgpipel plugins reset`](#imgpipel-plugins-reset)
* [`imgpipel plugins uninstall [PLUGIN]`](#imgpipel-plugins-uninstall-plugin)
* [`imgpipel plugins unlink [PLUGIN]`](#imgpipel-plugins-unlink-plugin)
* [`imgpipel plugins update`](#imgpipel-plugins-update)

## `imgpipel hello PERSON`

Say hello

```
USAGE
  $ imgpipel hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ imgpipel hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [src/commands/hello/index.ts](https://github.com/mplewis/imgpipel/blob/v0.0.0/src/commands/hello/index.ts)_

## `imgpipel hello world`

Say hello world

```
USAGE
  $ imgpipel hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ imgpipel hello world
  hello world! (./src/commands/hello/world.ts)
```

_See code: [src/commands/hello/world.ts](https://github.com/mplewis/imgpipel/blob/v0.0.0/src/commands/hello/world.ts)_

## `imgpipel help [COMMAND]`

Display help for imgpipel.

```
USAGE
  $ imgpipel help [COMMAND...] [-n]

ARGUMENTS
  COMMAND...  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for imgpipel.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.3/src/commands/help.ts)_

## `imgpipel plugins`

List installed plugins.

```
USAGE
  $ imgpipel plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ imgpipel plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.3.2/src/commands/plugins/index.ts)_

## `imgpipel plugins add PLUGIN`

Installs a plugin into imgpipel.

```
USAGE
  $ imgpipel plugins add PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into imgpipel.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the IMGPIPEL_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the IMGPIPEL_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ imgpipel plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ imgpipel plugins add myplugin

  Install a plugin from a github url.

    $ imgpipel plugins add https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ imgpipel plugins add someuser/someplugin
```

## `imgpipel plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ imgpipel plugins inspect PLUGIN...

ARGUMENTS
  PLUGIN...  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ imgpipel plugins inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.3.2/src/commands/plugins/inspect.ts)_

## `imgpipel plugins install PLUGIN`

Installs a plugin into imgpipel.

```
USAGE
  $ imgpipel plugins install PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into imgpipel.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the IMGPIPEL_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the IMGPIPEL_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ imgpipel plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ imgpipel plugins install myplugin

  Install a plugin from a github url.

    $ imgpipel plugins install https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ imgpipel plugins install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.3.2/src/commands/plugins/install.ts)_

## `imgpipel plugins link PATH`

Links a plugin into the CLI for development.

```
USAGE
  $ imgpipel plugins link PATH [-h] [--install] [-v]

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help          Show CLI help.
  -v, --verbose
      --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ imgpipel plugins link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.3.2/src/commands/plugins/link.ts)_

## `imgpipel plugins remove [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ imgpipel plugins remove [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ imgpipel plugins unlink
  $ imgpipel plugins remove

EXAMPLES
  $ imgpipel plugins remove myplugin
```

## `imgpipel plugins reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ imgpipel plugins reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.3.2/src/commands/plugins/reset.ts)_

## `imgpipel plugins uninstall [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ imgpipel plugins uninstall [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ imgpipel plugins unlink
  $ imgpipel plugins remove

EXAMPLES
  $ imgpipel plugins uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.3.2/src/commands/plugins/uninstall.ts)_

## `imgpipel plugins unlink [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ imgpipel plugins unlink [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ imgpipel plugins unlink
  $ imgpipel plugins remove

EXAMPLES
  $ imgpipel plugins unlink myplugin
```

## `imgpipel plugins update`

Update installed plugins.

```
USAGE
  $ imgpipel plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.3.2/src/commands/plugins/update.ts)_
<!-- commandsstop -->
