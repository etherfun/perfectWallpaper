/**
 * Domain store: dockbar
 * Dock bar settings (Phase 3)
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useDockbarStore = defineStore('dockbar', () => {
    const dockbar_enabled = ref(false);
    const dockbar_position = ref(0);
    const dockbar_icon_size = ref(48);
    const dockbar_yakeli_show = ref(false);

    return {
        dockbar_enabled, dockbar_position, dockbar_icon_size, dockbar_yakeli_show,
    };
});
