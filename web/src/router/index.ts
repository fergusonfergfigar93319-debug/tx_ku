import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router'
import { getToken } from '@/api/http'
import { useUserStore } from '@/stores/user'
import { isProfileComplete } from '@/utils/profile'

const SplashView = () => import('@/views/SplashView.vue')
const LoginView = () => import('@/views/auth/LoginView.vue')
const RegisterView = () => import('@/views/auth/RegisterView.vue')
const OnboardingView = () => import('@/views/onboarding/OnboardingView.vue')
const GameInterestView = () => import('@/views/onboarding/GameInterestView.vue')
const MainLayout = () => import('@/layouts/MainLayout.vue')
const DiscoverView = () => import('@/views/discover/DiscoverView.vue')
const AgentView = () => import('@/views/agent/AgentView.vue')
const AgentChatView = () => import('@/views/agent/AgentChatView.vue')
const ForumView = () => import('@/views/forum/ForumView.vue')
const ForumFavoritesView = () => import('@/views/forum/ForumFavoritesView.vue')
const PostDetailView = () => import('@/views/forum/PostDetailView.vue')
const PostEditorView = () => import('@/views/forum/PostEditorView.vue')
const MeView = () => import('@/views/me/MeView.vue')
const ProfileEditView = () => import('@/views/me/ProfileEditView.vue')
const MyPostsView = () => import('@/views/me/MyPostsView.vue')
const FollowingView = () => import('@/views/me/FollowingView.vue')
const AddFriendView = () => import('@/views/me/AddFriendView.vue')
const DmView = () => import('@/views/me/DmView.vue')
const BuddyRoomView = () => import('@/views/buddy/BuddyRoomView.vue')
const HomeView = () => import('@/views/home/HomeView.vue')
const CityTravelView = () => import('@/views/city/CityTravelView.vue')
const TrendStudioView = () => import('@/views/trend/TrendStudioView.vue')
const MetaFlowArchiveView = () => import('@/views/me/MetaFlowArchiveView.vue')
const AppModulesHubView = () => import('@/views/hub/AppModulesHubView.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'splash', component: SplashView, meta: { public: true } },
    { path: '/login', name: 'login', component: LoginView, meta: { public: true, guest: true } },
    { path: '/register', name: 'register', component: RegisterView, meta: { public: true, guest: true } },
    {
      path: '/onboarding',
      name: 'onboarding',
      component: OnboardingView,
      meta: { requiresAuth: true },
    },
    {
      path: '/game-interest',
      name: 'game-interest',
      component: GameInterestView,
      meta: { requiresAuth: true },
    },
    {
      path: '/app',
      component: MainLayout,
      meta: { requiresAuth: true, requiresProfile: true, requiresGameInterest: true },
      children: [
        { path: '', redirect: { name: 'home' } },
        {
          path: 'feed/city',
          name: 'feed-city',
          component: CityTravelView,
          meta: { tab: 'feed', backTo: { name: 'home' } },
        },
        { path: 'feed', name: 'feed', component: DiscoverView, meta: { tab: 'feed' } },
        {
          path: 'trend',
          name: 'trend-studio',
          component: TrendStudioView,
          meta: { tab: 'forum', backTo: { name: 'home' } },
        },
        { path: 'discover', redirect: { name: 'feed' } },
        { path: 'home', name: 'home', component: HomeView, meta: { tab: 'home' } },
        {
          path: 'modules',
          name: 'app-modules',
          component: AppModulesHubView,
          meta: { tab: 'home', backTo: { name: 'home' } },
        },
        { path: 'agent', name: 'agent', component: AgentView, meta: { tab: 'agent' } },
        {
          path: 'agent/chat',
          name: 'agent-chat',
          component: AgentChatView,
          meta: { tab: 'agent', requiresAgentUnlock: true, backTo: { name: 'agent' } },
        },
        { path: 'forum', name: 'forum', component: ForumView, meta: { tab: 'forum' } },
        {
          path: 'forum/favorites',
          name: 'forum-favorites',
          component: ForumFavoritesView,
          meta: { tab: 'forum', backTo: { name: 'forum' } },
        },
        {
          path: 'forum/post/:postId',
          name: 'post-detail',
          component: PostDetailView,
          meta: { tab: 'forum', backTo: { name: 'forum' } },
        },
        {
          path: 'forum/edit',
          name: 'post-editor',
          component: PostEditorView,
          meta: { tab: 'forum', backTo: { name: 'forum' } },
        },
        {
          path: 'me/flow',
          name: 'me-flow',
          component: MetaFlowArchiveView,
          meta: { tab: 'me', backTo: { name: 'me' } },
        },
        { path: 'me', name: 'me', component: MeView, meta: { tab: 'me' } },
        {
          path: 'me/my-posts',
          name: 'my-posts',
          component: MyPostsView,
          meta: { tab: 'me', backTo: { name: 'me' } },
        },
        {
          path: 'me/profile-edit',
          name: 'profile-edit',
          component: ProfileEditView,
          meta: { tab: 'me', backTo: { name: 'me' } },
        },
        {
          path: 'me/following',
          name: 'following',
          component: FollowingView,
          meta: { tab: 'me', backTo: { name: 'me' } },
        },
        {
          path: 'me/add-friend',
          name: 'add-friend',
          component: AddFriendView,
          meta: { tab: 'me', backTo: { name: 'me' } },
        },
        {
          path: 'me/dm/:peerUserId',
          name: 'user-dm',
          component: DmView,
          meta: { tab: 'me', backTo: { name: 'me' } },
        },
      ],
    },
    { path: '/post-editor', redirect: { name: 'post-editor' } },
    {
      path: '/buddy/:relationId',
      name: 'buddy-room',
      component: BuddyRoomView,
      meta: { requiresAuth: true, backTo: { name: 'home' } },
    },
  ],
})

const PUBLIC_PATHS = new Set(['/', '/login', '/register'])

function metaFlag(to: RouteLocationNormalized, key: string): boolean {
  return to.matched.some((r) => Boolean((r.meta as Record<string, unknown>)[key]))
}

router.beforeEach(async (to, _from, next) => {
  const token = getToken()
  const user = useUserStore()

  if (metaFlag(to, 'public') && PUBLIC_PATHS.has(to.path)) {
    return next()
  }

  if (metaFlag(to, 'guest') && token) {
    return next({ name: 'home' })
  }

  if (metaFlag(to, 'requiresAuth') && !token) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  if (token && !user.profile && to.path !== '/onboarding' && to.name !== 'splash') {
    try {
      await user.fetchProfile()
    } catch {
      /* 401 等由 http 处理 */
    }
  }

  if (metaFlag(to, 'requiresProfile') && token) {
    if (!isProfileComplete(user.profile)) {
      return next({ name: 'onboarding' })
    }
  }

  if (metaFlag(to, 'requiresGameInterest') && token && isProfileComplete(user.profile)) {
    if (!user.gameInterestCompleted) {
      return next({ name: 'game-interest' })
    }
  }

  if (metaFlag(to, 'requiresAgentUnlock') && !user.agentChatUnlocked) {
    return next({ name: 'agent' })
  }

  next()
})

export default router
