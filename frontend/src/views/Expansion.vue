<template>
  <div>
    <h1>剧情扩写</h1>
    <el-row :gutter="20">
      <el-col :span="12">
        <h3>上下文</h3>
        <el-input v-model="context.worldview" :rows="4" type="textarea" placeholder="世界观/背景设定"></el-input>
        <el-input v-model="context.outline" :rows="4" type="textarea" placeholder="故事大纲" style="margin-top: 10px;"></el-input>
        <el-input v-model="context.previousChapters" :rows="4" type="textarea" placeholder="前文章节内容" style="margin-top: 10px;"></el-input>
        <el-input v-model="context.currentPlot" :rows="4" type="textarea" placeholder="当前情节/要扩写的内容" style="margin-top: 10px;"></el-input>
      </el-col>
      <el-col :span="12">
        <h3>生成结果</h3>
        <el-input v-model="result" :rows="22" type="textarea" placeholder="生成结果" readonly></el-input>
      </el-col>
    </el-row>
    <el-button @click="generate" :loading="isLoading" style="margin-top: 10px;">扩写</el-button>
    <el-button @click="exportResult" :disabled="!result" style="margin-top: 10px;">导出为 TXT</el-button>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
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

const context = reactive({
  worldview: '',
  outline: '',
  previousChapters: '',
  currentPlot: '',
});
const result = ref('');
const isLoading = ref(false);

async function generate() {
  if (!context.currentPlot) {
    ElNotification({
      title: '提示',
      message: '请输入当前情节/要扩写的内容。',
      type: 'warning',
    });
    return;
  }
  isLoading.value = true;
  result.value = '正在生成...';

  const fullQuery = `
    请根据以下上下文，扩写当前情节：

    世界观/背景设定:
    ${context.worldview || '无'}

    故事大纲:
    ${context.outline || '无'}

    前文章节内容:
    ${context.previousChapters || '无'}

    当前情节/要扩写的内容:
    ${context.currentPlot}
  `;

  try {
    const response = await apiClient.post('/rag_generate', {
      query: fullQuery
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
