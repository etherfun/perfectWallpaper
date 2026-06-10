import {
    type AllIconItem,
    fetchAllIcons as fetchAllIconsApi,
    selectFile as selectFileApi,
    uploadCustomIcon as uploadCustomIconApi,
} from '@/systemMonitor';
import { debugLogger } from '@/utils/logger';

export interface BrowseOptions {
    serverUrl: string;
    browseBtn: HTMLButtonElement;
    iconSelector: HTMLElement;
    iconGrid: HTMLElement;
    getSelectedType: () => string;
    onPathSelected: (info: { path: string; name: string }) => void;
    onIconSelected: (icon: string) => void;
}

export function setupBrowseButton(opts: BrowseOptions): void {
    opts.browseBtn.addEventListener('click', () => {
        void handleBrowseClick(opts);
    });
}

async function handleBrowseClick(opts: BrowseOptions): Promise<void> {
    const {
        browseBtn,
        iconSelector,
        iconGrid,
        getSelectedType,
        onPathSelected,
        onIconSelected,
        serverUrl,
    } = opts;
    const selectedType = getSelectedType();

    browseBtn.textContent = '选择中...';
    browseBtn.disabled = true;

    try {
        const file = await selectFileApi(serverUrl, selectedType === 'app' ? 'app' : 'file');
        if (!file || !file.path) {
            browseBtn.textContent = '选择文件...';
            return;
        }

        const path: string = file.path;
        const name: string = file.name ?? path.split('\\').pop() ?? '已选择';
        browseBtn.textContent = name;
        browseBtn.classList.add('selected');
        onPathSelected({ path, name });

        iconGrid.innerHTML = '<div class="icon-loading">加载图标中...</div>';
        iconSelector.style.display = 'block';

        const iconsData = await fetchAllIconsApi(serverUrl, path);
        if (iconsData) {
            populateIconGrid(iconGrid, iconsData.icons, onIconSelected);
        } else {
            iconGrid.innerHTML = '<div class="icon-no-icons">加载图标失败</div>';
        }
    } catch (e) {
        debugLogger.error('[DockBar] Failed to select file', { error: e });
        browseBtn.textContent = '选择文件...';
    } finally {
        browseBtn.disabled = false;
    }
}

function populateIconGrid(
    iconGrid: HTMLElement,
    icons: AllIconItem[],
    onIconSelected: (icon: string) => void
): void {
    iconGrid.innerHTML = '';

    if (icons.length === 0) {
        iconGrid.innerHTML = '<div class="icon-no-icons">未找到图标</div>';
        return;
    }

    icons.forEach((iconItem, idx) => {
        const iconBtn = document.createElement('button');
        iconBtn.className = 'icon-option';
        if (idx === 0) {
            iconBtn.classList.add('selected');
            onIconSelected(iconItem.icon);
        }
        iconBtn.innerHTML = `<img src="${iconItem.icon}" alt="${iconItem.width}x${iconItem.height}" title="${iconItem.width}x${iconItem.height}" />`;
        iconBtn.addEventListener('click', () => {
            iconGrid.querySelectorAll('.icon-option').forEach(b => b.classList.remove('selected'));
            iconBtn.classList.add('selected');
            onIconSelected(iconItem.icon);
        });
        iconGrid.appendChild(iconBtn);
    });
}

export interface CustomIconUploadOptions {
    serverUrl: string;
    customIconBtn: HTMLButtonElement;
    customIconInput: HTMLInputElement;
    iconGrid: HTMLElement;
    onIconSelected: (icon: string) => void;
}

export function setupCustomIconUpload(opts: CustomIconUploadOptions): void {
    const { customIconBtn, customIconInput, iconGrid, serverUrl, onIconSelected } = opts;

    customIconBtn.addEventListener('click', () => customIconInput.click());

    customIconInput.addEventListener('change', () => {
        void handleCustomIconUpload(customIconInput, iconGrid, serverUrl, onIconSelected);
        customIconInput.value = '';
    });
}

async function handleCustomIconUpload(
    customIconInput: HTMLInputElement,
    iconGrid: HTMLElement,
    serverUrl: string,
    onIconSelected: (icon: string) => void
): Promise<void> {
    const file = customIconInput.files?.[0];
    if (!file) return;

    const dataUrl = await readFileAsDataUrl(file);
    if (!dataUrl) return;

    const base64Match = dataUrl.match(/^data:image\/\w+;base64,(.+)$/);
    if (!base64Match || !base64Match[1]) {
        debugLogger.error('[DockBar] Invalid image data', { fileType: file.type });
        return;
    }

    try {
        const result = await uploadCustomIconApi(serverUrl, {
            data: base64Match[1],
            type: file.type || 'image/png',
        });
        if (result && result.icon) {
            appendCustomIcon(iconGrid, result.icon, onIconSelected);
        } else {
            debugLogger.error('[DockBar] Failed to upload custom icon');
        }
    } catch (err) {
        debugLogger.error('[DockBar] Failed to upload custom icon', { error: err });
    }
}

function readFileAsDataUrl(file: File): Promise<string | null> {
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = e => resolve((e.target?.result as string) ?? null);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
    });
}

function appendCustomIcon(
    iconGrid: HTMLElement,
    icon: string,
    onIconSelected: (icon: string) => void
): void {
    const iconBtn = document.createElement('button');
    iconBtn.className = 'icon-option selected';
    iconBtn.innerHTML = `<img src="${icon}" alt="自定义" title="自定义图标" />`;
    iconBtn.addEventListener('click', () => {
        iconGrid.querySelectorAll('.icon-option').forEach(b => b.classList.remove('selected'));
        iconBtn.classList.add('selected');
        onIconSelected(icon);
    });
    iconGrid.querySelectorAll('.icon-option').forEach(b => b.classList.remove('selected'));
    iconGrid.appendChild(iconBtn);
    onIconSelected(icon);
}
