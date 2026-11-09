# Bing Wallpapers Archive 设计风格

本文整理截至 2026-11-09 当前工作区的界面实现（包含当时尚未提交的修改），供新增页面、调整组件和设计评审使用。它描述现有风格，不代表一次重新设计。样式参数以源码为准；本文没有进行浏览器截图验收，README 中的历史截图也不作为最新界面的唯一依据。

## 1. 设计定位

**摄影优先的档案画廊，带有温暖、克制的编辑排版感。**

- 图片承担主要色彩与视觉吸引力，界面使用中性色、柔和表面与低对比分隔线。
- 页面主标题的衬线字体提供杂志与档案感，卡片标题、区块标题、正文和控件统一使用无衬线字体。
- 深色主题接近炭黑，浅色主题使用暖象牙色；琥珀色贯穿操作、选中状态和小标题。
- 大圆角用于图片容器和面板，小圆角用于选项，胶囊用于标签与主要动作。
- 浏览路径是筛选 → 连续画廊 → 幻灯片预览或详情；详情页通过图片取色营造环境光。

扩展界面时，优先延续这些关系。避免让高饱和大色块、密集重边框或持续运动抢走图片的注意力。这是从当前实现提炼的设计建议，而非额外的功能限制。

## 2. 色彩与主题

主题 token 集中在 [`app/globals.css`](../app/globals.css)。`html[data-theme-resolved]` 决定实际主题；用户可选择 `system`、`light`、`dark`，初始化与存储逻辑见 [`components/site-document.tsx`](../components/site-document.tsx) 和 [`components/theme-switcher.tsx`](../components/theme-switcher.tsx)。默认偏好为跟随系统。

下表为实际 UI token 的色值；RGB 均按 sRGB 解释。

| 语义 / token | 深色 | 浅色 |
| --- | --- | --- |
| 页面底 `--theme-app-rgb` | `#0a0a0a` | `#f8f6f1` |
| 弹层底 `--theme-panel-background` | `#0a0a0a` | `#fffdf9` |
| 较强表面 `--theme-surface-strong-rgb` | `#171717` | `#eeeae2` |
| 主文字 `--theme-text-strong-rgb` | `#ffffff` | `#111827` |
| 正文文字 `--theme-text-soft-rgb` | `#f5f5f4` | `#334155` |
| 次要文字 `--theme-text-muted-rgb` | `#a8a29e` | `#57534e` |
| 弱文字 `--theme-text-faint-rgb` | `#88827e` | `#68605a` |
| 禁用文字 `--theme-text-disabled-rgb` | `#57534e` | `#a8a29e` |
| 强调实底 `--theme-accent-solid-rgb` | `#fcd34d` | `#e3b653` |
| 强调文字 `--theme-accent-text-rgb` | `#fcd34d` | `#8f5d18` |
| 实底按钮文字 `--theme-accent-on-solid` | `#292524` | `#342610` |
| 强调实底 hover `--theme-accent-solid-hover-rgb` | `#fde68a` | `#d6a547` |

`--background` 本身在深色为 `#0b0b0c`，并不等于页面容器使用的 `--theme-app-rgb`。不要将二者误记为同一个值。

### 使用方式

- 文字、实底按钮、轻染色表面和焦点环分别使用 `accent-text`、`accent-solid`、`accent-surface`、`accent-ring`。浅色主题下这些值有意不同，浅金底色不能直接充当小字号文字色。
- 叠加表面通常使用 `rgb(var(--theme-overlay-rgb) / 0.025…0.06)`；分隔边框常见透明度为 `0.05…0.12`。浮层比一般卡片更清晰，但仍使用柔和阴影。
- `.section-divider` 是两端渐隐的 1px 横线，适用于大区块边界。
- `.theme-button-hover` 使用轻微背景变化；选中状态保留自己的背景与文字语义。

现有项目在全局 CSS 中映射部分 Tailwind 工具类，例如 `bg-stone-950`、`text-white`、`text-stone-400`、`bg-amber-300`。因此类名的字面颜色不一定是最终颜色，且部分映射含 `!important`。新增样式应复用语义 token 或已存在的 `theme-*` 类；增加新的带透明度工具类时，检查它是否真的适配两个主题。

**照片上的文字是单独的场景。** 分类缩略图保留白字与暗色渐变；幻灯片固定黑底与浅色控制。不要让全局主题映射把照片上的白字改成浅色主题的深色文字。画廊图片标题则已有专用的浅色主题渐变与文字覆盖样式。

## 3. 字体与排版

| 用途 | 当前规则 |
| --- | --- |
| 正文与控件 | `--font-body`：Avenir Next / Avenir / Segoe UI，中文 PingFang SC、Microsoft YaHei 等，后备 system-ui |
| 展示标题 | `--font-display`：Iowan Old Style / Palatino，中文 Noto Serif SC、Source Han Serif SC、Songti SC 等，后备 Georgia / serif |
| 应用展示字体的元素 | `h1`、`[data-display-text="true"]`；`h2`、`h3` 默认使用正文无衬线字体 |
| 搜索语法等代码 | 系统等宽字体栈 |
| 页面主标题 | `text-3xl` → `sm:text-5xl`（30 → 48px），600 字重，`tracking-tight` |
| 眉题 / archive label | 14px，大写规则，`0.3em` 字距，`.theme-eyebrow` 强调色 |
| 画廊详情卡 / 相邻导航标题 | 无衬线 18px / 24px，500 字重；更多壁纸卡片标题 16px / 22px，500 字重 |
| 区块标题 | 无衬线 20px，600 字重；控件标签通常 500 字重 |
| 一般说明 | 14px / 24px，次要文字色 |
| 详情长文 | 16px，行高 `1.85`；段落间距 16px |
| 控件标签与元数据 | 统一 12px，避免 10–11px 的细碎字号；日期、数量使用 `tabular-nums`，日期不加额外字距 |
| 主题字号 token | `--type-caption-size: 12px`、`--type-body-size: 14px`、`--type-reading-size: 16px`；移动端搜索输入框保留 16px |

字体是本机字体栈，实际外观随平台和字体安装情况变化。多语言长标题使用 `min-w-0`、`break-words` 和必要的行数限制，不依赖英文文本长度确定容器。

## 4. 页面尺度与响应式

- 首页与详情页通常居中，最大宽度 `max-w-7xl`（1280px）。画廊宽屏模式允许首页容器扩展到可用宽度。
- 页面左右留白：16px → 640px 起 24px → 1024px 起 32px；顶部留白：20px → 640px 起 40px。
- 常见主区块间距为 24px；详情页在 `sm` 起为 40px。卡片内部常用 20 / 24 / 32px 内边距。
- 主要布局断点沿用 Tailwind 默认值：`sm=640`、`md=768`、`lg=1024`。画廊列数另外按容器宽度计算，不是固定断点列数。
- 详情信息区在桌面 `lg` 起为正文 + 320px 侧栏；侧栏 `sticky top-6`。较窄屏幕单列，主要图片操作移到图片下方。
- 搜索、日期、国家和视图等面板通过 `ResponsivePanel` 在 639px 及以下切换为底部原生模态抽屉。保留安全区、内部滚动、关闭后焦点回到触发器的行为。

底部抽屉顶部圆角 24px，遮罩黑色 50%，最高 `min(88dvh, calc(100dvh - env(safe-area-inset-top) - 1rem))`。面板底色保持不透明，避免图片干扰操作内容。

## 5. 组件语言

### 画廊与视图切换

实现：[`waterfall-gallery.tsx`](../components/waterfall-gallery.tsx)、[`waterfall-view-options.tsx`](../components/waterfall-view-options.tsx)。

- 初始视图是「标题 + 日期」、瀑布流、自动列数、标准宽度、标准外观；使用者保存的偏好会覆盖默认值。
- 信息层级依次为纯图、标题、标题 + 日期、含描述。只有含描述模式使用正文卡片结构。
- 自动列数以 300px 最小列宽、当前外观的 `detailGap` 和最多 6 列计算。手动选项为 2–6 列，但仍受可容纳列数限制。
- 三档外观有不同间距与圆角，不应把所有画廊卡片统一成一种规格：

| 外观索引 | 图片间距 / 圆角 | 含描述卡间距 / 圆角 |
| --- | --- | --- |
| 0 | 4px / 6px | 8px / 8px |
| 1（默认） | 8px / 1.15rem | 16px / 1.75rem |
| 2 | 16px / 1.5rem | 24px / 2rem |

- 图片使用 `object-cover`；网格图片为 16:9。含描述的瀑布流图片使用 16:10 且有最小高度，图片模式的瀑布流使用变化的预设高度。
- 图片模式通过底部渐变承载标题与日期；含描述模式在图片下单独排版，描述默认最多四行并带渐隐，可展开。
- 点击图片打开幻灯片，点击标题进入详情。连续加载、滚动位置恢复、视图切换保持浏览锚点是现有体验的一部分。

### 筛选与选择

实现：[`filter-bar.tsx`](../components/filter-bar.tsx)、[`taxonomy-browser.tsx`](../components/taxonomy-browser.tsx)、[`country-filter.tsx`](../components/country-filter.tsx)、[`date-filter.tsx`](../components/date-filter.tsx)。

- 筛选容器为 28px 圆角，默认折叠但保留已选条件摘要，并记忆展开状态。
- 搜索、日期、国家组成工具区；分类用可横向滚动的图片卡，标签用胶囊选项。通过低对比分隔线组织层级。
- 分类卡常规高 128px、圆角 14px；窄屏高 120px、列宽 108px。标题位于暗色渐变上，选中有金色外环与勾选标记。
- 普通选项使用小圆角，标签使用全圆角。选中可采用强调色实底，国家列表则采用强调色浅底与深色强调文字。
- 日期年份为分段选择，月份为三列网格；选中月份用浅金底、边框和强调文字共同反馈。
- 筛选过程使用顶部 2px 细进度光带，并通过 `aria-busy` / 状态文字表达更新。

### 按钮与浮层

- 主要下载动作使用琥珀实底、深色字、胶囊轮廓；次要动作用细边框或轻背景。
- 常规按钮文字多为 12–14px，图标多为细线 SVG，端点和转角圆润，常见描边约 1.3–1.7。
- 视图分段按钮桌面最小高 36px，移动端为 44px；幻灯片圆形控制为 44px。其他已有紧凑选项存在更小尺寸，不能把 44px 描述成全站已实现的标准。
- 日期、国家、视图弹层使用语义面板底色与柔和阴影；模态与弹层必须保留可见焦点和有名称的关闭按钮。

### 详情与沉浸预览

实现：[`详情页`](../app/[locale]/wallpaper/[ssd]/page.tsx)、[`detail-ambient-background.tsx`](../components/detail-ambient-background.tsx)、[`waterfall-slideshow.tsx`](../components/waterfall-slideshow.tsx)。

- 详情页主图使用 `h-auto w-full object-contain`，展示完整比例；主容器圆角 24px，`sm` 起 32px。正文与元数据侧栏位于图下。
- 环境背景由图片模糊层、采样色渐变和柔光构成；浅色主题降低环境图强度、采用更实的阅读面板。取色失败有后备渐变。
- 767px 及以下或粗指针设备隐藏大面积模糊图与光晕，并关闭相关背板模糊，保留取色渐变。扩展时继续遵守这个性能取舍。
- 幻灯片是固定黑底、全屏 `100dvh`、`object-cover` 的独立沉浸场景，图片可能裁切。控制与字幕通过顶部/底部暗色渐变保证可读。
- 预览打开时暂停，可播放、前后切换，支持键盘与触摸滑动。控制区考虑安全区，标题仍可进入详情。

## 6. 动效与状态

| 场景 | 当前实现 |
| --- | --- |
| 主题底色 / 文字 | 180ms ease |
| 普通控件反馈 | 常见 150–180ms |
| 画廊卡片显现 | 520ms，位移 18px、缩放 0.985 → 1，曲线 `cubic-bezier(0.22, 1, 0.36, 1)` |
| 视图进入 | 260ms，8px 位移与轻模糊消退 |
| 分类图 hover | 350ms，放大至 1.08 |
| 桌面画廊宽屏图 hover | 200ms，放大至 1.02，滚动时可暂停 |
| 底部抽屉进入 | 200ms ease-out，向上进入 |
| 幻灯片播放 | 图片缓慢放大至 1.04，切图使用淡入淡出 |

已有主要动效针对 `prefers-reduced-motion` 提供关闭或静态回退。新增动画遵循同样约定；hover 放大限制在合适的指针设备，避免触摸端粘滞状态。

焦点环通常为 2px 强调色；照片沉浸场景使用白色焦点。选中、禁用、加载与空结果应有可理解的语义状态：`aria-current`、`aria-pressed`、`aria-expanded`、`disabled` 或 `aria-disabled`，以及适当的状态播报。这里记录的是现有模式，不构成无障碍合规认证。

## 7. 延续风格时的工作方式

1. 先找到对应的现有组件，确认它属于阅读表面、照片叠字还是沉浸预览。
2. 调整局部时复用 token、字体、圆角与状态样式；需要新值时说明现有层级为何不适用。本文数值是实现快照，不限制用户明确要求的改版。
3. 检查深浅主题的最终计算样式，尤其注意全局工具类覆盖、照片白字、浅色强调文字和面板透明度。
4. 根据改动检查窄屏与桌面、长标题与多语言、键盘焦点、选中/禁用/加载/空状态；涉及动效时检查减少动态效果设置。
5. 涉及画廊时检查信息层级、瀑布流/网格、宽屏和外观档位；涉及弹层时检查底部抽屉、安全区与焦点返回。只验证本次改动影响的路径。
6. 设计约定发生变化时同步更新本文；历史截图仅作参考，以当前组件和全局 CSS 为准。

## 8. 源码索引

| 调整目标 | 首先查看 |
| --- | --- |
| 全局颜色、字体、主题覆盖、抽屉、动效 | [`app/globals.css`](../app/globals.css) |
| 首页留白与标题层级 | [`app/[locale]/page.tsx`](../app/[locale]/page.tsx) |
| 画廊排版与外观数值 | [`components/waterfall-gallery.tsx`](../components/waterfall-gallery.tsx) |
| 视图选项与默认值 | [`components/waterfall-view-options.tsx`](../components/waterfall-view-options.tsx) |
| 响应式浮层与焦点返回 | [`components/responsive-panel.tsx`](../components/responsive-panel.tsx) |
| 语言与界面文案 | [`lib/i18n.ts`](../lib/i18n.ts)、[`lib/taxonomy-ui-labels.ts`](../lib/taxonomy-ui-labels.ts) |

仓库内另提供 [`bing-wallpapers-design` skill](../skills/bing-wallpapers-design/SKILL.md)，用于让后续界面任务读取并应用本文。
