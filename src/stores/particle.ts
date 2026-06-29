/**
 * Domain store: particle
 * Particle effect settings (Phase 3)
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useParticleStore = defineStore('particle', () => {
    const particles_is_particles = ref(false);
    const particles_number = ref(100);
    const particles_opacity = ref(100);
    const particles_opacity_random = ref(false);
    const particles_color = ref([255, 255, 255] as [number, number, number]);
    const particles_shadow_color = ref([255, 255, 255] as [number, number, number]);
    const particles_shadow_blur = ref(10);
    const particles_image = ref('');
    const particles_shape_type = ref(1);
    const map_route = ref('./source/map/1.png');
    const particles_size_value = ref(10);
    const particles_size_random = ref(false);
    const particles_link_enable = ref(false);
    const particles_link_distance = ref(50);
    const particles_link_width = ref(1);
    const particles_link_color = ref([255, 255, 255] as [number, number, number]);
    const particles_link_opacity = ref(50);
    const particles_is_move = ref(true);
    const particles_speed = ref(1);
    const particles_speed_random = ref(false);
    const particles_direction = ref(1);
    const particles_is_straight = ref(false);
    const particles_is_bounce = ref(false);
    const particles_move_out_mode = ref(1);

    return {
        particles_is_particles, particles_number, particles_opacity,
        particles_opacity_random, particles_color, particles_shadow_color,
        particles_shadow_blur, particles_image, particles_shape_type,
        map_route, particles_size_value, particles_size_random,
        particles_link_enable, particles_link_distance, particles_link_width,
        particles_link_color, particles_link_opacity,
        particles_is_move, particles_speed, particles_speed_random,
        particles_direction, particles_is_straight, particles_is_bounce,
        particles_move_out_mode,
    };
});
