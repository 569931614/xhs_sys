import { defineStore } from 'pinia';
import { useChatStore } from '../chat';

import { fetchGetInfo } from '@/api';
import { fetchGetBalanceQueryAPI } from '@/api/balance';
import { fetchQueryConfigAPI } from '@/api/config';
import type { ResData } from '@/api/types';
import { store } from '@/store';
import type { AuthState, GlobalConfig, UserBalance } from './helper';
import { getToken, removeToken, setToken } from './helper';

export const useAuthStore = defineStore('auth-store', {
  state: (): AuthState => ({
    token: getToken(),
    loginDialog: false,
    globalConfigLoading: true,
    userInfo: {},
    userBalance: {},
    globalConfig: {} as GlobalConfig,
    loadInit: false,
  }),

  getters: {
    isLogin: (state: AuthState) => !!state.token,
  },

  actions: {
    async getUserInfo(): Promise<T> {
      try {
        if (!this.loadInit) await this.getglobalConfig();

        const res = await fetchGetInfo();
        if (!res) return Promise.resolve(res);
        const { data } = res;
        const { userInfo, userBalance } = data;
        this.userInfo = { ...userInfo };
        this.userBalance = { ...userBalance };
        return Promise.resolve(data);
      } catch (error) {
        return Promise.reject(error);
      }
    },

    updateUserBalance(userBalance: UserBalance) {
      this.userBalance = userBalance;
    },

    async getUserBalance() {
      const res: ResData = await fetchGetBalanceQueryAPI();
      const { success, data } = res;
      if (success) this.userBalance = data;
    },

    async getglobalConfig(domain = '') {
      const res = await fetchQueryConfigAPI({ domain });
      this.globalConfig = res.data;
      this.globalConfigLoading = false;
      this.loadInit = true;
    },

    setToken(token: string) {
      this.token = token;
      setToken(token);
    },

    removeToken() {
      this.token = undefined;
      removeToken();
    },

    setLoginDialog(bool: boolean) {
      this.loginDialog = bool;
    },

    async loginSuccess(token: string) {
      // 设置token
      this.setToken(token);
      // 关闭登录对话框
      this.setLoginDialog(false);
      // 获取用户信息
      await this.getUserInfo();
      // 显示成功提示
      if (window.$message) {
        window.$message.success('登录成功');
      }
    },

    logOut() {
      this.token = undefined;
      removeToken();
      this.userInfo = {};
      this.userBalance = {};
      const chatStore = useChatStore();
      chatStore.clearChat();
      // 移除页面刷新，改为状态重置
      // window.location.reload();
      
      // 提示用户已登出
      if (window.$message) {
        window.$message.success('已安全登出');
      }
      
      // 如果需要，可以在这里重定向到首页
      // const router = useRouter()
      // router.push('/');
    },

    updatePasswordSuccess() {
      this.token = undefined;
      removeToken();
      this.userInfo = {};
      this.userBalance = {};
      this.loginDialog = true;
    },
  },
});

export function useAuthStoreWithout() {
  return useAuthStore(store);
}
