import type { HomeCardSwiperItem } from '@/components/home/homeCardSwiper.types'

const withBase = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`

/**
 * QQ 音乐风格首页轮播数据（≥3 条启用 loop 大屏两侧露边；仅 2 条时用 rewind）
 * 用于 HomeView、DiscoverView（版本速递）等入口展示。
 * 叙事与全站一致：电竞 IP × 文旅 × 潮流 × 场景化 AI。
 * 配图位于 `public/swiper/`，由 Vite 以根路径提供；无图时仅用渐变兜底。
 */
export function buildHomeSwiperCards(agentChatUnlocked: boolean): HomeCardSwiperItem[] {
  return [
    {
      id: 'sw-feed',
      title: '版本速递',
      subtitle: '赛事、补丁与城市活动资讯聚合 · 王者电竞 IP 一线动态',
      microHint: '官方速递 + UGC 精选；支持封面缩略与游戏筛选',
      badge: '赛事资讯',
      badgeTone: 'blue',
      tags: ['版本公告', '平衡调整', '活动日历'],
      gradient: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 45%, #0ea5e9 100%)',
      coverSrc: withBase('swiper/card-feed.png'),
      to: '/app/feed?tab=news',
    },
    {
      id: 'sw-city',
      title: '城市文旅线',
      subtitle: '主场观赛 · 联动展陈与同城打卡灵感',
      microHint: '把城市地标与开黑动线写进你的故事',
      badge: '文旅',
      badgeTone: 'gold',
      tags: ['主场攻略', '打卡路线', '线下联动'],
      gradient: 'linear-gradient(135deg, #78350f 0%, #b45309 38%, #f59e0b 88%)',
      coverSrc: withBase('swiper/card-city.png'),
      to: '/app/feed/city',
    },
    {
      id: 'sw-forum',
      title: '峡谷广场',
      subtitle: '招募、攻略与文旅打卡 · 同城同好一站讨论',
      microHint: '热帖预览与多标签；大屏键鼠刷帖更顺手',
      badge: '社区',
      badgeTone: 'violet',
      tags: ['招募', '攻略', '同城'],
      gradient: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 40%, #db2777 90%)',
      coverSrc: withBase('swiper/card-forum.png'),
      to: '/app/forum',
    },
    {
      id: 'sw-trend',
      title: '潮流共创',
      subtitle: '应援、二创与穿搭话题 · 年轻文化表达',
      microHint: '用梗图、短评与同人作品连接峡谷内外',
      badge: '潮流',
      badgeTone: 'pink',
      tags: ['UGC', '应援', '二创'],
      gradient: 'linear-gradient(135deg, #831843 0%, #be185d 42%, #ec4899 100%)',
      coverSrc: withBase('swiper/card-trend.png'),
      to: '/app/trend',
    },
    {
      id: 'sw-agent',
      title: 'AI 搭子',
      subtitle: agentChatUnlocked
        ? '场景化智能体已就绪 · 去对话共创'
        : '人设与名片 · 解锁电竞 + AI 场景体验',
      microHint: agentChatUnlocked ? '多轮对话 · 人设与文案一站打磨' : '完成名片创作即可解锁聊天',
      badge: 'AI+',
      badgeTone: 'teal',
      tags: ['智能体', '名片', '场景提示'],
      gradient: 'linear-gradient(135deg, #0f766e 0%, #059669 45%, #22c55e 100%)',
      coverSrc: withBase('swiper/card-agent.png'),
      to: agentChatUnlocked ? '/app/agent/chat' : '/app/agent',
    },
    {
      id: 'sw-me',
      title: '元流档案',
      subtitle: '你的潮流电竞身份 · 名片与同城偏好展示',
      microHint: '对外展示兴趣标签与社交名片',
      badge: '我的',
      badgeTone: 'orange',
      tags: ['名片', '偏好', '账号'],
      gradient: 'linear-gradient(135deg, #9a3412 0%, #ea580c 50%, #fbbf24 100%)',
      coverSrc: withBase('swiper/card-me.png'),
      to: '/app/me/flow',
    },
  ]
}
