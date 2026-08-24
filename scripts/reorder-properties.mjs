#!/usr/bin/env node
/**
 * project.json 配置项层级调整工具
 *
 * 用途：把一个（或多个）属性移动到另一个属性之前/之后，其余属性
 * 的 index/order 自动顺延，保持「order = index + 100」惯例。
 *
 * 用法：
 *   node scripts/reorder-properties.mjs <操作> <被移动的键...> --at <锚点键> [--dry]
 *
 * 操作：
 *   before   把被移动的属性插到锚点之前
 *   after    把被移动的属性插到锚点之后
 *   first    移到最前（忽略 --at）
 *   last     移到最后（忽略 --at）
 *
 * 示例：
 *   # 把 audioGain 移到 audioSmoothEnabled 之前
 *   node scripts/reorder-properties.mjs before audioGain --at audioSmoothEnabled
 *
 *   # 把两个属性一起移到 help 之后
 *   node scripts/reorder-properties.mjs after audioGain audioResponse --at help
 *
 *   # 预览模式：只打印结果不写文件
 *   node scripts/reorder-properties.mjs last Test_Author --dry
 *
 * 说明：
 *   - JSON 对象键顺序即 WE 设置面板显示顺序；本脚本通过重建 properties
 *     对象实现重排，其余字段（localization 等）原样保留。
 *   - 重排后按新顺序重新编号 index = 序号，order = index + 100，
 *     消除历史遗留的乱序/重复编号。
 *   - 文件以 UTF-8 无 BOM、4 空格缩进、LF 写回（与仓库现状一致）。
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ── 参数解析 ──
const args = process.argv.slice(2);
const dry = args.includes('--dry');
const atIdx = args.indexOf('--at');
const anchor = atIdx >= 0 ? args[atIdx + 1] : undefined;
const positional = args.filter((a, i) => !a.startsWith('--') && (atIdx < 0 || i !== atIdx + 1));

const op = positional[0];
const keysToMove = positional.slice(1);

function usage() {
    console.error(
        [
            '用法: node scripts/reorder-properties.mjs <before|after|first|last> <键...> [--at <锚点>] [--dry]',
            '',
            '示例:',
            '  node scripts/reorder-properties.mjs before audioGain --at audioSmoothEnabled',
            '  node scripts/reorder-properties.mjs last Test_Author --dry',
        ].join('\n')
    );
    process.exit(1);
}

if (!op || !['before', 'after', 'first', 'last'].includes(op)) usage();
if ((op === 'before' || op === 'after') && (!anchor || keysToMove.length === 0)) usage();
if ((op === 'first' || op === 'last') && keysToMove.length === 0) usage();

// ── 读取 ──
const FILE = resolve(process.cwd(), 'project.json');
const raw = readFileSync(FILE, 'utf8');
const project = JSON.parse(raw);
const props = project.general?.properties;
if (!props) {
    console.error('错误: 未找到 general.properties');
    process.exit(1);
}

// 校验键存在
const allKeys = Object.keys(props);
for (const k of [...keysToMove, ...(anchor ? [anchor] : [])]) {
    if (!allKeys.includes(k)) {
        console.error(`错误: 属性 "${k}" 不存在于 general.properties`);
        process.exit(1);
    }
}
for (const k of keysToMove) {
    if (k === anchor) {
        console.error('错误: 被移动的键与锚点相同');
        process.exit(1);
    }
}

// ── 重排 ──
const moving = new Set(keysToMove);
/** 原顺序去掉被移动的键 */
const rest = allKeys.filter(k => !moving.has(k));

let insertAt;
if (op === 'first') insertAt = 0;
else if (op === 'last') insertAt = rest.length;
else {
    const anchorPos = rest.indexOf(anchor); // 锚点不在移动集合中，必然找到
    insertAt = op === 'before' ? anchorPos : anchorPos + 1;
}
rest.splice(insertAt, 0, ...keysToMove);

// ── 重新编号并重建对象 ──
const next = {};
rest.forEach((k, i) => {
    const p = props[k];
    // 有 index 的属性按惯例编号；无 index 的（如 text 分组说明）保持原样
    if (typeof p.index === 'number') {
        p.index = i;
        p.order = i + 100;
    }
    next[k] = p;
});
project.general.properties = next;

// ── 输出 ──
const preview = keysToMove
    .map(k => {
        const i = rest.indexOf(k);
        return `  ${k}: index=${next[k].index}, order=${next[k].order}`;
    })
    .join('\n');

if (op === 'first' || op === 'last') {
    console.log(`已把 ${keysToMove.join(', ')} 移到${op === 'first' ? '最前' : '最后'}:`);
} else {
    console.log(`已把 ${keysToMove.join(', ')} 移到 ${anchor} ${op === 'before' ? '之前' : '之后'}:`);
}
console.log(preview);

if (dry) {
    console.log('(dry run — 未写入文件)');
} else {
    writeFileSync(FILE, JSON.stringify(project, null, 4) + '\n', { encoding: 'utf8' });
    console.log(`已写入 ${FILE}`);
}
