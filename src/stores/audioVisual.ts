/**
 * Domain store: audioVisual
 * Audio visualizer (PWCircle/PWLine) settings (Phase 3)
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAudioVisualStore = defineStore('audioVisual', () => {
    const visual_audio_model = ref(1);
    const audio_smooth_enabled = ref(true);
    const audio_smooth_factor = ref(70);
    const audio_spatial_window = ref(3);
    const pw_circle_show_bool = ref(true);
    const pw_line_show_bool = ref(true);
    const polygon_angle = ref(1);
    const pw_circle_style = ref(1);
    const pw_circle_radius = ref(50);
    const pw_circle_range = ref(50);
    const pw_circle_color = ref([255, 255, 255] as [number, number, number]);
    const pw_circle_blur_color = ref([255, 255, 255] as [number, number, number]);
    const pw_circle_x = ref(50); const pw_circle_y = ref(50);
    const pw_circle_color_mode = ref(0);
    const pw_circle_solid_color_gradient = ref(false);
    const pw_circle_blur_color_gradient = ref(false);
    const pw_circle_color_rhythm = ref(false);
    const pw_circle_gradient_rate = ref(10);
    const pw_circle_line_width = ref(2);
    const pw_circle_rotation = ref(0);
    const pw_circle_direction = ref(0);
    const pw_circle_wavetransparency = ref(80);
    const pw_circle_show_semi_circle = ref(false);
    const pw_circle_semicircle_direction = ref(0);
    const pw_line_position = ref(50);
    const pw_line_style = ref(1);
    const pw_line_direction = ref(0);
    const pw_line_width = ref(2);
    const pw_line_spacing = ref(50);
    const pw_line_density = ref(100);
    const pw_line_range = ref(50);
    const pw_line_transparency = ref(80);
    const pw_line_color = ref([255, 255, 255] as [number, number, number]);
    const pw_line_blur_color = ref([255, 255, 255] as [number, number, number]);
    const pw_line_x = ref(50); const pw_line_y = ref(50);
    const pw_line_middle_line = ref(false);
    const pw_line_color_mode = ref(0);
    const pw_line_solid_color_gradient = ref(false);
    const pw_line_blur_color_gradient = ref(false);
    const pw_line_color_rhythm = ref(false);
    const pw_line_gradient_rate = ref(10);
    const audio_amplitude = ref(50); const audio_decline = ref(50);
    const audio_is_ring = ref(false); const audio_is_static_ring = ref(false);
    const audio_is_inner_ring = ref(false); const audio_is_outer_ring = ref(false);
    const audio_radius = ref(50); const audio_ring_rotation = ref(50);
    const audio_opacity = ref(90);
    const audio_color = ref([255, 255, 255] as [number, number, number]);
    const audio_shadow_color = ref([255, 255, 255] as [number, number, number]);
    const audio_shadow_blur = ref(75);
    const audio_offset_x = ref(50); const audio_offset_y = ref(50);
    const audio_is_click_offset = ref(false); const audio_is_line_to = ref(false);
    const audio_first_point = ref(50); const audio_second_point = ref(50);
    const audio_point_num = ref(120); const audio_distance = ref(50);
    const audio_line_width = ref(50);
    const audio_is_ball = ref(false); const audio_ball_spacer = ref(50);
    const audio_ball_size = ref(50); const audio_ball_rotation = ref(50);

    return {
        visual_audio_model, audio_smooth_enabled, audio_smooth_factor,
        audio_spatial_window, pw_circle_show_bool, pw_line_show_bool,
        polygon_angle, pw_circle_style, pw_circle_radius, pw_circle_range,
        pw_circle_color, pw_circle_blur_color, pw_circle_x, pw_circle_y,
        pw_circle_color_mode, pw_circle_solid_color_gradient,
        pw_circle_blur_color_gradient, pw_circle_color_rhythm,
        pw_circle_gradient_rate, pw_circle_line_width, pw_circle_rotation,
        pw_circle_direction, pw_circle_wavetransparency,
        pw_circle_show_semi_circle, pw_circle_semicircle_direction,
        pw_line_position, pw_line_style, pw_line_direction, pw_line_width,
        pw_line_spacing, pw_line_density, pw_line_range, pw_line_transparency,
        pw_line_color, pw_line_blur_color, pw_line_x, pw_line_y,
        pw_line_middle_line, pw_line_color_mode,
        pw_line_solid_color_gradient, pw_line_blur_color_gradient,
        pw_line_color_rhythm, pw_line_gradient_rate,
        audio_amplitude, audio_decline, audio_is_ring, audio_is_static_ring,
        audio_is_inner_ring, audio_is_outer_ring, audio_radius,
        audio_ring_rotation, audio_opacity, audio_color, audio_shadow_color,
        audio_shadow_blur, audio_offset_x, audio_offset_y,
        audio_is_click_offset, audio_is_line_to, audio_first_point,
        audio_second_point, audio_point_num, audio_distance, audio_line_width,
        audio_is_ball, audio_ball_spacer, audio_ball_size, audio_ball_rotation,
    };
});
