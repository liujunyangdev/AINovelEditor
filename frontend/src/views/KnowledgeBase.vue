<template>
  <div>
    <h1>知识库</h1>
    <el-button @click="selectFolder" :loading="isLoading">选择并索引知识库文件夹</el-button>
    <p v-if="selectedPath">已选择: {{ selectedPath }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElNotification } from 'element-plus';
import apiClient from '../api';

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

const selectedPath = ref('');
const isLoading = ref(false);

async function selectFolder() {
  const path = await window.electronAPI.selectDirectory();
  if (path) {
    selectedPath.value = path;
    isLoading.value = true;
    try {
      const response = await apiClient.post('/config', { knowledge_base_path: path });
      if (response.data.success) {
        ElNotification({
          title: '成功',
          message: response.data.message || '索引任务已开始。',
          type: 'success',
        });
      } else {
        ElNotification({
          title: '警告',
          message: response.data.message || '索引任务失败。',
          type: 'warning',
        });
      }
    } catch (error) {
      ElNotification({
        title: '错误',
        message: '任务失败。',
        type: 'error',
      });
      console.error(error);
    } finally {
      isLoading.value = false;
    }
  }
}
</script>
