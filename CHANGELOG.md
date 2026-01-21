# Change Log

All notable changes to the "Arma3_RVMAT_Syntax" extension will be documented in this file.

## [0.0.8] - 2026-01-19

### Added
- Comprehensive vertex shader validation based on official documentation
- Added all documented vertex shaders including Basic, NormalMap, Water, Sprite, Point, Terrain, Tree, Super, Multi, and others
- Updated shader validation to include all vertex shaders from documentation
- Enhanced README with complete list of supported shaders

### Changed
- Expanded VALID_SHADER_IDS list with all documented vertex shaders
- Improved accuracy of shader ID validation

## [0.0.7] - 2026-01-19

### Added
- Expanded shader ID validation with comprehensive list from documentation
- Added validation for additional pixel and vertex shaders
- Improved detection logic for extra semicolons after closing braces
- Updated README with expanded shader support information

### Fixed
- Fixed false positive detections for extra semicolons in normal class structures
- Corrected shader ID list to include all documented values
- Fixed duplicate entries in shader ID validation

### Changed
- Enhanced semantic validation in extension.js with expanded shader list
- Improved accuracy of syntax error detection

## [0.0.6] - 2026-01-19

### Added
- Enhanced linter with validation for documented property values
- Validation for mainLight values (None, Sun, Sky, etc.)
- Validation for fogMode values (none, fog, alpha, etc.)
- Validation for uvSource values (none, tex, tex1, etc.)
- Validation for shader IDs against documented values
- Updated README with new linter capabilities

### Changed
- Improved semantic validation in extension.js
- Enhanced documentation to reflect new validation features

## [0.0.5] - 2026-01-19

### Added
- Built-in linter with syntax and semantic validation
- Real-time error detection and reporting
- Validation for common RVMAT properties (array lengths, value types)
- Detection of syntax errors (unmatched brackets, quotes, missing semicolons)
- Detection of extra semicolons after closing braces
- Detection of multiple consecutive semicolons
- Warning for deprecated properties
- Updated extension categories to include "Linters"

### Changed
- Enhanced extension.js to include comprehensive diagnostic capabilities
- Improved bracket matching algorithm to work across entire document
- Enhanced README with detailed linter capabilities documentation
- Updated package.json with new version and dependencies

## [0.0.4] - 2026-01-19

### Added
- Light color theme for users preferring light backgrounds
- Support for both dark and light themes in package.json
- Updated documentation to reflect both available themes

## [0.0.3] - 2026-01-19

### Added
- Professional color theme optimized for RVMAT files
- Dedicated theme file with carefully chosen colors for different syntax elements
- Support for theme integration in package.json
- Documentation for the new color theme in README

## [0.0.2] - 2026-01-19

### Added
- Extended property support with additional RVMAT properties
- Support for MultiMaterial configurations (TexGen classes, Stage definitions)
- Support for procedural textures (#(argb,8,8,3)color(...) and #(ai,64,64,1)fresnel(...))
- Support for additional shader types (SuperExt, Multi, NormalMap, etc.)
- UV transform properties (uvTransform, aside, up, dir, pos)
- TexGen class support
- More accurate procedural texture function highlighting
- Support for all known Arma 3 shader types
- Special highlighting for render flags, light modes, fog modes, and UV sources
- Support for additional properties like Filter, useWorldEnvMap, fogMode, and forcedDiffuseAlpha

### Changed
- Improved array pattern matching to prevent recursion issues
- Enhanced class pattern for better folding support
- Better number pattern to support scientific notation
- Improved string pattern to handle embedded procedural textures
- Enhanced operator highlighting with specific scopes
- Comprehensive property coverage based on official Arma 3 documentation

### Fixed
- Fixed recursive pattern issue in array definitions
- Fixed typo: added both 'emissive' and 'emmisive' properties
- Corrected class folding markers
- Fixed property coverage for extended RVMAT specification

## [0.0.1] - 2026-01-19

### Added
- Initial release
- Basic syntax highlighting for RVMAT files
- Support for comments, keywords, classes, properties, strings, numbers, arrays, and operators
- Language configuration for brackets, auto-closing, and folding