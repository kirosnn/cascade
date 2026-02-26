# Environment Variables

# Environment Variables

## CASCADE_TS_STYLE_WARN

Enable warnings for missing syntax styles

**Type:** `string`  
**Default:** `false`

## CASCADE_TREE_SITTER_WORKER_PATH

Path to the TreeSitter worker

**Type:** `string`  
**Default:** `""`

## XDG_CONFIG_HOME

Base directory for user-specific configuration files

**Type:** `string`  
**Default:** `""`

## XDG_DATA_HOME

Base directory for user-specific data files

**Type:** `string`  
**Default:** `""`

## CASCADE_DEBUG_FFI

Enable debug logging for the FFI bindings.

**Type:** `boolean`  
**Default:** `false`

## CASCADE_SHOW_STATS

Show the debug overlay at startup.

**Type:** `boolean`  
**Default:** `false`

## CASCADE_LOG_CRASH_REPORTS

Log detailed crash reports to the console when a crash is captured.

**Type:** `boolean`  
**Default:** `false`

## CASCADE_TRACE_FFI

Enable tracing for the FFI bindings.

**Type:** `boolean`  
**Default:** `false`

## CASCADE_FORCE_WCWIDTH

Use wcwidth for character width calculations

**Type:** `boolean`  
**Default:** `false`

## CASCADE_FORCE_UNICODE

Force Mode 2026 Unicode support in terminal capabilities

**Type:** `boolean`  
**Default:** `false`

## CASCADE_GRAPHICS

Enable Kitty graphics protocol detection

**Type:** `boolean`  
**Default:** `true`

## CASCADE_FORCE_NOZWJ

Use no_zwj width method (Unicode without ZWJ joining)

**Type:** `boolean`  
**Default:** `false`

## CASCADE_FORCE_EXPLICIT_WIDTH

Force explicit width capability in terminal to true or false. Set to "true" or "1" to enable, "false" or "0" to disable. When set to "false" or "0", also skips sending OSC 66 detection queries to prevent artifacts on older terminals (e.g., GNOME Terminal).

**Type:** `string`
**Values:** `"true"`, `"1"`, `"false"`, `"0"`

## CASCADE_USE_CONSOLE

Whether to use the console. Will not capture console output if set to false.

**Type:** `boolean`  
**Default:** `true`

## SHOW_CONSOLE

Show the console at startup if set to true.

**Type:** `boolean`  
**Default:** `false`

## CASCADE_DUMP_CAPTURES

Dump captured output when the renderer exits.

**Type:** `boolean`  
**Default:** `false`

## CASCADE_NO_NATIVE_RENDER

Disable native rendering. This will not actually output ansi and is useful for debugging.

**Type:** `boolean`  
**Default:** `false`

## CASCADE_USE_ALTERNATE_SCREEN

Whether to use the console. Will not capture console output if set to false.

**Type:** `boolean`  
**Default:** `true`

## CASCADE_OVERRIDE_STDOUT

Override the stdout stream. This is useful for debugging.

**Type:** `boolean`  
**Default:** `true`

## CASCADE_DEBUG

Enable debug mode to capture all raw input for debugging purposes.

**Type:** `boolean`  
**Default:** `false`

---

_generated via packages/core/dev/print-env-vars.ts_
