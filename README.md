# RVMAT Tools

**Syntax highlighting • Linting • Autocompletion • TexView integration** for Arma 3 .rvmat material files.

[![Version](https://img.shields.io/open-vsx/v/shemich-arma/rvmat-tools)](https://open-vsx.org/extension/shemich-arma/rvmat-tools)
[![Installs](https://img.shields.io/open-vsx/dt/shemich-arma/rvmat-tools)](https://open-vsx.org/extension/shemich-arma/rvmat-tools)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Features

- Full syntax highlighting for .rvmat files
- Linting: detects unknown shaders, invalid uvSource, missing textures, incorrect RGBA values, suspicious content after semicolons, and more
- Autocompletion for PixelShaderID, VertexShaderID, uvSource, renderFlags, texture paths, texGen references, and Stage properties
- Real-time texture file existence checking (optional)
- Quick open textures in TexView2 (right-click context menu + commands)
- Support for P: drive paths (configurable)
- Custom dark & light themes optimized for .rvmat

## Installation

1. Open VS Code → Extensions view (Ctrl+Shift+X)
2. Search for **RVMAT Tools**
3. Install

Direct link:  
https://open-vsx.org/extension/shemich-arma/rvmat-tools

Alternative (manual install):  
Download the latest .vsix from [GitHub Releases](https://github.com/Shemich/arma3-rvmat-tools/releases) → Extensions → … → Install from VSIX...

## Commands

- **RVMAT: Open Texture with TexView** — open selected texture in TexView2
- **RVMAT: Open Texture at Cursor with TexView** — context menu action
- **RVMAT: Validate Current File** — manually trigger linting

## Settings

- `rvmat-linter.texViewPath` — path to TexView.exe  
  Default: `D:\\SteamLibrary\\steamapps\\common\\Arma 3 Tools\\TexView2\\TexView.exe`
- `rvmat-linter.checkTextures` — enable/disable texture existence check  
  Default: `true`
- `rvmat-linter.pDriveRoot` — root path for P: drive resolution  
  Default: `P:\\`

## Screenshots

![Linting example](images/screenshot-lint.png)  
![Autocompletion in action](images/screenshot-completion.png)  
![TexView context menu](images/screenshot-texview.png)

## Development / Contributing

1. Clone the repo:  
   `git clone https://github.com/Shemich/arma3-rvmat-tools.git`
2. Install dependencies: `npm install`
3. Compile: `npm run compile`
4. Press F5 → opens a new VS Code window with the extension loaded

Pull requests welcome! Report issues or suggest features in the [Issues tab](https://github.com/Shemich/arma3-rvmat-tools/issues).

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for full version history.

## License

MIT © Shemich