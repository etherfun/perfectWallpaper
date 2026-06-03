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
    const { browseBtn, iconSelector, iconGrid, getSelectedType, onPathSelected, onIconSelected, serverUrl } = opts;
    const selectedType = getSelectedType();

    browseBtn.textContent = '选择中...';
    browseBtn.disabled = true;

    try {
        const response = await fetch(`${serverUrl}/api/dockbar/select-file?type=${selectedType}`);
        const data = await response.json();

        if (!data.success || !data.data.path) {
            browseBtn.textContent = '选择文件...';
            return;
        }

        const path: string = data.data.path;
        const name: string = data.data.name || path.split('\\').pop() || '已选择';
        browseBtn.textContent = name;
        browseBtn.classList.add('selected');
        onPathSelected({ path, name });

        iconGrid.innerHTML = '<div class="icon-loading">加载图标中...</div>';
        iconSelector.style.display = 'block';

        try {
            const iconsResponse = await fetch(
                `${serverUrl}/api/icon/all?path=${encodeURIComponent(path)}&t=${Date.now()}`
            );
            const iconsData = await iconsResponse.json();
            populateIconGrid(iconGrid, iconsData, onIconSelected);
        } catch (e) {
            debugLogger.error('[DockBar] Failed to load icons', { path, error: e });
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
    iconsData: { success?: boolean; data?: { icons?: IconEntry[] } },
    onIconSelected: (icon: string) => void
): void {
    iconGrid.innerHTML = '';
    const icons = iconsData.success && iconsData.data?.icons ? iconsData.data.icons : [];

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

interface IconEntry {
    icon: string;
    width: number;
    height: number;
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
    if (!base64Match) {
        debugLogger.error('[DockBar] Invalid image data', { fileType: file.type });
        return;
    }

    try {
        const response = await fetch(`${serverUrl}/api/icon/upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                data: base64Match[1],
                type: file.type || 'image/png',
            }),
        });
        const data = await response.json();
        if (data.success && data.data.icon) {
            appendCustomIcon(iconGrid, data.data.icon, onIconSelected);
        } else {
            debugLogger.error('[DockBar] Failed to upload custom icon', { error: data.error });
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

function appendCustomIcon(iconGrid: HTMLElement, icon: string, onIconSelected: (icon: string) => void): void {
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
