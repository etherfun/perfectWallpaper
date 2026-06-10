# perfectwall-server (.NET Framework 4.8)

The system-info sidecar for the PerfectWall Wallpaper Engine
project, written in C# 7.3 against .NET Framework 4.8. (The
project used to ship a Rust implementation in `src/server-rs/`;
that was deprecated 2026-06 in favour of this .NET version,
which has better LHM coverage and a richer HTTP API surface.)

## Why .NET Framework 4.8?

- Ships with Windows 10 1803 (April 2018) and every Windows 11
  system. The vast majority of Wallpaper Engine users already
  have the runtime on disk.
- The `LibreHardwareMonitorLib` NuGet package is `net48` /
  `netstandard2.0` dual-targeted and has been compiled against
  the 4.8 BCL for years — no reflection or `unsafe` quirks.
- Compiles with the free MSBuild from Visual Studio Build Tools
  2019/2022; no separate .NET SDK install needed at build time.
- The output is a single folder of `*.dll` + `*.exe`. Distribute
  it via xcopy. There is no `dotnet runtime --roll-forward`
  version-juggling.

## Two run modes (user picks)

| Flag       | UAC? | LHM? | JSON temperature / clock fields |
|------------|------|------|--------------------------------|
| `--user` (default) | No  | No  | `0` / `null` / `temperature_available: false` (preserved) |
| `--admin`  | Yes  | Yes | Real values from LHM sensors |

The frontend does not need to know which mode the server is
running in: the JSON shape is identical. When the user wants
temperatures, they run `launch-elevated.cmd` instead of the
plain `perfectwall-server.exe`. We never silently request
elevation; the user is always in control.

## Endpoints

Same as the Rust implementation; field-for-field identical:

- `GET  /api/sysinfo`
- `GET  /api/sysinfo/cpu`
- `GET  /api/sysinfo/gpu`
- `GET  /api/sysinfo/memory`
- `GET  /api/files?directory=...&filter=mp3,flac`
- `GET  /api/files/audio?path=...`
- `GET  /api/files/metadata?path=...`
- `POST /api/files/player/{play-pause,next,prev,stop}`
- `GET  /api/icon?path=...`
- `GET  /api/icon/all?path=...`
- `POST /api/icon/upload`
- `POST /api/icon/cache`
- `GET  /api/config` / `POST /api/config`
- `POST /api/dockbar/open`
- `GET  /api/dockbar/select-file?type=app|file`

## Build

```powershell
.\scripts\build-dotnet.ps1
```

Build prerequisites:

1. MSBuild 16+ (Visual Studio 2019/2022 Build Tools with the
   ".NET Framework 4.8 targeting pack" individual component
   selected)
2. Internet on first build (NuGet pulls
   `LibreHardwareMonitorLib 0.9.4`, `Newtonsoft.Json 13.0.3`,
   `TagLibSharp 2.3.0`)

The script copies the whole `bin/Release/` tree to
`dist/` so the wallpaper engine can pick it up the same way
it picks up the Rust build's `perfectwall-server.exe`.

## CLI

```
perfectwall-server.exe
  --user                       # default: no admin, no LHM
  --admin                      # LHM enabled, requires elevation
  -p, --port <N>               # override listening port
  --auto-start                 # register for Windows login
  --remove-auto-start          # unregister
  --no-server                  # exit without listening
  --console                    # allocate a console window
```

`launch-elevated.cmd` is a tiny wrapper that calls
`Start-Process -Verb RunAs` so the user gets a normal UAC
prompt.

## JSON contract

The endpoint responses use the same field names and types as
the previous Rust implementation. The TypeScript-side
integration tests in `tests/systemMonitor/` and
`tests/systemMonitor/cpuPayload.test.ts` continue to pass
against either backend.

## Trade-offs vs. the previous Rust build

| | Rust + sysinfo + hardware_query | .NET Framework 4.8 + LHM (this build) |
|---|---|---|
| Build tool | `cargo` (Rust toolchain) | MSBuild (VS Build Tools) |
| Bundle size | ~2.7 MB exe, zero DLLs | ~6 MB exe + ~12 MB DLLs (LHM native) |
| CPU usage | yes | yes |
| GPU util | yes (`hardware_query`) | yes (LHM) |
| CPU/GPU temperature | **no** (kernel driver) | **yes** (admin mode only) |
| Fan / power | no | yes (admin mode) |
| Admin required | no | only with `--admin` |
| Defender warning | no | yes (WinRing0) — user opt-in |

The user picks the trade-off; the JSON contract stays the
same.
