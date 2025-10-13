<template>
  <el-container style="height: 100vh;">
    <el-aside width="200px">
      <el-menu :default-active="$route.path" router>
        <el-menu-item index="/character">人物</el-menu-item>
        <el-menu-item index="/outline">大纲</el-menu-item>
        <el-menu-item index="/chapter">章节</el-menu-item>
        <el-menu-item index="/expansion">扩写</el-menu-item>
        <el-menu-item index="/knowledge-base">知识库</el-menu-item>
        <el-menu-item index="/settings">设置</el-menu-item>
      </el-menu>
      <div style="padding: 20px;">
        AI Server: {{ aiServerStatus }}
      </div>
    </el-aside>
    <el-main>
      <router-view></router-view>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import apiClient from './api';

const aiServerStatus = ref('Connecting...');

onMounted(async () => {
  try {
    const response = await apiClient.get('/health');
    if (response.data.status === 'ok') {
      aiServerStatus.value = 'Connected';
    } else {
      aiServerStatus.value = 'Not Connected';
    }
  } catch (error) {
    aiServerStatus.value = 'Not Connected';
  }
});
</script>

<style>
body {
  margin: 0;
}
</style>
