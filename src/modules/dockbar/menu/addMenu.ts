import { clearAllIconCache } from '../iconCache';
import type { DockItem } from '../types';
import { setupBrowseButton, setupCustomIconUpload } from './addMenuBrowse';
import { refreshManageList } from './addMenuManageList';

const URL_PRESETS = [
    { name: 'Google', url: 'https://www.google.com' },
    { name: 'GitHub', url: 'https://github.com' },
    { name: 'YouTube', url: 'https://www.youtube.com' },
    { name: 'Bilibili', url: 'https://www.bilibili.com' },
    { name: 'Wikipedia', url: 'https://www.wikipedia.org' },
];

export interface AddMenuOptions {
    serverUrl: string;
    existingItems: DockItem[];
    onAdd: (item: DockItem) => void;
    onManageChange: (newItems: DockItem[]) => void;
}

export function showAddMenu(opts: AddMenuOptions): void {
    const overlay = createDialogOverlay();
    document.body.appendChild(overlay);

    const refs = queryDialogRefs(overlay);
    populateUrlPresets(refs.urlPresets);

    const state = createDialogState();

    bindTypeSwitching(refs, state);
    bindUrlPresets(refs, state);
    bindPasteUrl(refs.pasteUrlBtn);
    bindCancel(refs.cancelBtn, overlay);
    bindClearCache(refs.clearCacheBtn, opts.serverUrl);
    bindConfirm(refs.confirmBtn, state, opts);
    bindManageSection(overlay, opts);

    if (refs.browseBtn && refs.iconSelector && refs.iconGrid) {
        setupBrowseButton({
            serverUrl: opts.serverUrl,
            browseBtn: refs.browseBtn,
            iconSelector: refs.iconSelector,
            iconGrid: refs.iconGrid,
            getSelectedType: () => state.selectedType,
            onPathSelected: info => {
                state.selectedPath = info.path;
            },
            onIconSelected: icon => {
                state.selectedIcon = icon;
            },
        });

        if (refs.customIconBtn && refs.customIconInput) {
            setupCustomIconUpload({
                serverUrl: opts.serverUrl,
                customIconBtn: refs.customIconBtn,
                customIconInput: refs.customIconInput,
                iconGrid: refs.iconGrid,
                onIconSelected: icon => {
                    state.selectedIcon = icon;
                },
            });
        }
    }
}

interface DialogRefs {
    pathField: HTMLElement | null;
    urlField: HTMLElement | null;
    urlPresets: HTMLElement | null;
    browseBtn: HTMLButtonElement | null;
    pasteUrlBtn: HTMLButtonElement | null;
    cancelBtn: HTMLButtonElement | null;
    confirmBtn: HTMLButtonElement | null;
    clearCacheBtn: HTMLButtonElement | null;
    iconSelector: HTMLElement | null;
    iconGrid: HTMLElement | null;
    customIconBtn: HTMLButtonElement | null;
    customIconInput: HTMLInputElement | null;
}

interface DialogState {
    selectedType: 'app' | 'file' | 'url';
    selectedPath: string;
    selectedUrl: string;
    selectedIcon: string | null;
}

function createDialogOverlay(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.className = 'dockbar-dialog';
    overlay.innerHTML = `
        <div class="dockbar-dialog-content">
            <h3>添加项目</h3>
            <div class="dockbar-dialog-type">
                <button class="type-btn active" data-type="app">应用程序</button>
                <button class="type-btn" data-type="file">文件</button>
                <button class="type-btn" data-type="url">网页链接</button>
            </div>
            <div class="dockbar-dialog-fields">
                <div class="field" id="path-field">
                    <label>路径</label>
                    <button id="dockbar-browse" class="browse-btn">选择文件...</button>
                    <div class="icon-selector" id="icon-selector" style="display:none;">
                        <label>选择图标</label>
                        <div class="icon-grid" id="icon-grid"></div>
                        <button id="dockbar-custom-icon" class="browse-btn" style="margin-top:8px;">自定义图标...</button>
                        <input type="file" id="custom-icon-input" accept="image/*" style="display:none;" />
                    </div>
                </div>
                <div class="field" id="url-field" style="display:none;">
                    <label>网页链接</label>
                    <button id="paste-url-btn" class="paste-btn">从剪贴板获取</button>
                    <div class="url-presets" id="url-presets"></div>
                </div>
            </div>
            <div class="dockbar-dialog-actions">
                <button id="dockbar-clear-cache" title="清除图标缓存">清理缓存</button>
                <div class="actions-right">
                    <button id="dockbar-cancel">取消</button>
                    <button id="dockbar-add-confirm">添加</button>
                </div>
            </div>
        </div>
    `;
    return overlay;
}

function queryDialogRefs(overlay: HTMLElement): DialogRefs {
    return {
        pathField: overlay.querySelector('#path-field'),
        urlField: overlay.querySelector('#url-field'),
        urlPresets: overlay.querySelector('#url-presets'),
        browseBtn: overlay.querySelector('#dockbar-browse'),
        pasteUrlBtn: overlay.querySelector('#paste-url-btn'),
        cancelBtn: overlay.querySelector('#dockbar-cancel'),
        confirmBtn: overlay.querySelector('#dockbar-add-confirm'),
        clearCacheBtn: overlay.querySelector('#dockbar-clear-cache'),
        iconSelector: overlay.querySelector('#icon-selector'),
        iconGrid: overlay.querySelector('#icon-grid'),
        customIconBtn: overlay.querySelector('#dockbar-custom-icon'),
        customIconInput: overlay.querySelector('#custom-icon-input'),
    };
}

function createDialogState(): DialogState {
    return {
        selectedType: 'app',
        selectedPath: '',
        selectedUrl: '',
        selectedIcon: null,
    };
}

function populateUrlPresets(container: HTMLElement | null): void {
    if (!container) return;
    URL_PRESETS.forEach(preset => {
        const btn = document.createElement('button');
        btn.className = 'url-preset-btn';
        btn.textContent = preset.name;
        btn.dataset.url = preset.url;
        container.appendChild(btn);
    });
}

function bindTypeSwitching(refs: DialogRefs, state: DialogState): void {
    const overlay = refs.confirmBtn?.closest('.dockbar-dialog');
    if (!overlay) return;
    const typeBtns = overlay.querySelectorAll('.type-btn');

    typeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            typeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.selectedType = ((btn as HTMLElement).dataset.type || 'app') as
                | 'app'
                | 'file'
                | 'url';
            state.selectedPath = '';
            state.selectedUrl = '';

            overlay
                .querySelectorAll('.url-preset-btn')
                .forEach(b => b.classList.remove('selected'));
            overlay.querySelectorAll('.browse-btn').forEach(b => b.classList.remove('selected'));
            overlay.querySelectorAll('.paste-btn').forEach(b => b.classList.remove('selected'));
            if (refs.browseBtn) refs.browseBtn.textContent = '选择文件...';
            if (refs.pasteUrlBtn) refs.pasteUrlBtn.textContent = '从剪贴板获取';

            if (state.selectedType === 'url') {
                if (refs.pathField) refs.pathField.style.display = 'none';
                if (refs.urlField) refs.urlField.style.display = 'block';
            } else {
                if (refs.pathField) refs.pathField.style.display = 'block';
                if (refs.urlField) refs.urlField.style.display = 'none';
            }
        });
    });
}

function bindUrlPresets(refs: DialogRefs, state: DialogState): void {
    const overlay = refs.confirmBtn?.closest('.dockbar-dialog');
    if (!overlay) return;

    overlay.querySelectorAll('.url-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            overlay
                .querySelectorAll('.url-preset-btn')
                .forEach(b => b.classList.remove('selected'));
            overlay.querySelectorAll('.paste-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            state.selectedUrl = (btn as HTMLElement).dataset.url || '';
        });
    });
}

function bindPasteUrl(pasteUrlBtn: HTMLButtonElement | null): void {
    pasteUrlBtn?.addEventListener('click', () => {
        pasteUrlBtn.textContent = '功能开发中';
        setTimeout(() => {
            pasteUrlBtn.textContent = '从剪贴板获取';
        }, 1500);
    });
}

function bindCancel(cancelBtn: HTMLButtonElement | null, overlay: HTMLElement): void {
    cancelBtn?.addEventListener('click', () => overlay.remove());
}

function bindClearCache(clearCacheBtn: HTMLButtonElement | null, serverUrl: string): void {
    clearCacheBtn?.addEventListener('click', async () => {
        clearCacheBtn.textContent = '清理中...';
        clearCacheBtn.disabled = true;
        await clearAllIconCache(serverUrl);
        clearCacheBtn.textContent = '已清理';
        setTimeout(() => {
            clearCacheBtn.textContent = '清理缓存';
            clearCacheBtn.disabled = false;
        }, 1500);
    });
}

function bindConfirm(
    confirmBtn: HTMLButtonElement | null,
    state: DialogState,
    opts: AddMenuOptions
): void {
    confirmBtn?.addEventListener('click', () => {
        const overlay = confirmBtn.closest('.dockbar-dialog');
        let name: string;
        let path = '';
        let url = '';

        if (state.selectedType === 'url') {
            if (!state.selectedUrl) return;
            url = state.selectedUrl;
            name = URL_PRESETS.find(p => p.url === state.selectedUrl)?.name || '网页链接';
        } else {
            if (!state.selectedPath) return;
            path = state.selectedPath;
            name =
                state.selectedPath
                    .split('\\')
                    .pop()
                    ?.replace(/\.[^/.]+$/, '') || '应用程序';
        }

        const newItem: DockItem = {
            id: `dock_${Date.now()}`,
            name,
            icon: state.selectedIcon || '',
            type: state.selectedType,
            path: path || undefined,
            url: url || undefined,
        };

        opts.onAdd(newItem);
        overlay?.remove();
    });
}

function bindManageSection(overlay: HTMLElement, opts: AddMenuOptions): void {
    const manageSection = document.createElement('div');
    manageSection.className = 'dockbar-dialog-manage';
    manageSection.innerHTML = `
        <h4>管理项目</h4>
        <div class="manage-list" id="manage-list"></div>
    `;
    overlay.querySelector('.dockbar-dialog-content')?.appendChild(manageSection);

    const manageList = manageSection.querySelector('#manage-list') as HTMLElement;
    refreshManageList(manageList, opts.existingItems, {
        onChange: newItems => opts.onManageChange(newItems),
    });
}
