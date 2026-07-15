/**
 * NASA 每日天文图源
 * - mode 1: APOD JSON API
 * - mode 2: HTML scraper
 *
 * Stage 3.5-A3: galaxy_api 改读 Pinia；runtime.photo.* 保留 appConfig。
 */

import { useConfigStore } from '@/stores/config';
import { useRuntimeStore } from '@/stores/runtime';

import { picturesinfo_showrl } from './info';
import { onImageError, onImageLoad } from './loader';
import type { NasaApodResponse } from './types';

const runtimeStore = useRuntimeStore();

function loadNasaApod(): void {
    fetch('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY&thumbs=true')
        .then(response => response.json())
        .then((get: NasaApodResponse) => {
            let url: string;
            if (get.media_type == 'video') {
                url = get.thumbnail_url || '';
            } else {
                url = get.hdurl || '';
            }

            runtimeStore.photo.infomation.title = get.title;
            runtimeStore.photo.infomation.text = get.explanation;
            if (get.copyright == undefined) {
                runtimeStore.photo.infomation.copyright = '';
            } else {
                runtimeStore.photo.infomation.copyright = get.copyright;
            }
            runtimeStore.photo.infomation.where = '';
            picturesinfo_showrl(
                runtimeStore.photo.infomation.title,
                runtimeStore.photo.infomation.copyright,
                runtimeStore.photo.infomation.where,
                runtimeStore.photo.infomation.text
            );

            const img = new Image();
            img.src = url;
            img.onload = function () {
                onImageLoad(img.src);
            };
            img.onerror = function () {
                onImageError('NASA APOD', url);
            };
        });
}

function loadNasaApodHtml(): void {
    fetch('https://apod.nasa.gov/')
        .then(response => response.text())
        .then((get: string) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(get, 'text/html');
            const url =
                'https://apod.nasa.gov/apod/' + doc.querySelector('img')?.getAttribute('src');

            runtimeStore.photo.infomation.title = doc.querySelector('b')?.textContent || '';
            runtimeStore.photo.infomation.text = doc.querySelectorAll('p')[2]?.textContent || '';
            runtimeStore.photo.infomation.copyright =
                doc.querySelectorAll('a')[2]?.textContent || '';
            runtimeStore.photo.infomation.where = '';
            picturesinfo_showrl(
                runtimeStore.photo.infomation.title,
                runtimeStore.photo.infomation.copyright,
                runtimeStore.photo.infomation.where,
                runtimeStore.photo.infomation.text
            );

            const img = new Image();
            img.src = url;
            img.onload = function () {
                onImageLoad(img.src);
            };
            img.onerror = function () {
                onImageError('NASA APOD HTML', url);
            };
        });
}

export function loadNasa(): void {
    const store = useConfigStore();
    const galaxyapi = store.galaxy_api;
    if (galaxyapi === 2) {
        loadNasaApodHtml();
    } else {
        loadNasaApod();
    }
}
