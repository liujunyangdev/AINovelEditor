<template>
  <div>
    <h1>设置</h1>
    <el-form label-width="120px">
      <el-form-item label="API Key">
        <el-input v-model="apiKey" type="password" show-password placeholder="请输入你的 API Key"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="saveApiKey">保存</el-button>
      </el-form-item>
    </el-form>
    <p>{{ saveStatus }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

declare global {
  interface Window {
    electronAPI: {
      selectDirectory: () => Promise<string | undefined>;
      store: {
        get: (key: string) => Promise<any>;
        set: (key: string, val: any) => Promise<void>;
      };
    };
  }
}

const apiKey = ref('');
const saveStatus = ref('');

onMounted(async () => {
  apiKey.value = await window.electronAPI.store.get('apiKey');
});

async function saveApiKey() {
  await window.electronAPI.store.set('apiKey', apiKey.value);
  saveStatus.value = 'API Key 已保存。';
  setTimeout(() => {
    saveStatus.value = '';
  }, 3000);
}
</script>
