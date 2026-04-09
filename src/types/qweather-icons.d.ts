// qweather-icons 类型声明
// esbuild 支持使用 ?raw 导入 SVG 文件内容

declare module 'qweather-icons/icons/*.svg' {
    const content: string;
    export default content;
}

declare module 'qweather-icons/icons/*-fill.svg' {
    const content: string;
    export default content;
}
