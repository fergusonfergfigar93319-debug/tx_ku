/** HomeCardSwiper 单卡数据（可与业务路由、埋点等扩展） */
export interface HomeCardSwiperItem {
  id: string
  title: string
  subtitle: string
  /** 卡片底层渐变（配图未加载或失败时兜底） */
  gradient: string
  /** 横幅配图 URL（建议放 public/swiper，如 `/swiper/card-feed.png`） */
  coverSrc?: string
  /** 可选：点击跳转 */
  to?: string
  /** 左上角主题角标，如「赛事」「文旅」 */
  badge?: string
  /** 角标色系 */
  badgeTone?: 'blue' | 'violet' | 'teal' | 'gold' | 'pink' | 'cyan' | 'orange'
  /** 文内标签（短词，2～3 个为宜） */
  tags?: string[]
  /** 轮播底部「当前焦点」一句话，宜比 subtitle 更短 */
  microHint?: string
  /** 当前卡氛围主色（hex，同步到 :root --current-theme-color） */
  themeColor?: string
  /** 同主色的 RGB 分量，空格分隔，供 rgb(var(--current-theme-rgb) / α) */
  themeRgb?: string
}
