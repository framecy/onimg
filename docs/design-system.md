# Onimg Design System — Aperture v2（纯 Tailwind 工具类）

> 分支：`redesign-vision` · 方案：**纯 Tailwind v4 工具类路线**
> 一句话规范：**HTML 里用 Tailwind 工具类写样式，aperture.css 只留 `@theme`，不再有 `.btn`/`.gitem` 这类手写组件类。**

---

## 0. 这份文档改了什么（推翻 v1 的根因）

v1 文档把"把 token 从 `:root` 搬到 `@theme`"当成"做了 Tailwind 设计"，结果组件实现仍是手写 CSS，源码里工具类使用为 **0**，打开页面看不到变化。v2 推翻这个口径：

- **组件实现方式**：HTML 上直接用 Tailwind 工具类拼接，`class="bg-bg-4 text-tx-2 border border-bd rounded-sm ..."`。
- **aperture.css 只留两类内容**：① `@theme` token；② 极少数工具类无法表达的（如 select 下拉箭头的 `data:image/svg+xml`、keyframes 动画、`::before` content）。**没有 `@layer components { .xxx { @apply ... } }`**。
- **完成判定（硬规则）**：一个组件算"Tailwind 化"= ① 它的 HTML 用了工具类；② 它对应的手写 CSS 块已删除；③ 页面在 `wrangler dev` 真实渲染、视觉正确。三者缺一不算完成。

---

## 1. 产品与页面地图

| 页面 | 文件 | 内容 |
|---|---|---|
| 用户前台 `/` | `src/page.js`（~3750 行内联 HTML） | 上传/我的图库/公开图库/页面树/原型表/回收站 + Lightbox + 13 个 Modal + Toast |
| 管理后台 `/admin` | `src/admin-page.js`（~3120 行内联 HTML） | 仪表盘/图片/用户/页面/设置/原型/成员统计 + 8 Modal + Lightbox + Toast |
| 设备授权 `/auth/device` | `src/index.js::serveDeviceAuthPage` | 独立迷你登录卡 |

架构不变：Worker 返回巨型内联 HTML 字符串；`apertureCss` 由 `build:css` 生成、三端 `import` 后 `<style>` 注入。**只换组件实现方式，不动 API 与信息架构。**

---

## 2. 设计原则（Aperture）

1. **Image First**：画布比侧栏更深，卡片略抬起，图片边缘干净。
2. **Quiet Chrome**：少装饰、少渐变；精致来自对齐、对比、节奏。
3. **One Accent**：唯一品牌色 `brand #8b9cff` 贯穿主按钮、焦点、激活；语义色只表达状态。
4. **Readable Micro**：持久可见文字 ≥ 11px。
5. **Restrained Motion**：150ms，`cubic-bezier(.2,.8,.2,1)`；不弹跳（toast 例外用轻微回弹）。
6. **纯工具类**：组件用工具类，不抽 `@apply` 组件类。

---

## 3. Token → Tailwind 工具类映射

`@theme` 声明的 token 自动生成工具类。下表是**实际可用**的工具类名（已在产物中验证生成）。

### 3.1 颜色（`--color-*` → `bg-` / `text-` / `border-`）

| 用途 | 工具类（bg-/text-/border- 三族通用） |
|---|---|
| 画布层 | `bg-bg` `bg-bg-2` `bg-bg-3` `bg-bg-4` `bg-bg-5` `bg-bg-hover` `bg-bg-active` `bg-overlay` |
| 文本层 | `text-tx` `text-tx-2` `text-tx-3` `text-tx-a` `text-tx-inv` |
| 边框层 | `border-bd` `border-bd-2` `border-bd-focus` |
| 品牌 | `bg-brand` `bg-brand-hover` `bg-brand-muted` `border-brand` `text-brand` |
| 主按钮 | `bg-accent` `bg-accent-hover` `bg-accent-muted`（配 `text-tx-inv`） |
| 语义 | `bg-green` `bg-green-g` `bg-green-r` `text-green` `border-green-r` |
| | `bg-amber` `bg-amber-g` `bg-amber-r` `text-amber` `border-amber-r` |
| | `bg-red` `bg-red-g` `bg-red-r` `text-red` `border-red-r` |

### 3.2 圆角 / 字体 / 字号 / 行高 / 阴影 / 间距

| 类型 | 工具类 |
|---|---|
| 圆角 | `rounded-xs` 4 · `rounded-sm` 6 · `rounded-md` 8 · `rounded-lg` 12 · `rounded-xl` 16 · `rounded-full` |
| 字体 | `font-sans`（Outfit） · `font-mono`（JetBrains Mono） |
| 字号 | `text-2xs` 11px · `text-xs` 12 · `text-sm` 13 · `text-base-sm` 15 · `text-lg-sm` 17 · `text-xl-sm` 22 |
| 字重 | `font-medium` 500 · `font-semibold` 600 · `font-bold` 700 |
| 行高 | `leading-tight` 1.25 · `leading-normal` 1.5 · `leading-loose` 1.65 |
| 阴影 | `shadow-sm` · `shadow` · `shadow-lg` |
| 间距 | v4 派生：`p-1`=4px `p-2`=8 `p-3`=12 `p-4`=16 `p-5`=20 `p-6`=24 `p-8`=32 `p-12`=48 |
| 任意值 | `px-[5px]` `gap-[5px]` `min-h-[36px]` 等（用方括号写非阶梯值） |

### 3.3 变体 / 响应

- 状态：`hover:bg-accent-hover` `disabled:bg-bg-5 disabled:text-tx-3 disabled:cursor-not-allowed`
- 断点：默认 `md:`=768；自定义 `xs:`=480、`mob:`=600（`max-[600px]:` 任意值也可）
- 过渡：`transition-colors duration-150 ease-[var(--ease-aperture)]`

---

## 4. 组件配方（纯工具类字面量）

**每条都是 HTML 里直接写的 `class="..."`。删掉对应手写 CSS 后即为完成。**

### 4.1 按钮

```html
<!-- 基底（所有按钮共用，含容器、对齐、字号、过渡） -->
<button class="inline-flex items-center justify-center gap-[5px] px-3 py-1.5
               rounded-sm text-sm font-semibold min-h-8 cursor-pointer font-sans
               transition-colors duration-150 ease-[var(--ease-aperture)]">
  <!-- 变体（叠加在基底上，只写"这个变体独有的"） -->
</button>

<!-- Primary：浅紫蓝实心 -->
<button class="…基底… bg-accent text-tx-inv border border-transparent
               hover:bg-accent-hover hover:shadow-[0_4px_16px_rgba(255,255,255,0.08)]
               disabled:bg-bg-5 disabled:text-tx-3 disabled:cursor-not-allowed disabled:shadow-none">

<!-- Ghost：bg-4 + 细边 -->
<button class="…基底… bg-bg-4 text-tx-2 border border-bd
               hover:bg-bg-hover hover:text-tx hover:border-bd-2">

<!-- Danger：浅红底 + 红字 -->
<button class="…基底… bg-red-g text-red border border-red-r hover:bg-red-r">

<!-- Warn：浅琥珀底 -->
<button class="…基底… bg-amber-g text-amber border border-amber-r hover:bg-amber-r">

<!-- 小尺寸（叠加） -->
<button class="…基底… px-2.5 text-xs min-h-7">

<!-- Public / Private 胶囊标签 -->
<span class="inline-flex items-center text-xs px-2 py-1 rounded-full font-semibold border bg-green-g text-green border-green-r">
<span class="inline-flex items-center text-xs px-2 py-1 rounded-full font-semibold border bg-brand-muted text-tx-3 border-bd">
```

### 4.2 全宽主按钮（登录/区块按钮）

```html
<button class="w-full py-2.5 rounded-md bg-accent text-tx-inv font-bold mt-1.5
               cursor-pointer font-sans transition-colors duration-150
               hover:bg-accent-hover hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(255,255,255,0.07)]
               disabled:bg-bg-5 disabled:text-tx-3 disabled:cursor-not-allowed">
```

### 4.3 表单字段

```html
<div class="flex flex-col gap-1.5 mb-3.5">
  <label class="text-2xs text-tx-3 font-bold uppercase tracking-[0.1em]">标签</label>
  <input class="px-3 py-2 rounded-md bg-bg-2 border border-bd text-tx text-sm font-sans
                outline-none transition-colors duration-150
                focus:border-bd-focus focus:bg-bg focus:shadow-[0_0_0_3px_var(--color-brand-ring)]">
  <textarea class="…input 同上… resize-y min-h-[120px] font-mono"></textarea>
</div>
```

> **select 下拉箭头**（`appearance:none` + svg url）工具类表达不了，留在 `aperture.css` 一个原生 `.field-sel` 兜底类。这是唯一允许的例外。

### 4.4 卡片 / 图库项

```html
<div class="relative rounded-lg bg-bg-3 border border-bd overflow-hidden cursor-pointer
             transition-all duration-150
             hover:border-bd-2 hover:shadow-[0_8px_28px_rgba(0,0,0,0.5)]">
  <div class="bg-bg-2 flex items-center justify-center min-h-[280px] max-h-[55vh]">
    <img class="max-w-full max-h-[55vh] object-contain">
  </div>
  <div class="p-2.5">
    <div class="text-tx-2 text-xs break-all font-mono">key</div>
  </div>
</div>

<!-- 选中态（叠加） -->
<div class="…卡片… shadow-[0_0_0_1px_var(--color-tx-2)]">
```

### 4.5 侧栏导航项

```html
<button class="flex items-center gap-2.5 px-3 py-2.5 rounded-sm w-full text-left
               text-sm font-semibold text-tx-2 cursor-pointer relative
               transition-colors duration-150
               hover:bg-bg-hover hover:text-tx
               [box-shadow:inset_3px_0_0_var(--color-brand)] bg-brand-muted text-tx">
  <!-- ↑ active 态叠加左侧 3px brand 条 + 浅 brand 底 -->
</button>
```

### 4.6 弹层 Modal

```html
<div class="fixed inset-0 bg-overlay backdrop-blur-[8px] z-50 hidden
             items-center justify-center p-6">
  <div class="w-full max-w-[860px] max-h-[96vh] flex flex-col overflow-hidden
               rounded-xl bg-bg-4 border border-bd-2 shadow">
    <header class="flex items-center px-4.5 py-4 border-b border-bd shrink-0">
      <h3 class="flex-1 text-base-sm font-bold text-tx tracking-[-0.01em]">标题</h3>
      <button class="w-7 h-7 rounded-sm bg-bg-5 border border-bd text-tx-2 text-sm
                     flex items-center justify-center cursor-pointer font-sans
                     transition-colors hover:text-tx hover:border-bd-focus">×</button>
    </header>
    <div class="px-5 py-4 overflow-y-auto flex-1 flex flex-col gap-3 min-h-0">
      <!-- 内容；Vditor 容器可叠加 overflow-hidden -->
    </div>
    <footer class="px-4.5 py-3 border-t border-bd flex gap-2 justify-end shrink-0">
      <button class="…按钮…"></button>
    </footer>
  </div>
</div>
```

### 4.7 Lightbox

```html
<div class="fixed inset-0 bg-overlay z-[100] hidden items-center justify-center p-6">
  <div class="w-full max-w-[760px] rounded-xl bg-bg-4 border border-bd-2 overflow-hidden shadow">
    <div class="bg-bg-2 flex items-center justify-center min-h-[280px] max-h-[55vh]">
      <img class="max-w-full max-h-[55vh] object-contain">
    </div>
    <div class="p-4.5">
      <div class="text-sm text-tx break-all font-mono">key</div>
    </div>
  </div>
  <button class="absolute top-3.5 right-3.5 w-8 h-8 rounded-sm bg-bg-5 border border-bd
                 text-tx-2 text-sm flex items-center justify-center cursor-pointer">×</button>
</div>
```

### 4.8 Toast

```html
<div class="fixed bottom-6 left-1/2 -translate-x-1/2 translate-y-20 z-[300]
            bg-bg-3 border border-bd-2 text-tx px-4.5 py-2.5 rounded-md text-sm font-medium
            font-sans whitespace-nowrap shadow-sm
            transition-transform duration-300
            [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]">
```

`.show` 态用工具类切换 `translate-y-0`（JS 加/去 `show` 时直接改 classList 或 style.transform）。

### 4.9 空状态 / 骨架

```html
<!-- 空状态 -->
<div class="text-center p-12 text-tx-3 text-sm font-medium">还没有图片</div>

<!-- 骨架（shimmer） -->
<div class="rounded-lg bg-bg-3 … [background:linear-gradient(90deg,var(--color-bg-3)_25%,var(--color-bg-4)_50%,var(--color-bg-3)_75%)]
     [background-size:200%_100%] [animation:shimmer_1.5s_linear_infinite]"></div>
```

> `@keyframes shimmer` / `@keyframes spin` 等动画留在 `aperture.css`。

---

## 5. aperture.css 的最终形态

```css
@import "tailwindcss";
@source …;                 /* 扫描 src/**/*.js */
@theme { … }                /* §3 全部 token */
@source inline("…");        /* JS 动态拼的 class 保底 */

/* 只放工具类无法表达的极少数： */
@keyframes shimmer { … }
@keyframes loginSpin { … }
.field-sel {                 /* select 箭头 svg url */
  appearance: none;
  background-image: url("data:image/svg+xml,...");
}
```

**没有 `@layer components`，没有别名桥 `:root`**（组件全改完即删）。

---

## 6. 落地顺序（每步 build + wrangler dev 验证 + vitest 93 过）

1. 按钮系（最高频，视觉锚点） — 前后台同步
2. 表单字段
3. 卡片 / 图库项 / 表格行
4. 弹层（Modal / Lightbox / Toast）
5. 侧栏 / 外壳布局
6. 收尾：删别名桥、清 390 处 inline style、收编设备授权页、`@source inline` 补全

---

## 7. 验收标准

1. 源码 `grep -c` 自定义组件类（`.btn` `.gitem` `.modal` 等）→ 0。
2. 源码工具类使用 ≥ 数百处；`aperture.generated.css` 含 `bg-bg-4` 等独立定义。
3. 前后台/设备页视觉正确、交互不崩；`vitest` 93 过。
4. 焦点态键盘可见（brand ring）。
5. 不引入新依赖、不改 API、不改信息架构。

---

## 8. 非目标

- 亮色主题；重做信息架构；拆分巨型文件；装饰动画堆叠。
