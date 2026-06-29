/**
 * Domain store: systemMonitor
 * System monitor settings (Phase 3)
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSystemMonitorStore = defineStore('systemMonitor', () => {
    const sysmon_enabled = ref(false);
    const sysmon_server_port = ref(0);
    const sysmon_display_style = ref(0);
    const sysmon_size = ref(14);
    const sysmon_color = ref('#ffffff');
    const sysmon_update_interval = ref(3);
    const server_mode = ref(false);

    return {
        sysmon_enabled, sysmon_server_port, sysmon_display_style,
        sysmon_size, sysmon_color, sysmon_update_interval, server_mode,
    };
});
