/**
 * 更新日志附图来源工具。
 *
 * 策略：优先从 GitHub 获取全分辨率原图，本地压缩版（history.json 的
 * image 字段）作为回退；原图超过 timeoutMs 未加载成功则回退到本地。
 *
 * 本模块为纯函数、无副作用，便于在 node 测试环境中直接单测。
 */

/**
 * 由本地图片路径推导 GitHub 原图（raw）URL。
 *
 * @param localPath history.json 中的 image 字段，如 "update/xxx.jpg"
 * @param baseUrl   GitHub raw 基础地址（不含末尾斜杠），
 *                  如 "https://raw.githubusercontent.com/etherfun/perfectWallpaper/main"
 * @returns 完整的 GitHub 原图直链
 */
export function buildGithubImageUrl(localPath: string, baseUrl: string): string {
    const cleanBase = baseUrl.replace(/\/+$/, '');
    const cleanPath = localPath.replace(/^\/+/, '');
    return `${cleanBase}/${cleanPath}`;
}
