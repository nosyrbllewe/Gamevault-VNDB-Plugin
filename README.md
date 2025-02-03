# Gamevault VNDB Provider

A metadata provider to fetch metadata from [VNDB](https://vndb.org) for games in your GameVault server.

## How to use
1. Extract the release folder into the plugins directory on your Gamevault server
2. Restart your server.
3. The plugin should now work in GameVault.

## How to build
1. Clone the main gamevault-backend repository.
2. Clone this repository `into gamevault-backend\.local\plugins\`
3. Run `pnpm build`
4. Build files can be found in `gamevault-backend\dist\.local\plugins\Gamevault-VNDB-Plugin`

## Disclaimers
This application currently assumes all games are 18+. All changes for age ratings must be manually overridden inside GameVault itself

## License
This code is licensed as freely as far as the extent to which is possible. Considering the reliance on the GameVault project, which is Creative Common's Attribution-NonCommercial-ShareAlike 4.0 license and not normally used for code, it isn't really clear what is legally possible to license this as. As such, I am licensing this code to be used freely as possible without conflicting with any of Phalcode's intellectual property rights. Essentially consider it to be MIT License, assuming that doesn't somehow conflict with GameVault's main license.