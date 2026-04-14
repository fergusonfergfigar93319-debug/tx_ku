# HomeCardSwiper（Swiper 11 · QQ 音乐风格卡片轮播）

## 配图资源

- 横幅图放在 **`public/swiper/`**（构建后同路径可访问，如 `/swiper/card-feed.png`）。
- 数据在 `src/data/homeSwiperCards.ts` 中通过 `coverSrc` + `import.meta.env.BASE_URL` 拼接，支持子路径部署。
- 若需替换：保持文件名或改 `coverSrc` 指向新图即可；`gradient` 仍作未加载时的底色。

## 在哪里能看到？

- 登录后**默认进入**的是 **`/app/feed`（版本速递）**，轮播已挂在该页 Hero 下方，刷新即可看到。
- **`/app/home`（工作台首页）** 同样包含该组件；若只打开版本速递而从未进工作台，之前会误以为「没有变化」。

## 效果说明

- **中间主卡片**最大、最清晰；**两侧**露出邻卡，使用 **`slidesPerView: 'auto'` + `centeredSlides`**，侧卡 **scale + 降低透明度**（不再使用易兼容问题的 `effect: 'creative'`）。
- **循环** `loop`：条目 **≥ 3** 时自动开启（不足 3 条时关闭 loop，避免 Swiper 警告）。
- **自动轮播**、**触摸滑动**、**鼠标拖拽**（`grabCursor`）、**点击侧卡**会 `slideToClickedSlide` 居中、**分页点**可点。
- **路由跳转**：仅当卡片已居中时点击才会 `router.push`（与「先选中间再进入」一致）；侧卡需先点一次居中或滑动后再点进入。
- **深色舞台**：组件自带深色背景条，与全站亮色内容区形成对比。

## 方式一：npm（本仓库推荐，已配置）

### 1. 安装

```bash
cd web
npm install swiper@11
```

### 2. TypeScript：CSS 模块声明

若 `import 'swiper/css'` 报类型错误，在项目 `src/` 下已有 `swiper-css.d.ts`，内容为：

```ts
declare module 'swiper/css'
declare module 'swiper/css/effect-creative'
declare module 'swiper/css/pagination'
```

### 3. 在页面中使用

```vue
<script setup lang="ts">
import { computed } from 'vue'
import HomeCardSwiper from '@/components/home/HomeCardSwiper.vue'
import type { HomeCardSwiperItem } from '@/components/home/homeCardSwiper.types'

const items = computed(
  (): HomeCardSwiperItem[] => [
    {
      id: 'a',
      title: '标题',
      subtitle: '副标题',
      gradient: 'linear-gradient(135deg, #1e40af, #0ea5e9)',
      to: '/app/feed',
    },
    // 至少 3 条可舒适开启无限循环
  ],
)
</script>

<template>
  <HomeCardSwiper :items="items" :autoplay-delay="4500" :transition-ms="520" />
</template>
```

### 4. Props

| Prop | 类型 | 默认 | 说明 |
|------|------|------|------|
| `items` | `HomeCardSwiperItem[]` | 必填 | 卡片数据 |
| `autoplayDelay` | `number` | `4200` | 自动播放间隔（ms） |
| `transitionMs` | `number` | `520` | 切换动画时长（ms） |

### 5. 数据类型（可复制到业务）

见 `homeCardSwiper.types.ts`：

```ts
export interface HomeCardSwiperItem {
  id: string
  title: string
  subtitle: string
  gradient: string
  to?: string
}
```

---

## 方式二：CDN（无构建工具 / 静态页）

适用于**原生 HTML** 或**未使用 Vue 单文件组件**的场景。Vue 3 + Vite 项目请优先用 **npm**。

### 1. 引入样式与脚本（以 jsDelivr 为例，版本号与 npm 对齐 11.x）

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css"
/>
<script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>
```

### 2. 初始化（需自行准备 DOM 与 `EffectCreative` 模块）

CDN 全量包通常导出全局 `Swiper`。Creative 效果需在 Swiper 11 文档中确认是否包含在 `bundle` 内；若使用模块化构建，仍建议 **npm + ES 模块** 按需引入 `swiper/modules`，避免全量体积过大。

**结论**：本仓库为 **Vue + Vite**，以 **npm 安装 Swiper 11** 为准；CDN 仅作备用参考。

---

## 文件清单

| 文件 | 说明 |
|------|------|
| `HomeCardSwiper.vue` | 轮播组件本体 |
| `homeCardSwiper.types.ts` | 卡片数据类型 |
| `src/swiper-css.d.ts` | Swiper CSS 的 TS 声明 |

---

## 可调参数（进阶）

在 `HomeCardSwiper.vue` 内修改 `creativeEffect` 的 `translate` / `opacity` / `scale` 可改变「两侧缩小」程度；修改 `.qq-card` 的 `aspect-ratio` 与 `max-width` 可调整卡片比例与最大宽度。
