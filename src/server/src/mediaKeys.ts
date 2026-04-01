/**
 * Media Key Simulation Module
 *
 * Simulates multimedia keyboard keys (Play/Pause, Next, Previous, Stop)
 * to control external media players via system-wide media key handling.
 *
 * Uses PowerShell + keybd_event API (native Windows) for cross-process
 * media control. Works with any player that respects system media keys.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

// Media key virtual key codes
// See: https://docs.microsoft.com/en-us/windows/win32/inputdev/virtual-key-codes
const VK = {
  MEDIA_PLAY_PAUSE: 0xB3,  // 179
  MEDIA_NEXT_TRACK: 0xB0,   // 176
  MEDIA_PREV_TRACK: 0xB1,   // 177
  MEDIA_STOP: 0xB2          // 178
} as const;

// keybd_event flags
const KEYEVENTF_KEYUP = 0x0002;

type MediaKeyName = 'playPause' | 'next' | 'prev' | 'stop';

export interface MediaKeyResult {
  success: boolean;
  error?: string;
}

// Cache the script path
let scriptPath: string | null = null;

/**
 * Creates a temporary PowerShell script with the key simulation code
 * param block must be at the very beginning of the script
 */
function getScriptPath(): string {
  if (scriptPath) return scriptPath;

  // param must come first, then Add-Type
  const script = `param([int]$vk)
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class MediaKeySim {
    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
}
"@
[MediaKeySim]::keybd_event([byte]$vk, 0, 0, [UIntPtr]::Zero)
Start-Sleep -Milliseconds 50
[MediaKeySim]::keybd_event([byte]$vk, 0, 2, [UIntPtr]::Zero)
`;

  const tempDir = os.tmpdir();
  scriptPath = path.join(tempDir, 'mediakey_sim.ps1');
  fs.writeFileSync(scriptPath, script, 'utf8');
  return scriptPath;
}

/**
 * Simulates a media key press using keybd_event API via PowerShell.
 * This sends the key to the system, which any foreground window can handle.
 */
async function sendMediaKey(key: MediaKeyName): Promise<MediaKeyResult> {
  // Get virtual key code for the media key
  let vkCode: number;
  switch (key) {
    case 'playPause':
      vkCode = VK.MEDIA_PLAY_PAUSE;
      break;
    case 'next':
      vkCode = VK.MEDIA_NEXT_TRACK;
      break;
    case 'prev':
      vkCode = VK.MEDIA_PREV_TRACK;
      break;
    case 'stop':
      vkCode = VK.MEDIA_STOP;
      break;
    default:
      return { success: false, error: `Unknown key: ${key}` };
  }

  try {
    const scriptPath = getScriptPath();
    const { stderr } = await execAsync(
      `powershell -ExecutionPolicy Bypass -File "${scriptPath}" -vk ${vkCode}`,
      { timeout: 5000 }
    );

    if (stderr && stderr.includes('Exception')) {
      return { success: false, error: stderr };
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[MediaKeys] Failed to send ${key}:`, message);
    return { success: false, error: message };
  }
}

/**
 * Simulate Play/Pause media key
 * Works for most media players (MPC-HC, VLC, Spotify, etc.)
 */
export async function mediaKeyPlayPause(): Promise<MediaKeyResult> {
  return sendMediaKey('playPause');
}

/**
 * Simulate Next Track media key
 */
export async function mediaKeyNext(): Promise<MediaKeyResult> {
  return sendMediaKey('next');
}

/**
 * Simulate Previous Track media key
 */
export async function mediaKeyPrev(): Promise<MediaKeyResult> {
  return sendMediaKey('prev');
}

/**
 * Simulate Stop media key
 */
export async function mediaKeyStop(): Promise<MediaKeyResult> {
  return sendMediaKey('stop');
}
