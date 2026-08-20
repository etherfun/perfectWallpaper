import { computed } from 'vue';

import { useConfigStore } from '@/stores/config';
import { useRuntimeStore } from '@/stores/runtime';

/** 响应式图片信息，模板直接绑定 */
export function usePictureInfo() {
    const cfg = useConfigStore();
    const rt = useRuntimeStore();

    const title = computed(() => rt.photo.infomation.title);
    const author = computed(() => rt.photo.infomation.copyright);
    const location = computed(() => rt.photo.infomation.where);
    const description = computed(() => rt.photo.infomation.text);
    const rorL = computed(() => cfg.pictures_info_show_ror_l);

    return { title, author, location, description, rorL };
}
