<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import { RouterLink } from 'vue-router'

defineProps<{
  title: string
  subtitle?: string
  /** 区块右上角「查看全部」等 */
  more?: { label: string; to: RouteLocationRaw }
}>()
</script>

<template>
  <section class="buddy-module">
    <header class="buddy-module-head buddy-module-head--motion">
      <div class="buddy-module-head-row">
        <h2 class="buddy-module-title">{{ title }}</h2>
        <RouterLink v-if="more" :to="more.to" class="buddy-module-more">{{ more.label }}</RouterLink>
      </div>
      <p v-if="subtitle" class="buddy-module-sub">{{ subtitle }}</p>
    </header>
    <div class="buddy-module-body buddy-stagger-children">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.buddy-module {
  margin-bottom: 28px;
}

.buddy-module-head {
  margin-bottom: 12px;
  padding-left: 0;
}

.buddy-module-head-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.buddy-module-title {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0.03em;
  color: var(--buddy-text);
  position: relative;
  padding-left: 12px;
}

.buddy-module-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 1.05em;
  border-radius: 4px;
  background: var(--buddy-gradient-brand);
  background-size: 200% 100%;
  box-shadow:
    0 0 12px rgba(37, 99, 235, 0.28),
    0 0 18px rgb(var(--buddy-rgb-honor-gold) / 0.15);
  transition:
    box-shadow var(--buddy-duration-sm) var(--buddy-ease-out),
    filter var(--buddy-duration-sm) var(--buddy-ease-out);
}

@media (prefers-reduced-motion: no-preference) {
  .buddy-module-head:hover .buddy-module-title::before {
    animation: buddy-module-bar-glow 2.8s ease-in-out infinite;
  }
}

@keyframes buddy-module-bar-glow {
  0%,
  100% {
    filter: brightness(1);
    box-shadow:
      0 0 12px rgba(37, 99, 235, 0.28),
      0 0 14px rgb(var(--buddy-rgb-honor-gold) / 0.12);
  }
  50% {
    filter: brightness(1.12);
    box-shadow:
      0 0 16px rgba(37, 99, 235, 0.38),
      0 0 22px rgb(var(--buddy-rgb-honor-gold) / 0.28);
  }
}

@media (prefers-reduced-motion: reduce) {
  .buddy-module-head:hover .buddy-module-title::before {
    animation: none !important;
  }
}

.buddy-module-more {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--buddy-primary);
  text-decoration: none;
  transition:
    color var(--buddy-duration-sm) var(--buddy-ease-out),
    opacity var(--buddy-duration-sm) var(--buddy-ease-out),
    transform var(--buddy-duration-xs) var(--buddy-ease-spring),
    letter-spacing var(--buddy-duration-sm) var(--buddy-ease-out);
}

.buddy-module-more:hover {
  text-decoration: underline;
  opacity: 1;
  letter-spacing: 0.04em;
  transform: translateX(2px);
}

@media (prefers-reduced-motion: reduce) {
  .buddy-module-more:hover {
    transform: none;
    letter-spacing: inherit;
  }
}

.buddy-module-sub {
  margin: 5px 0 0;
  padding-left: 14px;
  font-size: 12px;
  line-height: 1.45;
  color: var(--buddy-text-muted);
}
</style>
