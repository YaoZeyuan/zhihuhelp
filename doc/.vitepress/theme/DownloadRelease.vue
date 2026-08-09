<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { parseReleaseInfo, VERSION_ENDPOINT, type ReleaseInfo } from './release'

const release = ref<ReleaseInfo>()
const loading = ref(true)
const error = ref(false)
let controller: AbortController | undefined
const isMac = /macintosh|mac os x/i.test(navigator.userAgent)

async function loadRelease() {
  controller?.abort()
  controller = new AbortController()
  loading.value = true
  error.value = false
  try {
    const response = await fetch(VERSION_ENDPOINT, {
      signal: controller.signal,
      cache: 'no-store',
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const parsed = parseReleaseInfo(await response.json())
    if (!parsed) throw new Error('版本接口响应格式无效')
    release.value = parsed
  } catch (requestError) {
    if ((requestError as Error)?.name !== 'AbortError') {
      release.value = undefined
      error.value = true
    }
  } finally {
    loading.value = false
  }
}

onMounted(loadRelease)
onBeforeUnmount(() => controller?.abort())
</script>

<template>
  <section class="download-release" aria-labelledby="download-release-title">
    <div class="download-release-heading">
      <p class="download-release-kicker"></p>
      <h2 id="download-release-title">
        {{ release ? `最新版本 v${release.version}` : '获取知乎助手' }}
      </h2>
      <p>选择你的系统，直接下载桌面版安装包。</p>
    </div>

    <p v-if="loading" class="download-release-status" role="status">正在获取最新版本…</p>

    <div v-if="error" class="download-release-error" role="alert">
      <span>暂时无法获取下载信息。</span>
      <button type="button" @click="loadRelease">重新获取</button>
    </div>

    <div v-if="release" class="download-release-actions">
      <a
        :class="{
          'download-platform-button': true,
          'is-primary': isMac === false,
        }"
        :href="release.windows.url"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img src="/static/windows.svg" />
        <span>Windows 版 · v{{ release.windows.version }}</span>
      </a>
      <a
        :class="{
          'download-platform-button': true,
          'is-primary': isMac,
        }"
        :href="release.mac.url"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img src="/static/mac.svg" />
        <span>macOS 版 · v{{ release.mac.version }}</span>
      </a>
    </div>
  </section>
</template>

<style scoped>
.download-release {
  margin-top: 30px;
  padding: 26px;
  border: 1px solid color-mix(in srgb, var(--vp-c-brand-1) 30%, var(--vp-c-divider));
  border-radius: 20px;
  background: linear-gradient(145deg, color-mix(in srgb, var(--vp-c-brand-soft) 65%, var(--vp-c-bg)), var(--vp-c-bg));
  box-shadow: 0 18px 52px rgb(9 88 217 / 12%);
}

.download-release-heading h2 {
  margin: 2px 0 6px;
  border: 0;
  font-size: clamp(24px, 4vw, 34px);
  line-height: 1.2;
}

.download-release-heading p {
  margin: 0;
  color: var(--vp-c-text-2);
}

.download-release-heading .download-release-kicker {
  color: var(--vp-c-brand-1);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.download-release-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 22px;
}

.download-platform-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  min-height: 48px;
  padding: 0 20px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  color: var(--vp-c-text-1) !important;
  font-weight: 650;
  text-decoration: none !important;
  background: var(--vp-c-bg);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.download-platform-button.is-primary {
  border-color: var(--vp-c-brand-1);
  color: #fff !important;
  background: var(--vp-c-brand-1);
}

.download-platform-button:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 9px 24px rgb(9 88 217 / 16%);
  transform: translateY(-2px);
}

.download-release-status,
.download-release-error {
  margin: 20px 0 0;
  color: var(--vp-c-text-2);
}

.download-release-error button {
  margin-left: 12px;
  padding: 7px 12px;
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 8px;
  color: var(--vp-c-brand-1);
  background: transparent;
  cursor: pointer;
}

@media (max-width: 639px) {
  .download-release {
    padding: 21px;
  }

  .download-release-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .download-platform-button {
    width: 100%;
  }
}
.download-platform-button img {
  width: 18px;
}
</style>
