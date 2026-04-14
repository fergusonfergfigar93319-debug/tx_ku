<script setup lang="ts">
defineProps<{
  reasons?: string[]
  conflict?: string
  advice?: string
}>()
</script>

<template>
  <div class="reason-panel">
    <div v-if="reasons?.length" class="block match">
      <span class="label">匹配理由</span>
      <ul>
        <li v-for="(r, i) in reasons" :key="i">{{ r }}</li>
      </ul>
    </div>
    <div v-if="conflict" class="block conflict">
      <span class="label">可能差异</span>
      <p>{{ conflict }}</p>
    </div>
    <div v-if="advice" class="block advice">
      <span class="label">相处建议</span>
      <p>{{ advice }}</p>
    </div>
  </div>
</template>

<style scoped>
.reason-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 13px;
}

.block {
  padding: 10px 12px;
  border-radius: var(--buddy-radius-sm);
  border: 1px solid var(--buddy-border);
}

.match {
  background: rgba(56, 189, 248, 0.08);
}

.conflict {
  background: rgba(251, 191, 36, 0.08);
}

.advice {
  background: rgba(0, 122, 255, 0.06);
}

.label {
  display: block;
  font-size: 12px;
  color: var(--buddy-text-muted);
  margin-bottom: 6px;
}

ul {
  margin: 0;
  padding-left: 18px;
}

p,
li {
  margin: 0;
  line-height: 1.5;
  color: var(--buddy-text-secondary);
}
</style>
