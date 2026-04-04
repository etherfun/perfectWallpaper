/**
 * 获取格式化时间
 */
export function getTime(date: Date | string, showDate: boolean): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    if (showDate) {
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    return `${hours}:${minutes}:${seconds}`;
}
