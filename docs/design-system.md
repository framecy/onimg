# Onimg Design System — v4（4px 网格 · 布局契约）

> 分支：`fix-report` · 审计日期：2026-10-21
> 定位：**先统一「尺度与布局」，再谈视觉风格。** 本版是 v4 的目标规范，同时记录当前代码与规范的差距（§5）。
> 一句话规则：**所有间距、尺寸、圆角、行高走 4px 网格；前后台共用同一套布局契约；禁止 arbitrary 值（方括号）随手写。**
>
> 配套预览：[`design-system-preview.html`](./design-system-preview.html)（**v4 可视化预览，与本文同步**）。
>
> 文档地图：§3 布局契约 · §4 Tokens · §5 修复前审计快照 · §6 迁移映射 · §7 组件配方 · §8 验收 · §10 实施记录 · §11 逐项对照 · §12 预览页说明。

---

## 0. v4 相对 v3 改了什么

| # | v3 | v4 |
|---|---|---|
| 1 | 4px 只是"建议"，大量 `px-[18px]` / `gap-[5px]` / `py-[9px]` | **4px 是硬规则**：间距只能是 4 的倍数（1px 描边、1px 分隔线除外） |
| 2 | 前后台各自写宽度与内边距 | **一份布局契约**：侧栏 240、内容 1600、统一 gutter / 页头 / 页脚 |
| 3 | 圆角 4/6/8/12/16，另有一堆 `[3px][5px][7px][9px][10px]` | **圆角 4/8/12/16**（+ full / 抽屉 24），按"控件 / 容器 / 弹层 / 抽屉"四档使用 |
| 4 | 字号靠 `text-[.78rem]` 这类手写值 | **9 级字阶 + 固定行高**，持久可见文字 ≥ 11px |
| 5 | 验收只看"工具类数量" | 验收看**可量化的网格合规率 + 真实页面渲染** |

> **当前状态（2026-10-21 晚）**：P0–P4 已落地，代码已按本文件统一；实施记录见 §10。
> §5 保留的是**修复前快照**，用于追溯问题，不再代表当前代码。

---

## 1. 页面地图

| 页面 | 入口 | 文件 | 关键结构 |
|---|---|---|---|
| 用户前台 | `/` | `src/page.js` | 侧栏 + 移动端顶栏/底栏 + 5 个面板 + 13 个 Modal + Lightbox + Toast |
| 管理后台 | `/admin` | `src/admin-page.js` | 侧栏 + 9 个 section + 12 个 Modal + Lightbox + Toast |
| 设备授权 | `/auth/device` | `src/index.js::serveDeviceAuthPage` | 单卡片登录页 |
| 公开页面/原型 | `/p/*`、`/proto/*` | `src/pages/*`、`src/proto/*` | 独立内容页，不套后台壳 |

架构不变：Worker 返回内联 HTML，`aperture.generated.js` 由 `build:css` 生成并内联注入。

---

## 2. 设计原则

1. **4px 网格**：间距、尺寸、圆角、行高全部落 4px；**没有"差 1–2px 更顺眼"的例外**。
2. **一份布局契约**：前后台的页头、页脚、内容边界、弹层宽度使用同一套数值。
3. **Image First**：画布比壳层更深，图片边缘干净，卡片只做轻微抬起。
4. **Quiet Chrome**：层次靠边框、留白、字号；不堆渐变、彩色阴影、大圆角。
5. **Neutral Emphasis**：品牌强调只用中性黑/白；语义色只表达状态。
6. **Readable Micro**：持久可见文字 ≥ 11px；11px 只给标签/表头/徽章，不用于正文。
7. **Restrained Motion**：150ms，`cubic-bezier(.2,.8,.2,1)`；Toast 允许轻微回弹。
8. **单一来源**：token 在 `aperture.css` 的 `@theme`；组件只用工具类，不再新增手写组件类。

---

## 3. 布局契约（前后台强制统一）

### 3.1 断点

| 名称 | 宽度 | 用途 |
|---|---|---|
| `xs` | 480px | 手机竖屏微调（三列图库等） |
| `sm` | 600px | 手机/大屏手机分界 |
| `md` | 768px | 侧栏出现、移动顶栏/底栏消失 |
| `lg` | 1024px | 桌面宽间距 |

> 现状还有 480/600 两套 `@media` 写在 `page.js` 内联样式里（`page.js:35/130/134`）。v4 统一用 Tailwind 断点，不再新增手写 media query。

### 3.2 应用外壳

| 元素 | 规格 | 说明 |
|---|---|---|
| 侧栏 | `w-60` = **240px**，固定 | 前后台同宽；`<md` 收起为抽屉 |
| 移动顶栏 | **48px**（`h-12`） | 现为 50px，改 48 |
| 移动底栏 | **64px**（`h-16`）+ safe-area | 现为内容高度不一，统一 64 |
| 内容偏移 | `md:ml-60` | 与侧栏同源 |
| 页脚 | 与内容同宽、同 gutter | 现前台页脚是全宽 + `px-[30px]`，需收进内容栅格 |
| 侧栏分区线 | `border-bd` 1px | 一致 |
| 侧栏头像/Logo | 32×32（`h-8 w-8`） | 现为 30/26/36/44 混用 |

### 3.3 内容宽度与 gutter

| 视口 | 内容最大宽 | 左右 gutter | 顶部留白 |
|---|---|---|---|
| `<480` | 100% | **16px** (`px-4`) | 顶栏 48 + 16 = **64px** |
| `480–767` | 100% | **20px** (`px-5`) | **64px** |
| `768–1023` | 100% | **24px** (`px-6`) | **32px** (`pt-8`) |
| `≥1024` | **1600px** | **32px** (`px-8`) | **32px** (`pt-8`) |

- 内容容器统一写法：
  ```
  mx-auto w-full max-w-[1600px] px-4 pt-16 pb-12
  sm:px-5 md:px-6 md:pt-8 lg:px-8
  ```
- **所有 section / panel 都用这一个容器**。禁止 `max-w-[1200px]` 之类的局部宽度（现状：后台"页面管理" `admin-page.js:573` 是 1200，切 tab 时内容会横向跳 400px）。
- 1600 含 gutter（`border-box`）。若未来觉得太宽，**全站一起改成一个值**，不允许单页例外。

### 3.4 页头（Page Header）

```
.page-header: flex flex-wrap items-end gap-4
              border-b border-bd pb-4 mb-6
              md:pb-6 md:mb-8
.page-title:  text-xl md:text-2xl font-extrabold tracking-[-.03em] text-tx
.page-sub:    text-sm font-medium text-tx-3
```

| 项 | 移动 | 桌面 |
|---|---|---|
| 标题 | 18px（`text-xl`） | 22px（`text-2xl`） |
| 副标题 | 13px（`text-sm`） | 13px |
| 标题/副标题间距 | 4px（`gap-1`） | 4px |
| 下边距（到分隔线） | 16px（`pb-4`） | 24px（`pb-6`） |
| 分隔线到内容 | 24px（`mb-6`） | 32px（`mb-8`） |

> 现状：前台 `pb-[18px] md:pb-6`（`page.js:232` 等 5 处），后台 `pb-6`（`admin-page.js:225` 等 8 处），移动端差 6px。

### 3.5 垂直节奏

| 关系 | 规格 |
|---|---|
| 页头 → 第一块内容 | 24 / 32 |
| 内容块之间 | 24（`mb-6`） |
| 卡片内 padding | 16 移动 / 20 桌面 |
| 表单字段之间 | 16（`gap-4` 或 `space-y-4`） |
| 标签与输入框 | 8（`gap-2`） |
| 按钮组 | 8（`gap-2`） |
| 表格区块与工具栏 | 16（`mb-4`） |

### 3.6 浮层宽度（Modal / Lightbox / 登录卡）

| Token | 宽度 | 用途 |
|---|---|---|
| `auth` | **380** | 前台登录、后台登录、设备授权 |
| `sm` | **420** | 改密码、标签、项目、分组、移动、确认 |
| `md` | **520** | 编辑/导入/新建用户/批量移动（默认弹层） |
| `lg` | **680** | 访问统计、成员统计 |
| `xl` | **760** | 回收站、图片 Lightbox |
| `2xl` | **860** | 版本历史/对比 |
| `3xl` | **960** | 页面编辑器、原型预览 |

规则：

- 弹层容器只写**一个**宽度类，不再"基类 860 + `!max-w-[480px]` 覆盖"。现状 `page.js:433–751` 的 11 个弹层和 `admin-page.js:804–1085` 的 12 个弹层都是覆盖式写法。
- 桌面：`max-h-[90dvh]`，四周留白 24（`p-6`）。
- 移动（`<768`）：底部抽屉 `items-end p-0`，`max-h-[100dvh]`，`rounded-t-lg rounded-b-none`，`w-full`。
- 桌面统一 `rounded-lg`（16px），移动只保留上圆角；**不要出现"上圆下直但浮在中间"**（现状前台弹层缺 `items-end`，见 §5.1）。
- Lightbox 前后台统一 **760**（现状前台 760 / 后台 740）。
- 登录卡：380 宽，`rounded-lg`，移动 `p-6` / 桌面 `p-10`；三端同一份 markup。

### 3.7 工具栏 / 表格

| 项 | 规格 |
|---|---|
| 工具栏 | `flex flex-wrap items-center gap-2 mb-4` |
| 搜索框 | 桌面 240 宽（`w-60`），移动 100% |
| 表格外壳 | `overflow-x-auto rounded-md border border-bd bg-bg-3` |
| 表头 | 高 40，`px-3 text-2xs uppercase tracking-[.1em]` |
| 单元格 | `px-3 py-2`，正文 `text-sm` |
| 行高 | 默认 36；紧凑日志 32 |
| 图片 Lightbox 图区 | `bg-bg-2` + `max-h-[55vh]` |

> 现状：前台表格外壳 `rounded-[10px]` 且**没有** `overflow-x-auto`（`page.js:413`）；后台表格外壳有滚动但内边距有 13/10、10/7 两套（`admin-page.js:460` vs `607`）。

### 3.8 层级（z-index）

| 层 | 值 |
|---|---|
| 侧栏 | 20 |
| 移动顶栏/底栏 | 20 |
| 下拉/上下文菜单 | 40 |
| Modal | 50 |
| Lightbox | 60 |
| Toast | 70 |

> 现状：前台 Modal 用 `z-[60]`、后台用 `z-50`；Lightbox `z-[100]`；Toast `z-[300]`。统一到上表。

---

## 4. Tokens

### 4.1 颜色（保持不变）

Monochrome 中性石墨 + 黑白强调；语义色只表达状态。

| 用途 | Token |
|---|---|
| 画布 | `bg` `bg-2` `bg-3` `bg-4` `bg-5` `bg-hover` `bg-active` `overlay` |
| 文本 | `tx` `tx-2` `tx-3` `tx-a` `tx-inv` |
| 边框 | `bd` `bd-2` `bd-focus` |
| 强调 | `brand` = `accent`（中性黑/白） |
| 状态 | `green` `amber` `red` `blue`（各带 `-g` 底 / `-r` 边） |

**禁止**：`text-[#ef4444]`、`bg-[rgba(52,211,153,.1)]` 这类硬编码色值；品牌强调区域出现紫色阴影（如 `rgba(124,92,255,.3)`）。

### 4.2 圆角（4px 网格）

| Token | 值 | 用途 |
|---|---|---|
| `rounded-xs` | **4px** | 徽章、标签、复选框、代码片段 |
| `rounded-sm` | **8px** | 按钮、输入框、下拉、导航项、Toast、表格外壳 |
| `rounded-md` | **12px** | 卡片、面板、图库项、下拉菜单 |
| `rounded-lg` | **16px** | Modal、Lightbox、登录卡、空状态框 |
| `rounded-xl` | **24px** | 仅移动端底部抽屉上圆角 |
| `rounded-full` | pill | 状态胶囊、头像、开关 |

规则：

- 同一类元素只有一个圆角值：所有按钮 8，所有输入框 8，所有卡片 12，所有弹层 16。
- 小尺寸 chip **不要用 12/16**：状态用 `full`，标签用 `xs`。
- 进度条/细条：4px（`rounded-xs`），不用 3px。

> 现状 `aperture.css:70–74` 仍是 4/6/8/12/16，且代码里出现 2/3/5/7/9/10px。**本次不改 CSS，迁移时按 §6.1 执行。**

### 4.3 间距（4px 硬规则）

基础单位 `--spacing: 0.25rem`（4px）。允许值：

| 档 | px | Tailwind |
|---|---|---|
| 0 | 0 | `0` |
| 1 | 4 | `1` |
| 2 | 8 | `2` |
| 3 | 12 | `3` |
| 4 | 16 | `4` |
| 5 | 20 | `5` |
| 6 | 24 | `6` |
| 7 | 28 | `7`（仅控件高度） |
| 8 | 32 | `8` |
| 10 | 40 | `10` |
| 12 | 48 | `12` |
| 16 | 64 | `16` |

- **硬规则**：除 1px 描边/分隔线外，任何 `p/m/gap/space/w/h` 必须是 4 的倍数。
- **禁止**：`px-[18px]`、`py-[9px]`、`gap-[5px]`、`py-[11px]`、`px-[13px]`、`py-[15px]`、`px-[11px]`、`p-[14px]`。
- 控件高度：28 / 32 / 36 / 40 / 44。
- **token 双轨已清除**：`@theme` 的 `--spacing` 是唯一间距来源（`p-5=20 / p-6=24`）。旧的 `--sp-1..8` 别名（`--sp-5=24 / --sp-6=32`）已从 `aperture.css` 删除，避免读错。

### 4.4 字号与行高（9 级）

| Token | 字号 | 行高 | 用途 |
|---|---|---|---|
| `text-2xs` | **11px** | 16px | 表头、徽章、标签、极小元信息（下限） |
| `text-xs` | **12px** | 16px | 辅助文字、快捷键、次要元信息 |
| `text-sm` | **13px** | 20px | 控件、表格正文、紧凑正文 |
| `text-md` | **14px** | 20px | 默认正文（新增） |
| `text-lg` | **16px** | 24px | 卡片标题、弹层标题、正文强调（新增） |
| `text-xl` | **18px** | 24px | 区块标题、移动端页面标题（新增） |
| `text-2xl` | **22px** | 28px | 桌面页面标题 |
| `text-3xl` | **24px** | 32px | 弹层内统计数字 |
| `text-4xl` | **32px** | 40px | 仪表盘统计数字 |

规则：

- **禁止** `text-[.78rem]`、`text-[.66rem]` 等 arbitrary 字号；需要新档位先加 token。
- **持久可见文字 ≥ 11px**；10px 及以下只允许用于纯装饰性角标（当前代码有 170 处 <11px，见 §5.4）。
- 正文默认 `text-md`（14px），密集表格/控件用 `text-sm`（13px）。
- 行高统一用上表，不再写 `leading-[1.15]`、`leading-[2.1]` 等一次性值。

### 4.5 阴影 / 动效 / 图标

| 类型 | 规格 |
|---|---|
| 阴影 | `shadow-xs` 仅描边感；`shadow-sm` 卡片 hover；`shadow` 弹层；`shadow-lg` 浮层 |
| 动效 | 150ms / `--ease-aperture`；Toast 300ms 回弹 |
| 图标 | 16 / 20 / 24（`h-4` / `h-5` / `h-6`）；行内 16，工具栏 20 |
| 描边 | 1px；虚线框 1.5px 改 **2px**（`border-2`） |

---

## 5. 审计结果（2026-10-21 · 修复前快照）

统计方法：扫描 `src/page.js`、`src/admin-page.js`、`src/index.js` 的 `class="..."`，按 token 统计；行号为**修复前**代码位置。当前代码已按 §6/§7 调整，问题清单保留用于追溯。

### 5.1 P0 — 页面宽度 / 布局

| # | 问题 | 位置 | 证据 | 修复 |
|---|---|---|---|---|
| W1 | **后台"页面管理"内容窄 400px** | `admin-page.js:573` | `max-w-[1200px]`，其余 8 个 section 都是 `max-w-[1600px]`（`:223/488/530/554/625/672/705/759`） | 改 1600；切 tab 不再横向跳 |
| W2 | **前台页脚与内容不对齐** | `page.js:424` | 页脚 `px-[30px]`，且在全宽容器内；`main` 是 `max-width:1600px` + 32px padding（`page.js:44`） | 页脚改为"全宽边框 + 内部 1600 容器 + 同 gutter" |
| W3 | **移动端 gutter 三套值** | `page.js:35/130`、`admin-page.js:223` | 前台 `≤768` 18px、`≤600` 16px；后台固定 18px | 统一 §3.3：16/20/24/32 |
| W4 | **移动端顶部留白不一致** | `page.js:44/130`、`page.js:207`、`admin-page.js:223` | 前台 `52+20=72`，`≤600` 为 `52+16=68`；后台固定 `pt-[72px]`；顶栏 50px | 顶栏 48；内容顶 64；桌面 32 |
| W5 | **前台弹层在移动端"上圆下直但居中"** | `page.js:433/469/499/519/624/641/662/686/729/751` | `rounded-t-xl rounded-b-none` + 外层 `items-center`，卡片高度不足时底部直角悬空 | 移动端 `items-end` + 全高抽屉；桌面 `rounded-lg` |
| W6 | **弹层宽度靠 `!max-w` 覆盖** | 前台 `page.js:433–751`；后台 `admin-page.js:804–1085` | 前台基类 `max-w-[860px]` 后逐个 `!max-w-[420/480/520/760px]`；后台基类 520 | 采用 §3.6 七档宽度，一弹层一宽度 |
| W7 | **Lightbox 宽度不一致** | `page.js:546` vs `admin-page.js:1015` | 前台 760，后台 740 | 统一 760 |
| W8 | **登录卡内边距/结构不一致** | `page.js:210`、`admin-page.js:126`、`index.js:742` | 前台/设备页 `py-9 px-7 md:py-11 md:px-10`；后台 `px-10 py-11`（移动端不收缩）；Logo 36/44 | 三端同一份：380 宽，移动 `p-6`，桌面 `p-10`，Logo 32 |
| W9 | **工具栏搜索框宽度不一** | `page.js:300/349`、`admin-page.js:495/580` | 前台 `max-w-[260px] md:w-[220px]`；后台图库 230、页面 210→`!max-w-[200px]` | 统一桌面 240，移动 100% |
| W10 | **后台表格密度两套** | `admin-page.js:460/607` | 常规表 `px-[13px] py-[10px]`；页面表 `px-[10px] py-[7px]` | 默认 `px-3 py-2`；仅日志表 `py-1.5` |
| W11 | **前台原型表无横向滚动** | `page.js:413` | `overflow-hidden rounded-[10px]`，窄屏会挤压/溢出 | `overflow-x-auto rounded-md` |
| W12 | **z-index 三套** | `page.js:432` vs `admin-page.js:803`；`page.js:546`；`page.js:760` | Modal 60 / 50，Lightbox 100，Toast 300 | §3.8 统一 |

### 5.2 P1 — 圆角

当前共 **522** 处圆角类；其中 **277 处（53%）当前渲染值不在 4px 网格**：243 处来自 `rounded-sm` 的 6px token，34 处是 arbitrary 值。

| 写法 | 次数 | 实际值 | 处理 |
|---|---:|---:|---|
| `rounded-sm` | 243 | 6px（token） | token 改 8，控件统一 8 |
| `rounded-[3px]` | 22 | 3px | → `rounded-xs` 4 |
| `rounded-[10px]` | 3 | 10px | → `rounded-md` 12（卡片/表格） |
| `rounded-[9px]` | 3 | 9px | → `rounded-sm` 8 |
| `rounded-[2px]` | 2 | 2px | → `rounded-xs` 4 |
| `rounded-[7px]` | 3 | 7px | → `rounded-sm` 8 |
| `rounded-[5px]` | 1 | 5px | → `rounded-xs` 4 |

具体元素：

| 元素 | 位置 | 现状 | 目标 |
|---|---|---|---|
| 按钮（前后台全部） | 数百处，如 `page.js:232/420` | 6px | 8 |
| 输入框 / 下拉 | `page.js:220`、`admin-page.js:132` | 8px | 8（与按钮统一） |
| 侧栏导航项 | `page.js:160`、`admin-page.js:161` | 6px | 8 |
| 图库卡片 | `page.js:1855`、`admin-page.js:515` | 12px | 12 |
| 表格外壳 | `page.js:413`、`admin-page.js:606` | 10 / 12 | 12 |
| 弹层 | `page.js:433`、`admin-page.js:804` | 16 | 16 |
| 登录 Logo | `page.js:213`(8)、`admin-page.js:128`(16)、侧栏 `page.js:152`(6) | 6/8/16 | 8 |
| 状态胶囊 | `page.js:775` `rounded-full` | full | full |
| 标签 chip | `page.js:1854`(12)、`page.js:1808`(16)、`admin-page.js:2064`(16) | 12/16 | 4（标签）或 full（状态） |
| 拖拽区 | `page.js:256/391`、`admin-page.js:936` | 16 | 12 |
| 进度条 | `admin-page.js:257`(6)、`:404`(2) | 6/2 | 4 |
| 弹层关闭按钮 | `page.js:434`、`admin-page.js:889` | 6 | 8 |

### 5.3 P1 — 间距

- 任意值间距共 **818** 处，其中 **790 处（96.6%）不在 4px 网格**。
- 高频违规：

| 写法 | 次数 | 应改为 |
|---|---:|---|
| `gap-[5px]` | 177 | `gap-1`（4）图标-文字 或 `gap-2`（8）控件组 |
| `py-[9px]` | 71 | `py-2`（8）控件 |
| `px-[18px]` | 66 | `px-4`（16）或 `px-5`（20） |
| `gap-[10px]` | 30 | `gap-2`（8）或 `gap-3`（12） |
| `px-[11px]` | 25 | `px-3`（12） |
| `py-[11px]` | 25 | `py-2`（8）或 `py-3`（12） |
| `px-[13px]` | 24 | `px-3`（12） |
| `py-[15px]` | 22 | `py-4`（16） |
| `gap-[9px]` | 21 | `gap-2`（8） |
| `mb-[5px]` | 21 | `mb-1`（4）或 `mb-2`（8） |
| `p-[14px]` | 13 | `p-3`（12）或 `p-4`（16） |
| `py-[3px]` | 24（含 `!`） | `py-1`（4） |
| `pt-[72px]` + `pb-[48px]` | 9+9 | `pt-16` / `pb-12`（配合 §3.3） |

典型位置：

- 侧栏导航：`px-[11px] py-[9px]`（`page.js:160`、`admin-page.js:161`）→ `px-3 py-2`，高 40。
- 表格单元格：`px-[13px] py-[10px]`（`admin-page.js:460`）→ `px-3 py-2`。
- 弹层头/体/脚：`px-[18px] py-[15px]` / `p-[18px]` / `py-3`（`page.js:434–437`）→ `px-5 py-4` / `p-5` / `py-3`。
- Toast：`px-[18px] py-[9px]`（`page.js:760`、`admin-page.js:1111`）→ `px-4 py-2`。
- 图库卡信息区：`px-[11px] py-[9px]`（`page.js:1857`）→ `p-3`。

### 5.4 P1 — 字体

| # | 问题 | 证据 | 修复 |
|---|---|---|---|
| T1 | **前台加载的是 Outfit，但 token 用 Inter** | `page.js:27` 加载 `Outfit`；`aperture.css:79` `--font-sans:'Inter'`；后台 `admin-page.js:41` 用 Inter | 前台改加载 Inter（或把 token 改 Outfit），三端同字体 |
| T2 | **41 种 arbitrary 字号写法、690 处** | 如 `text-[.78rem]`（12.48）、`text-[.82rem]`、`text-[.66rem]`（10.56） | 归并到 §4.4 的 9 级 |
| T3 | **170 处字号 <11px** | 前台 33 处、后台 137 处 | 最小 11；徽章/表头统一 `text-2xs` |
| T4 | **统计数字两套** | 仪表盘 `text-[2.05rem]`（32.8，`admin-page.js:229`）；弹层 `text-2xl`（24，`:967`） | 32 / 24 两个 token |
| T5 | **弹层标题大小不一** | 前台 `.98rem`（15.68，`page.js:435`）；后台 `.93rem`（14.88，`admin-page.js:889`） | 统一 `text-lg` 16 |
| T6 | **页面标题移动端 18.4/桌面 22** | `page.js:234` `.mob:text-[1.2rem]` / `1.375rem` | 18 / 22 |

### 5.5 P2 — 组件一致性 / 颜色

| # | 问题 | 位置 | 修复 |
|---|---|---|---|
| C1 | **前后台导航 active 态不同** | 前台 `page.js:160`：`bg-brand-muted` + `inset 3px` 左竖条；后台 `admin-page.js:161`：`bg-bg-active`，无竖条 | 二选一。建议按"Quiet Chrome"统一为后台样式（`bg-bg-active text-tx`，无竖条），并同步 §7 |
| C2 | **移动端导航项触控高度 44 vs 40** | `page.js:160` `max-md:min-h-[44px]`；`admin-page.js:161` `max-md:min-h-[40px]` | 统一 44 |
| C3 | **登录主按钮 token 用错，暗色下白底白字** | `page.js:224` `bg-brand text-white`；`admin-page.js:138` `bg-accent text-tx-inv` | 前台改 `bg-accent text-tx-inv`；删除紫色阴影 |
| C4 | **紫色残留阴影/渐变** | `page.js:213/224` `rgba(124,92,255,.3/.4)` | 删除；用中性阴影 |
| C5 | **页脚橙色文字** | `page.js:13` `text-[#f97316]` | 改 `text-tx` 或语义色 `amber` |
| C6 | **硬编码色 20+ 处** | `page.js:481/508/3460`、`admin-page.js:973/1437/1662/2338/3820/4047` 等 | 全部换 token |
| C7 | **前台 10 处内联 select 箭头** | `page.js:446/578/585/591/650/670/674/703/707/711` | 删 inline style，用全局 `select` 规则 |
| C8 | **图标尺寸 14/15/18/19 混用** | `h-3.5` 大量、`[&_svg]:h-[15px]`、`h-[19px]` | 16/20/24 |
| C9 | **Logo/头像 30/26/36/44** | `page.js:152` 30、`admin-page.js:150` 30、`:203` 26、登录 36/44 | 侧栏 32、头像 28、登录 32 |
| C10 | **弹层遮罩 blur 6/8 混用** | `page.js:207` blur 6；其余 blur 8 | 统一 8（登录可用 6，需写进例外） |
| C11 | **Toast 一致（唯一亮点）** | `page.js:760` = `admin-page.js:1111` | 保留，仅改间距/圆角 |

---

## 6. 迁移映射

### 6.1 圆角

**第一步：token 改值**（`src/ui/aperture.css:70–76`）

```css
--radius-xs: 4px;
--radius-sm: 8px;   /* 6 → 8 */
--radius-md: 12px;  /* 8 → 12 */
--radius-lg: 16px;  /* 12 → 16 */
--radius-xl: 24px;  /* 16 → 24，仅抽屉 */
--radius: 12px;
```

**第二步：按角色重排类名**（不要只改 token 就结束，否则卡片/弹层会整体变圆）

| 位置 | 现在 | 改为 |
|---|---|---|
| 按钮、输入框、下拉、导航项、Toast、表格外壳 | `rounded-sm` / `rounded-md` | `rounded-sm`（8） |
| 卡片、图库项、面板、下拉菜单 | `rounded-lg` / `rounded-md` | `rounded-md`（12） |
| Modal、Lightbox、登录卡 | `rounded-xl` | `rounded-lg`（16） |
| 移动抽屉顶部 | `rounded-t-xl` | `rounded-t-xl`（24） |
| 标签 chip | `rounded-lg` / `rounded-xl` | `rounded-xs`（4） |
| 状态胶囊 | `rounded-full` | `rounded-full` |
| 进度条 | `rounded-sm` / `rounded-[3px]` / `rounded-[2px]` | `rounded-xs`（4） |

**第三步：清 arbitrary**

```
rounded-[2px] / [3px] / [5px] → rounded-xs
rounded-[7px] / [9px]        → rounded-sm
rounded-[10px]               → rounded-md
```

### 6.2 间距

按最近档位归并（**优先保持视觉节奏，不跨两档**）：

| 现值 | 目标 |
|---|---|
| 2 / 3 | 4 |
| 5 / 6 / 7 | 4 或 8（图标-文字 4；控件内部 8） |
| 9 / 10 / 11 | 8 或 12（垂直 8/12；水平 12） |
| 13 / 14 / 15 | 12 或 16 |
| 18 | 16 或 20（页面 gutter 用 16/20，卡片 padding 用 16/20） |
| 22 | 24 |
| 26 | 24 或 28 |
| 30 | 32 |
| 50 | 48 |
| 52 | 48 或 56 |
| 58 | 56 或 60 |
| 60 | 64 |
| 72 | 64 或 72（72 是 4 的倍数，但按 §3.3 用 64） |

**例外白名单**（必须写注释）：1px 分隔线、`gap-px`、图表内部按数据计算的宽度、safe-area 常量。

### 6.3 字号

| 现值（rem≈px） | 目标 |
|---|---|
| `.55–.68`（8.8–10.9） | `text-2xs` 11 |
| `.7–.75`（11.2–12） | `text-xs` 12 |
| `.76–.84`（12.2–13.4） | `text-sm` 13 |
| `.85–.88`（13.6–14.1） | `text-md` 14（或 `text-sm` 13，密集表格） |
| `.9–.98`（14.4–15.7） | `text-lg` 16（或 `text-md` 14，正文） |
| `1.05–1.15`（16.8–18.4） | `text-xl` 18 |
| `1.2–1.375`（19.2–22） | `text-2xl` 22 |
| `1.6–1.65`（25.6–26.4） | `text-3xl` 24（或 `text-4xl` 32，统计数字） |
| `2.05`（32.8） | `text-4xl` 32 |

### 6.4 宽度（精确改动）

| 文件 | 行 | 现在 | 改为 |
|---|---:|---|---|
| `admin-page.js` | 573 | `max-w-[1200px]` | `max-w-[1600px]` |
| `page.js` | 424 | `px-[30px] py-[14px]` | 外层全宽 + 内层 `max-w-[1600px] px-8`；`py-4` |
| `page.js` | 35/130 | `@media` 内 18/16 | 删除，用 §3.3 工具类 |
| `page.js` | 207 | `pt-[52px] pb-[64px]` | `pt-12 pb-16` |
| `page.js` | 44 | `padding: var(--sp-6)…` | 工具类 `px-4 pt-4 pb-12 sm:px-5 md:px-6 md:pt-8 lg:px-8` |
| `admin-page.js` | 223 等 9 处 | `px-[18px] pt-[72px] pb-[48px] md:px-8 md:pt-8 md:pb-12` | 同上统一容器 |
| `page.js` | 546 | `max-w-[760px]` | 保留 760 |
| `admin-page.js` | 1015 | `max-w-[740px]` | 760 |
| `admin-page.js` | 933 | `max-w-[540px]` | 520 |
| `admin-page.js` | 1085 | `!max-w-[900px]` | 860 |
| 登录卡 | `page.js:210` / `admin-page.js:126` / `index.js:742` | 三种 padding | 统一 §3.6 |

---

## 7. 组件配方（v4）

> 以下类名在完成 §6.1 token 改值后生效；`rounded-sm`=8、`rounded-md`=12、`rounded-lg`=16。

### 7.1 按钮

```html
<!-- 基底：高 32、水平 12、gap 8、圆角 8、字号 13 -->
<button class="inline-flex h-8 items-center justify-center gap-2 rounded-sm px-3
               font-sans text-sm font-semibold leading-tight
               transition-colors duration-150">
</button>

<!-- Primary -->
<button class="…基底… border border-transparent bg-accent text-tx-inv
               hover:bg-accent-hover
               disabled:bg-bg-5 disabled:text-tx-3 disabled:cursor-not-allowed">
<!-- Ghost -->
<button class="…基底… border border-bd bg-bg-4 text-tx-2
               hover:border-bd-2 hover:bg-bg-hover hover:text-tx">
<!-- Danger -->
<button class="…基底… border border-red-r bg-red-g text-red hover:bg-red-r">
<!-- 小尺寸 -->
<button class="…基底… h-7 px-2.5 text-xs">
<!-- 大尺寸/全宽 -->
<button class="…基底… h-9 px-4 text-sm">
```

### 7.2 表单

```html
<div class="flex flex-col gap-2 mb-4">
  <label class="text-2xs font-bold uppercase tracking-[.1em] text-tx-3">标签</label>
  <input class="h-9 w-full rounded-sm border border-bd bg-bg-2 px-3
                font-sans text-sm text-tx outline-none
                transition-colors duration-150
                focus:border-bd-focus focus:bg-bg
                focus:shadow-[0_0_0_3px_var(--color-brand-ring)]">
  <textarea class="min-h-32 w-full rounded-sm border border-bd bg-bg-2 p-3
                   font-mono text-sm text-tx"></textarea>
</div>
```

- select 的 chevron 只保留 `aperture.css` 的全局规则，**不再写内联 style**。
- 复选框 16×16（`h-4 w-4`），不用 15/18。

### 7.3 卡片 / 图库项

```html
<div class="overflow-hidden rounded-md border border-bd bg-bg-3
            transition duration-150
            hover:-translate-y-0.5 hover:border-bd-2 hover:shadow-sm">
  <img class="block aspect-square w-full bg-bg-2 object-cover">
  <div class="p-3">
    <div class="truncate font-mono text-sm text-tx-2">key</div>
    <div class="mt-2 flex items-center justify-between">
      <span class="rounded-full border border-green-r bg-green-g px-2 py-0.5 text-2xs font-semibold text-green">公开</span>
      <span class="text-2xs text-tx-3">1.2 MB</span>
    </div>
  </div>
</div>
```

### 7.4 导航项

```html
<button class="flex h-10 w-full items-center gap-2 rounded-sm px-3
               text-left text-sm font-semibold text-tx-2
               transition-colors duration-150
               hover:bg-bg-hover hover:text-tx
               [&.active]:bg-bg-active [&.active]:text-tx">
  <span class="flex h-4 w-4 items-center justify-center [&_svg]:h-4 [&_svg]:w-4"><svg…></span>
  <span>公开图库</span>
</button>
```

- active 态：仅背景 + 文字变化，**无左竖条**（如需方向感，前后台一起加，并写进本文件）。
- 移动端最小高度 44（`max-md:min-h-11`）。

### 7.5 Modal

```html
<div class="fixed inset-0 z-50 flex items-end justify-center bg-overlay p-0
            backdrop-blur-[8px] md:items-center md:p-6 [&.show]:flex" id="…">
  <div class="flex max-h-[100dvh] w-full max-w-[520px] flex-col overflow-hidden
              rounded-t-lg rounded-b-none border border-bd-2 bg-bg-4 shadow
              md:max-h-[90dvh] md:rounded-lg">
    <header class="flex shrink-0 items-center border-b border-bd px-5 py-4">
      <h3 class="flex-1 text-lg font-semibold text-tx">标题</h3>
      <button class="flex h-8 w-8 items-center justify-center rounded-sm border border-bd
                     bg-bg-5 text-tx-2 transition hover:border-bd-focus hover:text-tx">×</button>
    </header>
    <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">…</div>
    <footer class="flex shrink-0 justify-end gap-2 border-t border-bd px-5 py-3">…</footer>
  </div>
</div>
```

宽度只改 `max-w-[…]` 一处，取值见 §3.6。

### 7.6 Lightbox

```html
<div class="fixed inset-0 z-60 hidden items-center justify-center bg-overlay p-6 [&.show]:flex">
  <div class="w-full max-w-[760px] overflow-hidden rounded-lg border border-bd-2 bg-bg-4 shadow">
    <div class="flex min-h-[280px] max-h-[55vh] items-center justify-center bg-bg-2">
      <img class="max-h-[55vh] max-w-full object-contain">
    </div>
    <div class="p-4"><div class="break-all font-mono text-sm text-tx">key</div></div>
  </div>
</div>
```

### 7.7 Toast

```html
<div class="fixed bottom-20 md:bottom-6 left-1/2 z-70 -translate-x-1/2 translate-y-20
            w-max max-w-[calc(100vw-32px)] whitespace-normal break-words text-center
            rounded-sm border border-bd-2 bg-bg-3
            px-4 py-2 font-sans text-sm font-medium text-tx shadow-sm
            transition-transform duration-300
            ease-[cubic-bezier(.34,1.56,.64,1)] [&.show]:translate-y-0">
</div>
```

- **宽度自适应**：`w-max` 跟随内容，`max-w-[calc(100vw-32px)]` 封顶；长文案自动换行，不横向溢出。
- **避开移动底栏**：`bottom-20`（80px），桌面 `md:bottom-6`。
- **状态只改边框/文字色**：不要用半透明 `*-g` 背景，否则背后内容会透出来；Toast 底色始终 `bg-bg-3`。

### 7.8 空状态

```html
<div class="p-12 text-center text-sm font-medium text-tx-3">还没有图片</div>
```

插画 96px（`h-24`），不再用 92。

---

## 8. 执行与验收

### 8.1 分阶段（每阶段独立可回滚 + 真实渲染）

| 阶段 | 内容 | 文件 | 验证 |
|---|---|---|---|
| **P0 ✅** | 布局契约：1600 内容宽、gutter、页脚对齐、移动顶栏 48、弹层移动端抽屉 | `page.js`、`admin-page.js` | 375/768/1440/1920 真实截图 |
| **P1 ✅** | 圆角 token + 按角色重排 + 清 arbitrary | `aperture.css`、三个页面文件 | 0 处 arbitrary 圆角 |
| **P2 ✅** | 间距归并：控件、表格、弹层、侧栏 | 同上 | 0 处 arbitrary 间距 / 0 处半档间距 |
| **P3 ✅** | 9 级字阶；前台字体改 Inter | 同上 | 0 处 arbitrary 字号 / 0 处 <11px |
| **P4 ✅** | 一致性：nav active、登录按钮、chip、硬编码色、select、z-index；控件高度 36/导航 40/关闭 32/底栏 64；去掉装饰性 hover；Toast 自适应宽度与避让底栏；后台原型补文件夹上传 | 同上 | 前后台并排 + 深浅色截图 |

**不要一次性全局替换**：`rounded-lg`、`px-[18px]` 在不同组件里语义不同（控件 vs 卡片 vs 页面 gutter），必须按组件替换。

### 8.2 自动检查（提交前）

```bash
# 1) 语法 + 真实渲染（两类模板字符串坑）
node --check src/page.js
node --check src/admin-page.js
npx vitest run test/features/render-smoke.test.js

# 2) 全量测试
npx vitest run

# 3) 网格守卫：应输出 0（4 的倍数均合法；1px 描边除外）
grep -oE '(gap|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr)-\[[0-9.]+px\]' src/page.js src/admin-page.js \
  | grep -vE '\[(1|4|8|12|16|20|24|28|32|36|40|44|48|52|56|60|64|68|72)px\]' | sort | uniq -c

# 4) 圆角守卫
grep -oE 'rounded-\[[0-9.]+px\]' src/page.js src/admin-page.js | sort | uniq -c

# 5) 字号守卫
grep -oE 'text-\[[0-9.]+rem\]' src/page.js src/admin-page.js | sort | uniq -c
```

### 8.3 视觉验收清单

- [x] 375px：前后台内容左右边距一致（16）；顶栏 48；无横向滚动。
- [x] 768px：侧栏出现，内容 gutter 24；页头与内容左边界对齐。
- [x] 1440/1920px：切遍后台所有 tab，内容左边界不跳（页面管理不再窄 400）。
- [x] 前台页脚与 `main` 左右边界对齐。
- [x] 所有按钮/输入框圆角一致（8）；卡片 12；弹层 16。
- [x] 任意两个相邻区块的间距是 4 的倍数。
- [x] 无 <11px 的持久文字。
- [x] 暗色模式下登录按钮、主按钮文字对比度正常（≥ 4.5:1）。
- [x] 移动端弹层从底部升起，上圆下直，不悬空。
- [x] 键盘 Tab 焦点可见（ring）。

### 8.4 完成判定

1. §8.2 的守卫命令输出为空（或只剩白名单）。
2. 前后台同一组件在同一断点下像素级一致（截图对比）。
3. `render-smoke` + 全量测试通过。
4. 真实页面走查完 §8.3，**不以"编译通过"代替视觉验收**。

---

## 9. 非目标与待确认

**非目标**

- 不改信息架构、不改 API、不拆巨型文件。
- 不引入新依赖、不做亮色重设计（浅色主题已有，保持一致即可）。
- 不为了"更精致"新增渐变、彩色阴影、玻璃拟态。

**已确认的 3 个决策（2026-10-21）**

1. **导航 active 态**：采用后台的"纯底色"（`bg-bg-active text-tx`，无左竖条），前后台同步。
2. **标签 chip 形状**：标签用 4px 方角（`rounded-xs`），状态用 pill（`rounded-full`）。
3. **内容最大宽**：全站 **1600px**，不设单页例外。

> 按 §8.1 执行，P0 → P4。

---

## 10. 实施记录（2026-10-21）

### 10.1 已落地

| 阶段 | 实际改动 |
|---|---|
| **P0 布局** | 后台 9 个 section 统一 `max-w-[1600px]` + `px-4/5/6/8`（页面管理去掉 1200）；前台 `main` 改用同一容器；移动顶栏 50→48、内容顶 64；页脚收进 1600 容器；Lightbox 统一 760；登录卡三端统一 380 / `p-6 md:p-10`；前后台弹层改移动端底部抽屉、桌面居中；弹层宽度去掉 `!max-w` 覆盖，固定七档 |
| **P1 圆角** | `--radius-sm/md/lg/xl` 改为 8/12/16/24；按角色重排：控件 `sm`、卡片 `md`、弹层/登录/Lightbox `lg`、移动抽屉 `t-xl`；删除全部 `rounded-[Npx]` |
| **P2 间距** | 818 处 arbitrary 间距全部归并；404 处半档类（`py-1.5`、`mb-3.5`、`gap-1.5`…）归并；`--sp-1..8` 别名桥删除；图标/控件尺寸（14/15/18/19px 等）归并到 4px 档 |
| **P3 字阶** | 新增 `text-md/lg/xl/2xl/3xl/4xl`（14/16/18/22/24/32），行高 20/24/24/28/32/40；690 处 arbitrary 字号全部替换；170 处 <11px 清零；前台字体 Outfit→Inter |
| **P4 一致性** | 前后台导航 active 统一为 `bg-bg-active`（无左竖条）；移动导航触控高 44；标签 chip `rounded-xs`、状态 `rounded-full`；登录主按钮改 `bg-accent text-tx-inv`（修暗色白底白字）；删除紫色阴影、页脚橙色与 20+ 处硬编码色；10 处内联 select 样式删除；z-index 统一 20/40/50/60/70 |

### 10.2 验证

- `npx vitest run`：**26 个文件 / 319 项全部通过**。
- `test/features/render-smoke.test.js`：16 项通过（含浏览器端脚本语法解析）。
- 无头 Chrome 真实渲染截图：`/`、`/admin` 在 **375 / 1440 / 1920** 三档，深色 + 浅色；检查了登录卡、移动抽屉、图库卡片、页面表格、上传面板。
- 网格守卫：arbitrary 间距 0、arbitrary 圆角 0、arbitrary 字号 0、`<11px` 0。
- 横向溢出：三档均 `scrollWidth == innerWidth`。

### 10.3 保留的例外（有意）

- **Logo / 头像渐变**：`from-[#242836] to-[#14161d]` 等固定深色渐变，作为品牌标记在深浅色下都成立。
- **图表调色板**：已从彩色收敛为中性灰 + 语义色（`admin-page.js` 的 `PALETTE`），仍保留多色以区分数据系列。
- **设备授权兜底页**：`src/index.js` 里两段纯 HTML 错误/成功页仍用内联色值，不在主界面设计系统内。

### 10.4 后续建议

- 把 §8.2 的守卫命令接进 CI（当前是手工执行）。
- 对图片/原型密集列表再做一次 375px 真机走查（本轮以空数据 + 单条数据为主）。
- 若要彻底去除固定渐变，可把 Logo 标记改为 token 生成的单色块。

---

## 11. v3 → v4 逐项对照（实测）

> 本节回答"具体改了什么、为什么改、怎么验收"。所有数字来自 2026-10-21 的真实代码与无头 Chrome 渲染，不是估算。

### 11.1 布局：从"各写各的"到一份契约

| 项目 | v3 修复前 | v4 修复后 | 关键位置 |
|---|---|---|---|
| 后台内容宽 | 页面管理 `1200`，其余 8 个 section `1600` | **全部 1600** | `admin-page.js` 9 个 `.section` |
| 前台内容宽 | `main { max-width:1600px; padding:32px }` 写在 `<style>` | 与后台同一套工具类容器 | `page.js` `<main>` |
| 移动 gutter | 前台 18 / 16，后台 18 | **16 / 20 / 24 / 32**（按断点） | §3.3 |
| 移动顶部留白 | 前台 68/72，后台 72 | **64**（顶栏 48 + 16） | 顶栏 `h-12` |
| 页脚 | 全宽 + `px-[30px]`，与 `main` 不对齐 | 全宽边框 + 内部 1600 容器 + 同 gutter | `page.js` `<footer>` |
| 移动弹层 | 居中 + 上圆下直；宽度靠 `!max-w` 覆盖 | **底部抽屉**；桌面居中；七档固定宽度 | 前后台 22 个弹层 |
| Lightbox | 前台 760 / 后台 740 | **统一 760** | `page.js` / `admin-page.js` |
| 登录卡 | 前台 `p-7/p-9`，后台 `p-10/p-11` | **380 宽，移动 24 / 桌面 40** | 三端登录 |
| 表格外壳 | 前台无横向滚动；圆角 10 | `overflow-x-auto` + 圆角 12 | 原型表 |
| z-index | Modal 50/60、Lightbox 100、Toast 300 | **20 / 40 / 50 / 60 / 70** | §3.8 |

**实测坐标（无头 Chrome）：**

| 视口 | 页面 | 内容区 x / 宽 | 内边距 | 横向溢出 |
|---|---|---|---|---|
| 375 | 前台 `main` | 0 / 375 | 16 | 无 |
| 375 | 后台 `.section` | 0 / 375 | 16 | 无 |
| 1440 | 前台 `main` | 240 / 1200 | 32 | 无 |
| 1440 | 后台 `.section` | 240 / 1200 | 32 | 无 |
| 1920 | 前台 `main` | 280 / **1600** | 32 | 无 |
| 1920 | 后台 `.section` | 280 / **1600** | 32 | 无 |

> 1920 下内容区可用宽度 = 1920 − 240 = 1680；1600 居中后左边距 = (1680 − 1600) / 2 = 40，加上侧栏 240，内容起点 = 280。前后台完全一致。

**弹层实测：**

| 视口 | 组件 | 结果 |
|---|---|---|
| 375 | 新建项目弹层 | 宽 375、内容高 220、贴底、上圆角、下直角 |
| 1440 | 新建项目弹层 | 宽 520、垂直居中、四周 24 留白、圆角 16 |
| 375 | 页面编辑器 | 全屏 375×100dvh，无圆角/边框 |
| 1440 | 页面编辑器 | 960×min(92dvh, 900px)，圆角 16 |

### 11.2 圆角：所有元素四档归位

| 元素 | v3 | v4 | 说明 |
|---|---|---|---|
| 按钮 / 输入框 / 下拉 / 导航项 | 按钮 6、输入 8 | **8** | 控件统一 |
| 卡片 / 图库项 / 表格外壳 | 12 / 10 | **12** | 容器统一 |
| Modal / Lightbox / 登录卡 | 16 | **16** | 浮层统一 |
| 移动底部抽屉 | 上圆 16 | **上圆 24** | 只保留上圆角 |
| 标签 chip | 12 / 16 | **4** | 信息密度 |
| 状态胶囊 | full | **full** | 公开/私密 |
| 进度条 | 2 / 3 / 6 | **4** | 细条统一 |
| 登录 Logo | 6 / 8 / 16 | **8** | 与控件一致 |

**数量变化：**

- arbitrary 圆角：**34 → 0**
- `rounded-sm` 的 6px token：**243 → 0**
- 全站圆角类：522 处，全部落在 4/8/12/16/24/full

### 11.3 间距：从"看起来差不多"到 4px 网格

| 类型 | v3 | v4 |
|---|---:|---:|
| arbitrary 间距（`px-[18px]` 等） | **818 处** | **0** |
| 其中不在 4px 网格 | **790 处（96.6%）** | **0** |
| 半档类（`py-1.5` / `mb-3.5` / `gap-1.5`） | **404 处** | **0** |
| 图标/控件非 4px 尺寸（14/15/18/19px） | 多处 | **0** |

**典型映射（已执行）：**

| 旧 | 新 | 场景 |
|---|---|---|
| `px-[18px] py-[15px]` | `px-5 py-4` | 弹层头 |
| `p-[18px]` | `p-5` | 弹层体 |
| `px-[13px] py-[10px]` | `px-3 py-2` | 表格单元格 |
| `px-[11px] py-[9px]` | `px-3 py-2` | 侧栏导航 |
| `gap-[5px]` | `gap-1` | 图标-文字 |
| `gap-[10px]` | `gap-2` | 控件组 |
| `mb-3.5` | `mb-4` | 表单字段 |
| `py-1.5` | `py-2` | 按钮/表格行 |
| `h-[15px] w-[15px]` | `h-4 w-4` | 行内图标 |
| `h-[30px] w-[30px]` | `h-8 w-8` | 侧栏 Logo |

### 11.4 字体：9 级字阶 + 前后台同字体

| 项目 | v3 | v4 |
|---|---|---|
| 字体 | 前台加载 Outfit，token 用 Inter | **三端 Inter** |
| arbitrary 字号 | **41 种 / 690 处** | **0** |
| <11px 文字 | **170 处**（9.1–10.9px） | **0** |
| 字号档位 | 41+ 种 | **9 级**：11/12/13/14/16/18/22/24/32 |
| 行高 | 大量 `leading-[1.15]` 一次性值 | 固定 16/16/20/20/24/24/28/32/40 |
| 统计数字 | 仪表盘 32.8px / 弹层 24px | **32 / 24 两个 token** |
| 弹层标题 | 15.68 / 14.88 | **16** |
| 页面标题 | 移动 18.4 / 桌面 22 | **18 / 22** |

### 11.5 组件一致性

| 项目 | v3 | v4 |
|---|---|---|
| 导航 active | 前台：底色 + 3px 左竖条；后台：纯底色 | **前后台纯底色** `bg-bg-active`，无竖条 |
| 移动导航触控高 | 前台 44 / 后台 40 | **44** |
| 登录主按钮（暗色） | `bg-brand` + `text-white`，**对比度 1.12:1** | `bg-accent` + `text-tx-inv`，**对比度 17.1:1** |
| 紫色残留 | 登录 Logo/按钮阴影 `rgba(124,92,255,…)` | 删除 |
| 页脚强调 | 橙色 `#f97316` | 中性 `text-tx` |
| 硬编码色 class | 20+ 处 | **0** |
| 内联 select 箭头 | 前台 10 处（且属性引号写坏） | **0**，统一全局 `select` |
| 图标尺寸 | 14/15/18/19 混用 | **16 / 20 / 24** |
| Logo/头像 | 30/26/36/44 | **32 / 28 / 32** |
| Lightbox / Toast / Modal 层级 | 100 / 300 / 50–60 | **60 / 70 / 50** |
| 控件高度 | 登录/上传按钮 44、登录输入 44、导航 36、关闭 28、表头 32、表格操作 24 | **按钮 36、输入 36、导航 40、关闭 32、表头 40、表格操作 28** |
| 移动底栏 | 内容撑高（约 56） | **min-height 64** |
| 装饰性 hover | 主按钮位移 + 白色阴影；卡片位移 | **只保留颜色/边框/阴影** |
| Focus ring | muted / ring 两套 | **统一 `--color-brand-ring`** |
| Toast 宽度 | `whitespace-nowrap`，长文案可超出屏幕；在移动端被底栏遮挡 | **最宽 `100vw-32` + 自动换行；`bottom-20` 避开底栏；状态不透明** |
| 后台原型上传 | 有文件夹按钮但缺 change 监听，实际只能选 ZIP | **补文件夹选择 + 文件夹拖拽，与前台一致** |

### 11.6 验收命令与结果

```bash
# 语法 + 浏览器端脚本
node --check src/page.js
node --check src/admin-page.js
npx vitest run test/features/render-smoke.test.js   # 16 passed

# 全量
npx vitest run                                      # 26 files / 319 tests passed

# 网格守卫
grep -oE '(gap|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr)-\[[0-9.]+px\]' \
  src/page.js src/admin-page.js | wc -l              # 0
grep -oE 'rounded-\[[0-9.]+px\]' src/page.js src/admin-page.js | wc -l   # 0
grep -oE 'text-\[[0-9.]+(rem|px)\]' src/page.js src/admin-page.js | wc -l # 0
```

**视觉走查：** `/` 与 `/admin` 在 375 / 1440 / 1920 三档，深色 + 浅色；检查了登录卡、移动抽屉、图库卡片、页面表格、上传面板；三档均 `scrollWidth == innerWidth`。

### 11.7 为什么这些数字重要

- **140px**：页面管理从 1200 改到 1600 后，1920 下内容左边界与其它 tab 完全一致，不再"切 tab 跳一下"。
- **96.6%**：修复前 790/818 个间距值不在 4px 网格，靠肉眼永远对不齐；现在规则可被 grep 验证。
- **1.12:1**：这是暗色下"白底白字"的实际对比度，远低于 WCAG 4.5:1，用户看不到按钮文字不是错觉。
- **170 处 <11px**：这是"字小得看不清"的量化来源；现在最小持久文字 11px。

---

## 12. 预览页说明

`docs/design-system-preview.html` 已重写为 **v4 可视化预览**，与本文 token 同步。它是零依赖单文件，双击即可打开，不需要起服务。

### 12.1 页面结构

| 区块 | 内容 |
|---|---|
| 总览 | 四个关键数字（0 arbitrary / 1600 / 9 级 / 319 测试） |
| 01 布局契约 | 应用外壳示意、断点与 gutter 表、统一容器写法、1200→1600 对照 |
| 02 Tokens | 颜色色板、圆角 4/8/12/16/24、间距阶梯、9 级字阶、阴影/图标/层级 |
| 03 修复对照 | 圆角 v3/v4、间距写法 v3/v4、登录按钮 1.12:1 vs 17.1:1、导航 active、移动弹层、字体 |
| 04 组件 | 按钮、表单、图库卡、标签、导航、统计卡、表格、Modal/抽屉/Lightbox/Toast、空状态、登录卡 |
| 05 真实页面 | 前台/后台桌面 1440 深色、移动端 375 浅色、移动抽屉、登录卡真实截图 |
| 06 审查清单 | 12 项问题 → 修复 → 已修状态 |
| 07 验收 | 测试、网格守卫、真实渲染、视觉走查清单 |

### 12.2 交互

- 左下角 **系统 / 暗色 / 浅色** 三档切换；系统档跟随 `prefers-color-scheme`。
- 左侧目录随滚动高亮当前区块。
- 所有组件都是真实 DOM + CSS 变量，不是截图；切换主题会同步变化。

### 12.3 预览与真实页面的边界

- 预览页的内容宽度是 **1200**（便于阅读文档），真实应用是 **1600**；布局规则一致。
- 预览里的图片位是占位图；真实图库卡片的结构、圆角、间距与预览一致。
- 预览不加载外部字体/JS/CSS；字体使用 `Inter`，系统没有时回退到系统无衬线。
- 预览里的 "v3 登录按钮" 是**故意复现旧 bug**（白底白字），只用于对照，不是可用组件。

### 12.4 真实页面快照

预览页的 "05 真实页面" 区块使用 `docs/assets/v4/` 下的六张截图，全部由当前代码在无头 Chrome 中渲染：

| 文件 | 内容 | 视口 / 主题 |
|---|---|---|
| `front-desktop-dark.png` | 前台公开图库 | 1440 / 深色 |
| `admin-desktop-dark.png` | 后台概览 | 1440 / 深色 |
| `front-mobile-light.png` | 前台我的图库 | 375 / 浅色 |
| `admin-mobile-light.png` | 后台概览 | 375 / 浅色 |
| `admin-modal-mobile.png` | 后台移动底部抽屉 | 375 / 浅色 |
| `front-login-dark.png` | 前台登录卡 | 380 宽 / 深色 |

快照使用本地测试数据（admin、一张测试图、一个测试页面），不包含真实用户内容；它们是 2026-10-21 的验收快照，后续 UI 改动后应重新生成。
