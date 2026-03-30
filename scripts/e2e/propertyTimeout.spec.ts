import { test, expect } from '@playwright/test';

/**
 * E2E Test: Wallpaper Property Listener - All Configuration Items
 *
 * This test verifies that all configuration categories are correctly
 * received and processed by the wallpaper when sent via applyUserProperties.
 *
 * Note: Wallpaper Engine sends properties in FULL format:
 * {
 *   "wallpaper_updata": {
 *     "condition": "updata_log.value == true",
 *     "index": 1,
 *     "key": "wallpaper_updata",
 *     "order": 101,
 *     "text": "ui_wallpaper_updata",
 *     "type": "bool",
 *     "value": true
 *   }
 * }
 */

// All property categories with FULL format (like Wallpaper Engine sends)
const ALL_PROPERTY_CATEGORIES = {
  // Global settings
  global_settings: {
    global_settings_language: { condition: '', index: 0, key: 'global_settings_language', order: 0, text: '', type: 'text', value: 'zh-CN' },
    wallpaper_updata: { condition: '', index: 0, key: 'wallpaper_updata', order: 101, text: 'ui_wallpaper_updata', type: 'bool', value: true },
    wallpaper_updata_open_on_update: { condition: '', index: 0, key: 'wallpaper_updata_open_on_update', order: 0, text: '', type: 'bool', value: true },
    debugger_copy: { condition: '', index: 0, key: 'debugger_copy', order: 0, text: '', type: 'bool', value: true },
  },

  // Date properties
  date: {
    showDate: { condition: '', index: 0, key: 'showDate', order: 0, text: '', type: 'bool', value: true },
    date_yearFormat: { condition: '', index: 0, key: 'date_yearFormat', order: 0, text: '', type: 'number', value: 1 },
    date_monthFormat: { condition: '', index: 0, key: 'date_monthFormat', order: 0, text: '', type: 'number', value: 1 },
    date_dayFormat: { condition: '', index: 0, key: 'date_dayFormat', order: 0, text: '', type: 'number', value: 1 },
    date_weekFormat: { condition: '', index: 0, key: 'date_weekFormat', order: 0, text: '', type: 'number', value: 1 },
    date_transparency: { condition: '', index: 0, key: 'date_transparency', order: 0, text: '', type: 'number', value: 0.8 },
    DateX: { condition: '', index: 0, key: 'DateX', order: 0, text: '', type: 'number', value: 50 },
    DateY: { condition: '', index: 0, key: 'DateY', order: 0, text: '', type: 'number', value: 45 },
  },

  // Time properties
  time: {
    showTime: { condition: '', index: 0, key: 'showTime', order: 0, text: '', type: 'bool', value: true },
    tShowSencends: { condition: '', index: 0, key: 'tShowSencends', order: 0, text: '', type: 'bool', value: true },
    TimeX: { condition: '', index: 0, key: 'TimeX', order: 0, text: '', type: 'number', value: 50 },
    TimeY: { condition: '', index: 0, key: 'TimeY', order: 0, text: '', type: 'number', value: 50 },
    timetransparency: { condition: '', index: 0, key: 'timetransparency', order: 0, text: '', type: 'number', value: 0.8 },
    time_color_rhythm: { condition: '', index: 0, key: 'time_color_rhythm', order: 0, text: '', type: 'bool', value: false },
    // Colors expect "1 1 1" format (normalized RGB, space-separated)
    TimeColor: { condition: '', index: 0, key: 'TimeColor', order: 0, text: '', type: 'text', value: '1 1 1' },
  },

  // Sakura properties
  sakura: {
    showSakura: { condition: '', index: 0, key: 'showSakura', order: 0, text: '', type: 'bool', value: true },
    sakuratransparency: { condition: '', index: 0, key: 'sakuratransparency', order: 0, text: '', type: 'number', value: 0.15 },
    sakurabackground: { condition: '', index: 0, key: 'sakurabackground', order: 0, text: '', type: 'bool', value: true },
    sakurabackcolor: { condition: '', index: 0, key: 'sakurabackcolor', order: 0, text: '', type: 'bool', value: true },
    sakurareverse: { condition: '', index: 0, key: 'sakurareverse', order: 0, text: '', type: 'bool', value: false },
    sakurapointnumber: { condition: '', index: 0, key: 'sakurapointnumber', order: 0, text: '', type: 'number', value: 300 },
    sakurabacklight: { condition: '', index: 0, key: 'sakurabacklight', order: 0, text: '', type: 'number', value: 0.01 },
  },

  // Audio visualizer properties
  audioVisual: {
    visual_audio_model: { condition: '', index: 0, key: 'visual_audio_model', order: 0, text: '', type: 'number', value: 1 },
    PWCircle_show_bool: { condition: '', index: 0, key: 'PWCircle_show_bool', order: 0, text: '', type: 'bool', value: true },
    PWLine_show_bool: { condition: '', index: 0, key: 'PWLine_show_bool', order: 0, text: '', type: 'bool', value: true },
  },

  // Audio circle parameters
  audioCircle: {
    style: { condition: '', index: 0, key: 'style', order: 0, text: '', type: 'number', value: 1 },
    radius: { condition: '', index: 0, key: 'radius', order: 0, text: '', type: 'number', value: 50 },
    range: { condition: '', index: 0, key: 'range', order: 0, text: '', type: 'number', value: 50 },
    color: { condition: '', index: 0, key: 'color', order: 0, text: '', type: 'text', value: '1 1 1' },
    cX: { condition: '', index: 0, key: 'cX', order: 0, text: '', type: 'number', value: 50 },
    cY: { condition: '', index: 0, key: 'cY', order: 0, text: '', type: 'number', value: 50 },
    showSemiCircle: { condition: '', index: 0, key: 'showSemiCircle', order: 0, text: '', type: 'bool', value: false },
  },

  // Audio line parameters
  audioLine: {
    PWLineStyle: { condition: '', index: 0, key: 'PWLineStyle', order: 0, text: '', type: 'number', value: 1 },
    PWLineWidth: { condition: '', index: 0, key: 'PWLineWidth', order: 0, text: '', type: 'number', value: 2 },
    PWLineDensity: { condition: '', index: 0, key: 'PWLineDensity', order: 0, text: '', type: 'number', value: 100 },
    PWLineColor: { condition: '', index: 0, key: 'PWLineColor', order: 0, text: '', type: 'text', value: '1 1 1' },
    PWLineX: { condition: '', index: 0, key: 'PWLineX', order: 0, text: '', type: 'number', value: 50 },
    PWLineY: { condition: '', index: 0, key: 'PWLineY', order: 0, text: '', type: 'number', value: 50 },
  },

  // Player control properties
  playerControl: {
    player_control_autohide: { condition: '', index: 0, key: 'player_control_autohide', order: 0, text: '', type: 'bool', value: true },
    player_control_show: { condition: '', index: 0, key: 'player_control_show', order: 0, text: '', type: 'bool', value: false },
    player_control_scalefactor: { condition: '', index: 0, key: 'player_control_scalefactor', order: 0, text: '', type: 'number', value: 1 },
    player_control_color: { condition: '', index: 0, key: 'player_control_color', order: 0, text: '', type: 'text', value: '1 1 1' },
    playerx: { condition: '', index: 0, key: 'playerx', order: 0, text: '', type: 'number', value: 50 },
    playery: { condition: '', index: 0, key: 'playery', order: 0, text: '', type: 'number', value: 50 },
  },

  // Weather properties
  weather: {
    weather_api_choose: { condition: '', index: 0, key: 'weather_api_choose', order: 0, text: '', type: 'number', value: 1 },
    citynumber: { condition: '', index: 0, key: 'citynumber', order: 0, text: '', type: 'text', value: '101010100' },
    weather_unit: { condition: '', index: 0, key: 'weather_unit', order: 0, text: '', type: 'text', value: 'metric' },
    weather_lang: { condition: '', index: 0, key: 'weather_lang', order: 0, text: '', type: 'text', value: 'zh' },
    weather_show: { condition: '', index: 0, key: 'weather_show', order: 0, text: '', type: 'bool', value: true },
  },

  // Hitokoto (一言) properties
  hitokoto: {
    hitokoto_updata: { condition: '', index: 0, key: 'hitokoto_updata', order: 0, text: '', type: 'number', value: 6 },
    hitokoto_show: { condition: '', index: 0, key: 'hitokoto_show', order: 0, text: '', type: 'bool', value: true },
    hitokoto_size: { condition: '', index: 0, key: 'hitokoto_size', order: 0, text: '', type: 'number', value: 20 },
    hitokotoX: { condition: '', index: 0, key: 'hitokotoX', order: 0, text: '', type: 'number', value: 50 },
    hitokotoY: { condition: '', index: 0, key: 'hitokotoY', order: 0, text: '', type: 'number', value: 80 },
  },

  // Countdown properties
  countdown: {
    countdown_show: { condition: '', index: 0, key: 'countdown_show', order: 0, text: '', type: 'bool', value: true },
    countdown_year: { condition: '', index: 0, key: 'countdown_year', order: 0, text: '', type: 'number', value: 2025 },
    countdown_month: { condition: '', index: 0, key: 'countdown_month', order: 0, text: '', type: 'number', value: 1 },
    countdown_day: { condition: '', index: 0, key: 'countdown_day', order: 0, text: '', type: 'number', value: 1 },
    countdown_txt: { condition: '', index: 0, key: 'countdown_txt', order: 0, text: '', type: 'text', value: 'New Year' },
    countdownX: { condition: '', index: 0, key: 'countdownX', order: 0, text: '', type: 'number', value: 50 },
    countdownY: { condition: '', index: 0, key: 'countdownY', order: 0, text: '', type: 'number', value: 70 },
  },

  // Background/slide properties
  background: {
    wallpapermode: { condition: '', index: 0, key: 'wallpapermode', order: 0, text: '', type: 'number', value: 1 },
    TransitionMode: { condition: '', index: 0, key: 'TransitionMode', order: 0, text: '', type: 'number', value: 1 },
    random: { condition: '', index: 0, key: 'random', order: 0, text: '', type: 'bool', value: false },
    speed: { condition: '', index: 0, key: 'speed', order: 0, text: '', type: 'number', value: 1 },
    bgy: { condition: '', index: 0, key: 'bgy', order: 0, text: '', type: 'number', value: 512 },
    bgx: { condition: '', index: 0, key: 'bgx', order: 0, text: '', type: 'number', value: 512 },
    bgs: { condition: '', index: 0, key: 'bgs', order: 0, text: '', type: 'number', value: 100 },
  },

  // RGB effects
  rgb: {
    rgb_show: { condition: '', index: 0, key: 'rgb_show', order: 0, text: '', type: 'bool', value: true },
    rgb_bg: { condition: '', index: 0, key: 'rgb_bg', order: 0, text: '', type: 'bool', value: true },
    rgb_sa: { condition: '', index: 0, key: 'rgb_sa', order: 0, text: '', type: 'bool', value: false },
    rgb_au: { condition: '', index: 0, key: 'rgb_au', order: 0, text: '', type: 'bool', value: false },
    rgb_color_rainbow: { condition: '', index: 0, key: 'rgb_color_rainbow', order: 0, text: '', type: 'bool', value: false },
  },

  // Particles
  particles: {
    particles_isParticles: { condition: '', index: 0, key: 'particles_isParticles', order: 0, text: '', type: 'bool', value: true },
    particles_number: { condition: '', index: 0, key: 'particles_number', order: 0, text: '', type: 'number', value: 100 },
    particles_opacity: { condition: '', index: 0, key: 'particles_opacity', order: 0, text: '', type: 'number', value: 0.5 },
    particles_speed: { condition: '', index: 0, key: 'particles_speed', order: 0, text: '', type: 'number', value: 1 },
    particles_color: { condition: '', index: 0, key: 'particles_color', order: 0, text: '', type: 'text', value: '1 1 1' },
  },

  // Fluid effect
  fluidEffect: {
    fluidEffectEnabled: { condition: '', index: 0, key: 'fluidEffectEnabled', order: 0, text: '', type: 'bool', value: false },
    fluidEffectResolution: { condition: '', index: 0, key: 'fluidEffectResolution', order: 0, text: '', type: 'number', value: 240 },
    fluidEffectBlurAmount: { condition: '', index: 0, key: 'fluidEffectBlurAmount', order: 0, text: '', type: 'number', value: 20 },
  },

  // Fullscreen lyrics
  lyrics: {
    fullscreen_lyrics_enabled: { condition: '', index: 0, key: 'fullscreen_lyrics_enabled', order: 0, text: '', type: 'bool', value: false },
    fullscreen_lyrics_show_translation: { condition: '', index: 0, key: 'fullscreen_lyrics_show_translation', order: 0, text: '', type: 'bool', value: true },
  },

  // System monitor
  systemMonitor: {
    sysmon_enabled: { condition: '', index: 0, key: 'sysmon_enabled', order: 0, text: '', type: 'bool', value: false },
    sysmon_server_url: { condition: '', index: 0, key: 'sysmon_server_url', order: 0, text: '', type: 'text', value: 'http://localhost:3842' },
    sysmon_update_interval: { condition: '', index: 0, key: 'sysmon_update_interval', order: 0, text: '', type: 'number', value: 2000 },
  },
};

// Flatten all properties into a single object
function getAllProperties() {
  const allProps: Record<string, any> = {};
  for (const category of Object.values(ALL_PROPERTY_CATEGORIES)) {
    Object.assign(allProps, category);
  }
  return allProps;
}

test.describe('Wallpaper Property Listener - All Configuration Items', () => {
  test('should receive and process all property categories without errors', async ({ page }) => {
    // Track console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1000);

    // Step 1: Inject the spy listener that captures properties
    await page.evaluate(() => {
      const originalListener = (window as any).wallpaperPropertyListener;
      const receivedProps: Record<string, any> = {};

      if (originalListener && originalListener.applyUserProperties) {
        // Wrap the original listener to capture properties
        originalListener.applyUserProperties = ((originalFn: Function) => {
          return function(this: any, properties: Record<string, any>) {
            Object.assign(receivedProps, properties);
            return originalFn.call(this, properties);
          };
        })(originalListener.applyUserProperties);
      }

      // Store in window for test access
      (window as any).__capturedProps = receivedProps;
    });

    // Step 2: Now send all properties in FULL Wallpaper Engine format
    const allProperties = getAllProperties();
    await page.evaluate((props) => {
      const listener = (window as any).wallpaperPropertyListener;
      if (listener?.applyUserProperties) {
        listener.applyUserProperties(props);
      }
    }, allProperties);

    // Wait for properties to be processed
    await page.waitForTimeout(1000);

    // Step 3: Read the captured properties
    const receivedProperties = await page.evaluate(() => {
      return (window as any).__capturedProps || {};
    });

    // Verify all expected properties were received
    const expectedKeys = Object.keys(allProperties);
    const receivedKeys = Object.keys(receivedProperties);

    console.log(`Expected ${expectedKeys.length} properties, received ${receivedKeys.length}`);

    // Log all received property keys
    console.log('All received properties:', receivedKeys);

    // Check for missing properties
    const missingProperties = expectedKeys.filter(key => !(key in receivedProperties));

    if (missingProperties.length > 0) {
      console.log('Missing properties:', missingProperties);
    }

    // All expected properties should be received
    expect(missingProperties).toHaveLength(0);

    // Verify no critical errors occurred
    const criticalErrors = consoleErrors.filter(err =>
      !err.includes('favicon') &&
      !err.includes('404') &&
      !err.includes('net::') &&
      !err.includes('CORS') &&
      !err.includes('tianqi.com') &&
      !err.includes('Access-Control')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('should handle each property category independently', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1000);

    // Test each category independently
    const categoryNames = Object.keys(ALL_PROPERTY_CATEGORIES);

    for (const categoryName of categoryNames) {
      const categoryProps = ALL_PROPERTY_CATEGORIES[categoryName as keyof typeof ALL_PROPERTY_CATEGORIES];

      // Send properties for this category
      await page.evaluate((props) => {
        const listener = (window as any).wallpaperPropertyListener;
        if (listener?.applyUserProperties) {
          listener.applyUserProperties(props);
        }
      }, categoryProps);

      // Small delay to allow processing
      await page.waitForTimeout(100);
    }

    // Verify page is still functional
    const pageTitle = await page.title();
    expect(pageTitle).toBeTruthy();

    // Check for errors
    const criticalErrors = consoleErrors.filter(err =>
      !err.includes('favicon') &&
      !err.includes('404') &&
      !err.includes('net::') &&
      !err.includes('CORS') &&
      !err.includes('tianqi.com') &&
      !err.includes('Access-Control')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('should not crash when no properties received after 6 seconds (timeout fallback)', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('http://localhost:3000');

    // Wait for page to load first
    await page.waitForTimeout(500);

    // Now override the listener to prevent properties
    await page.evaluate(() => {
      // Override to prevent Wallpaper Engine from sending properties
      (window as any).wallpaperPropertyListener = {
        applyUserProperties: () => { /* do nothing */ },
        applyGeneralProperties: () => {},
        userDirectoryFilesAddedOrChanged: () => {},
        userDirectoryFilesRemoved: () => {},
        setPaused: () => {},
      };
    });

    // Wait for timeout to trigger (5 seconds + buffer)
    await page.waitForTimeout(6000);

    // Page should still be alive
    const pageTitle = await page.title();
    expect(pageTitle).toBeTruthy();

    // No critical errors
    const criticalErrors = consoleErrors.filter(err =>
      !err.includes('favicon') &&
      !err.includes('404') &&
      !err.includes('net::') &&
      !err.includes('CORS') &&
      !err.includes('tianqi.com') &&
      !err.includes('Access-Control')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('should process properties and handle special values', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1000);

    // Send properties with edge case values in FULL format
    const specialValues = {
      // Empty string
      countdown_txt: { condition: '', index: 0, key: 'countdown_txt', order: 0, text: '', type: 'text', value: '' },
      // Max values
      particles_number: { condition: '', index: 0, key: 'particles_number', order: 0, text: '', type: 'number', value: 10000 },
      // Min values
      timetransparency: { condition: '', index: 0, key: 'timetransparency', order: 0, text: '', type: 'number', value: 0 },
      // Unicode
      countdown_txt1: { condition: '', index: 0, key: 'countdown_txt1', order: 0, text: '', type: 'text', value: '测试中文 🎉' },
      // Decimal
      sakuratransparency: { condition: '', index: 0, key: 'sakuratransparency', order: 0, text: '', type: 'number', value: 0.123456 },
      // Boolean
      random: { condition: '', index: 0, key: 'random', order: 0, text: '', type: 'bool', value: true },
      // RGB color string (normalized format)
      TimeColor: { condition: '', index: 0, key: 'TimeColor', order: 0, text: '', type: 'text', value: '1 0 0.5' },
    };

    await page.evaluate((props) => {
      const listener = (window as any).wallpaperPropertyListener;
      if (listener?.applyUserProperties) {
        listener.applyUserProperties(props);
      }
    }, specialValues);

    // Wait for processing
    await page.waitForTimeout(500);

    // Page should still be functional
    const pageTitle = await page.title();
    expect(pageTitle).toBeTruthy();
  });
});