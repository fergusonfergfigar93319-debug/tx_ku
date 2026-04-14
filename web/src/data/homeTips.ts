import type { RouteLocationRaw } from 'vue-router'

/**
 * 分类与正文思路参考近年社区常见攻略共识（如：简洁报点、分工指挥、少无效信息、先匹配再排位等），
 * 不引用无法核对的「胜率百分比」类数据；正式环境可换为运营配置或接口。
 */
export type HomeTipCategory =
  | '开黑攻略'
  | '版本速递'
  | '礼仪贴士'
  | '组队推荐'
  | '休息提醒'
  | '峡谷协同'
  | '城市文旅'
  | '潮流共创'
  | '网页技巧'
  | '场景化 AI'

export interface HomeTip {
  id: string
  category: HomeTipCategory
  title: string
  body: string
  /** 卡片左侧强调色 */
  accent?: string
  /** 「去看看」跳转，无则只展示文案 */
  link?: { label: string; to: RouteLocationRaw }
}

/** 首页轮播小贴士（可后续接接口替换） */
export const HOME_TIPS: HomeTip[] = [
  {
    id: 't1',
    category: '开黑攻略',
    title: '报点试试「位置 → 状态 → 要做什么」',
    body: '峡谷对局里高分段常建议短促沟通：先报敌人在哪、大致人数或血量，再补你希望队友跟进的动作；配合地图标记，比长篇描述或互相埋怨更有效。',
    accent: '#007aff',
    link: { label: '去峡谷广场看招募', to: '/app/forum' },
  },
  {
    id: 't2',
    category: '峡谷协同',
    title: '分路与龙团前先统一意图',
    body: '关键资源（龙、主宰、高地）刷新前，说好「接团还是带线、谁盯视野、谁开团」；辅助与打野联动、中路支援时机，也是峡谷攻略里常提的基本配合。',
    accent: '#5856d6',
    link: { label: '打开版本速递', to: '/app/feed' },
  },
  {
    id: 't3',
    category: '组队推荐',
    title: '固定时段 + 简单分工更长久',
    body: '车队里可约定常在线时段，并选一个主喊节奏的人（转点、打龙、抱团），其他人补充信息即可。资料里写清段位与位置，招募帖也更容易对上眼。',
    accent: '#34c759',
    link: { label: '完善资料', to: '/app/me/profile-edit' },
  },
  {
    id: 't4',
    category: '版本速递',
    title: '大版本先看公告，再决定练谁',
    body: '平衡调整、装备或地图改动上线后，优先读官方说明与更新日志，再结合直播/复盘理解环境变化，再决定练新英雄或改分路，比盲目跟风更稳。',
    accent: '#af52de',
    link: { label: '浏览版本资讯', to: '/app/feed' },
  },
  {
    id: 't5',
    category: '礼仪贴士',
    title: '局内少指责，复盘留到赛后',
    body: '逆风时连续质问容易让全队操作变形；常见建议是局内只推进「下一步怎么打」，具体谁的问题、怎么改，放在打完后再聊。保持语气平静，体验通常会比互相甩锅好得多。',
    accent: '#ff9500',
    link: { label: '逛峡谷广场攻略', to: '/app/forum' },
  },
  {
    id: 't6',
    category: '开黑攻略',
    title: '王者峡谷：龙团前先统一意图',
    body: '暴君、主宰与高地团前，提前说好「打还是放、谁带线、谁盯视野」；打野与辅助联动、中路支援时机，也是许多上分攻略里反复提的基本功。',
    accent: '#00c7be',
  },
  {
    id: 't7',
    category: '组队推荐',
    title: '用 AI 名片写清打法与雷点',
    body: '搭子名片里写明主玩位置、上线时间、不接受的行为（如压力怪、挂机），陌生人加你前就能判断合不合适，减少「上车才发现不合拍」。',
    accent: '#007aff',
    link: { label: '去 AI搭子 创作', to: '/app/agent' },
  },
  {
    id: 't8',
    category: '休息提醒',
    title: '连跪歇一局，护眼也歇一局',
    body: '状态下滑时强行排位容易恶性循环，很多攻略建议连败后短暂离开屏幕；局间远眺、活动手腕，语音音量也别拉满，长期开黑更可持续。',
    accent: '#8e8e93',
    link: { label: '了解共识卡', to: { name: 'buddy-room', params: { relationId: 'demo_rel' } } },
  },
  {
    id: 't9',
    category: '城市文旅',
    title: '线下观赛与城市打卡可以写进名片',
    body: '同城赛事、主题展或城市联动活动时，在资料里标注常去的观赛点或兴趣地标，招募帖里更容易遇到「顺路约饭再看一场」的同好；文旅动线与开黑节奏也能自然对上。',
    accent: '#d97706',
    link: { label: '编辑资料', to: '/app/me/profile-edit' },
  },
  {
    id: 't10',
    category: '潮流共创',
    title: '用 AI 搭子试写「城市 + 英雄」短故事',
    body: '把家乡地标或旅行记忆写进提示词，让智能体帮你生成场景化文案或应援语，再分享到峡谷广场；高质量 UGC 往往来自真实城市情绪与游戏梗的结合。',
    accent: '#9333ea',
    link: { label: '去 AI搭子', to: '/app/agent' },
  },
  {
    id: 't11',
    category: '网页技巧',
    title: '大屏多标签：资讯与广场并排看',
    body: '浏览器开两个标签分别打开版本速递与峡谷广场，一边扫补丁与活动，一边看招募热帖；键鼠切换比小屏来回点 Tab 更省时间。',
    accent: '#2563eb',
    link: { label: '打开版本速递', to: '/app/feed' },
  },
  {
    id: 't12',
    category: '城市文旅',
    title: '线下观赛穿搭与物料怎么带',
    body: '轻便背包放充电宝与降噪耳机；应援物避免尖锐硬物；赛后聚餐若饮酒请量力而行并注意返程安全。城市夜景拍摄注意行人礼让。',
    accent: '#ea580c',
    link: { label: '逛峡谷广场活动帖', to: '/app/forum' },
  },
  {
    id: 't13',
    category: '场景化 AI',
    title: '让搭子先懂你「专注场景」',
    body: '在 AI 搭子创作台选好「组队招募」「赛后复盘」等场景，再开聊；智能体会更倾向给招募话术、复盘结构或情绪陪伴，而不是泛泛闲聊。',
    accent: '#059669',
    link: { label: '去创作台', to: '/app/agent' },
  },
  {
    id: 't14',
    category: '版本速递',
    title: '体验服与正式服别混着记结论',
    body: '体验服数值与英雄强度可能反复横跳；做笔记时标注来源与日期，和队友沟通时也说明「仅供参考」，避免正式服上线后集体误判环境。',
    accent: '#7c3aed',
    link: { label: '浏览资讯', to: '/app/feed' },
  },
  {
    id: 't15',
    category: '潮流共创',
    title: '应援口号押韵不如好念',
    body: '现场喊麦优先短句、换气点清晰；可先在家读几遍，再让 AI 搭子帮你改成顺口版。避免生僻字与过长队呼。',
    accent: '#db2777',
    link: { label: '去 AI搭子', to: '/app/agent' },
  },
  {
    id: 't16',
    category: '礼仪贴士',
    title: '公开帖少晒单局队友 ID',
    body: '复盘或吐槽时尽量描述局面而非点名路人；保护他人隐私也降低引战概率。需要举报请走官方渠道。',
    accent: '#64748b',
    link: { label: '广场攻略区', to: '/app/forum' },
  },
]
