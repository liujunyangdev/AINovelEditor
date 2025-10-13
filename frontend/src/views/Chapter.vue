<template>
  <div>
    <h1>章节生成</h1>
    <el-input
      v-model="description"
      :rows="4"
      type="textarea"
      placeholder="请输入章节的概要或关键情节"
    />
    <el-button @click="generate" :loading="isLoading" style="margin-top: 10px;">生成</el-button>
    <el-input
      v-model="result"
      :rows="10"
      type="textarea"
      placeholder="生成结果"
      readonly
      style="margin-top: 10px;"
    />
    <el-button @click="exportResult" :disabled="!result" style="margin-top: 10px;">导出为 TXT</el-button>
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
      saveFile: (content: string) => Promise<{ success: boolean; path?: string; error?: string }>;
      store: {
        get: (key: string) => Promise<any>;
        set: (key: string, val: any) => Promise<void>;
      };
    };
  }
}

const description = ref('');
const result = ref('');
const isLoading = ref(false);

async function generate() {
  if (!description.value) {
    ElNotification({
      title: '提示',
      message: '请输入描述内容。',
      type: 'warning',
    });
    return;
  }
  isLoading.value = true;
  result.value = '正在生成...';
  try {
    const response = await apiClient.post('/rag_generate', {
      query: `根据以下概要生成一个章节内容：${description.value}`
    });
    result.value = response.data.response;
    ElNotification({
      title: '成功',
      message: '生成成功。',
      type: 'success',
    });
  } catch (error) {
    result.value = '';
    ElNotification({
      title: '错误',
      message: '生成失败。',
      type: 'error',
    });
    console.error(error);
  } finally {
    isLoading.value = false;
  }
}

async function exportResult() {
  if (!result.value) {
    ElNotification({
      title: '提示',
      message: '没有可导出的内容。',
      type: 'warning',
    });
    return;
  }
  const saveResult = await window.electronAPI.saveFile(result.value);
  if (saveResult.success) {
    ElNotification({
      title: '成功',
      message: `文件已保存到: ${saveResult.path}`,
      type: 'success',
    });
  } else {
    ElNotification({
      title: '错误',
      message: `文件保存失败: ${saveResult.error}`, 
      type: 'error',
    });
  }
}
</script>
