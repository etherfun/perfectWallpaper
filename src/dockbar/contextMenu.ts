export function showContextMenu(itemId: string | undefined, event: MouseEvent, onDelete: (id: string) => void): void {
    if (!itemId) return;

    document.querySelector('.dockbar-context-menu')?.remove();

    const menu = document.createElement('div');
    menu.className = 'dockbar-context-menu';
    menu.innerHTML = `<div class="menu-item delete">删除</div>`;
    menu.style.left = `${event.clientX}px`;
    menu.style.top = `${event.clientY}px`;

    menu.querySelector('.delete')?.addEventListener('click', () => {
        onDelete(itemId);
        menu.remove();
    });

    document.body.appendChild(menu);

    const closeMenu = (e: MouseEvent) => {
        if (!menu.contains(e.target as Node)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 0);
}
