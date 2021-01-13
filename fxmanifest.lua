-- Define the FX Server version and game type
fx_version "adamant"
game "gta5"

-- Define the resource metadata
name "pQueue"
description "FiveM queue with priority based on discord roles (Requires sPerms)"
author "Petrikov"
version "0.0.0"

server_script 'src/server/index.js'
client_script 'src/client/index.js'