<script lang="ts" setup>
import {
  fetchCaptchaImg,
  fetchGetInfo,
  fetchLoginAPI,
  fetchLoginWithCaptchaAPI,
  fetchRegisterAPI,
  fetchSendCode,
} from '@/api';
import { fetchRegisterWithInviteAPI } from '@/api/invitation';
import { useBasicLayout } from '@/hooks/useBasicLayout';
import { t } from '@/locales';
import { useAuthStore, useGlobalStoreWithOut } from '@/store';
import type { FormInst, FormItemRule, FormRules, MessageApiInjection } from 'naive-ui';
import { NForm, useMessage } from 'naive-ui';
import { computed, ref, onMounted } from 'vue';
import Vcode from "./SliderCaptcha.vue";
import { useRouter } from 'vue-router';
import { fetchSendContactCodeAPI } from '@/api/contact';

interface Emit {
  (ev: 'changeLoginType', val: string): void;
}
const emit = defineEmits<Emit>();
const formRef = ref<FormInst | null>(null);
const Nmessage = useMessage();
const isLogin = ref(true);
const loading = ref(false);
const authStore = useAuthStore();
const lastSendPhoneCodeTime = ref(0);
const siteName = authStore.globalConfig.siteName;
const { isMobile } = useBasicLayout();
const isCaptchaLogin = ref(false);
const isShow = ref(false);
const useGlobalStore = useGlobalStoreWithOut();
const globalConfig = computed(() => authStore.globalConfig);

const registerForm = ref({
  // username: '',
  password: '',
  contact: '',
  captchaId: null,
  code: '',
  inviteCode: '',
});

const loginForm = ref({
  username: '',
  password: '',
  contact: '',
});

const rules = {
  username: [
    { required: true, message: t('login.enterUsername'), trigger: 'blur' },
    {
      min: 2,
      max: 30,
      message: t('login.usernameLength'),
      trigger: 'blur',
    },
  ],
  password: [
    { required: true, message: t('login.enterPassword'), trigger: 'blur' },
    {
      min: 6,
      max: 30,
      message: t('login.passwordLength'),
      trigger: 'blur',
    },
  ],
  email: [
    { required: true, message: t('login.enterEmail'), trigger: 'blur' },
    {
      type: 'email',
      message: t('login.emailValid'),
      trigger: ['blur', 'change'],
    },
  ],
};

const wechatRegisterStatus = computed(
  () => Number(authStore.globalConfig.wechatRegisterStatus) === 1
);
const phoneLoginStatus = computed(
  () => Number(authStore.globalConfig.phoneLoginStatus) === 1
);

const noVerifyRegister = computed(
  () => Number(authStore.globalConfig.noVerifyRegister) === 1
);

const emailLoginStatus = computed(
  () => Number(authStore.globalConfig.emailLoginStatus) === 1
);

// 使用 ref 来管理全局参数的状态
const agreedToUserAgreement = ref(true); // 读取初始状态并转换为布尔类型

// 点击"用户协议及隐私政策"时，自动同意
function handleClick() {
  agreedToUserAgreement.value = true; // 设置为同意
  // useGlobalStore.updateNoticeDialog(true); // 假设你有一个类似的状态管理方法，用于显示对话框或进行其他操作
  useGlobalStore.updateUserAgreementDialog(true); // 假设你有一个类似的状态管理方法，用于显示对话框或进行其他操作
  // console.log('User agreed to User Agreement:', ss.get('agreedToUserAgreement'));
}

const loginTypeText = computed(() => {
  if (emailLoginStatus.value && phoneLoginStatus.value) {
    return t('login.emailPhone');
  } else if (emailLoginStatus.value) {
    return t('login.email');
  } else if (phoneLoginStatus.value) {
    return t('login.phone');
  }
});

const loginEnterType = computed(() => {
  if (emailLoginStatus.value && phoneLoginStatus.value) {
    return t('login.enterEmailOrPhone');
  } else if (emailLoginStatus.value) {
    return t('login.enterEmail');
  } else if (phoneLoginStatus.value) {
    return t('login.enterPhone');
  }
});



//  定时器改变倒计时时间方法
function changeLastSendPhoneCodeTime() {
  if (lastSendPhoneCodeTime.value > 0) {
    setTimeout(() => {
      lastSendPhoneCodeTime.value--;
      changeLastSendPhoneCodeTime();
    }, 1000);
  }
}

/* 发送验证码 */
async function handleSendCaptcha() {
  isShow.value = false;
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      try {
        const {  contact,  captchaId } =
          registerForm.value;

        // const isEmail = /\S+@\S+\.\S+/.test(contact);
        // const isPhone = /^\d{10,}$/.test(contact);
        const params: any = {  contact,  captchaId };
        let res: any;
        res = await fetchSendCode(params);
        const { success, message } = res;
        if (success) {
          Nmessage.success(res.data);
          // isSendCaptcha.value = true;
          // 记录重新发送倒计时
          lastSendPhoneCodeTime.value = 60;
          changeLastSendPhoneCodeTime();
        } else {
          // isSendCaptcha.value = false;
          Nmessage.error(message);
        }
      } catch (error) {
      }
    }
  });
}

/* 获取URL中的邀请码参数 */
function getInviteCodeFromUrl() {
  // 检查URL中的查询参数
  const urlSearchParams = new URLSearchParams(window.location.search);
  let inviteCode = urlSearchParams.get('invite');
  
  // 如果没有找到，检查hash路由中的参数
  if (!inviteCode && window.location.hash) {
    // 从 #/chat?invite=xxx 格式中提取
    const hashParts = window.location.hash.split('?');
    if (hashParts.length > 1) {
      const hashParams = new URLSearchParams(hashParts[1]);
      inviteCode = hashParams.get('invite');
    }
  }
  
  if (inviteCode) {
    console.log('从URL中获取到邀请码:', inviteCode);
    registerForm.value.inviteCode = inviteCode;
  }
}

// 页面加载时获取邀请码
onMounted(() => {
  getInviteCodeFromUrl();
});

/* 注册登录 */
function handlerSubmit() {
    if (agreedToUserAgreement.value === false&&globalConfig.value.isAutoOpenAgreement === '1') {
    return Nmessage.error(`请阅读并同意《${globalConfig.value.agreementTitle}》`);
  }
  
  console.log('handlerSubmit被调用，当前登录状态:', isLogin.value ? '登录' : '注册');
  
  try {
    if (!isLogin.value) {
      // 注册流程
      console.log('注册流程，准备验证表单');
      if (!registerForm.value.contact) {
        console.log('联系方式为空');
        return Nmessage.error('请输入联系方式');
      }
      
      if (!registerForm.value.password) {
        console.log('密码为空');
        return Nmessage.error('请输入密码');
      }
      
      if (!noVerifyRegister.value && !registerForm.value.code) {
        console.log('验证码为空');
        return Nmessage.error('请输入验证码');
      }
      
      console.log('注册表单验证通过，开始提交');
      submitRegisterForm();
    } else {
      // 登录流程，先检查必填字段
      if (!loginForm.value.username) {
        console.log('用户名/联系方式为空');
        return Nmessage.error('请输入用户名/联系方式');
      }
      
      if (!loginForm.value.password) {
        console.log('密码为空');
        return Nmessage.error('请输入密码');
      }
      
      console.log('登录表单验证通过，开始提交');
      directFetchLogin();
    }
  } catch (error) {
    console.error('表单验证过程出错:', error);
    Nmessage.error('表单验证出错，请重试');
  }
}

// 使用直接fetch方式登录
async function directFetchLogin() {
  try {
    console.log('使用fetch API直接发送登录请求');
    loading.value = true;
    
    const params = {
      username: loginForm.value.username,
      password: loginForm.value.password
    };
    
    console.log('登录请求参数:', JSON.stringify(params));
    
    // 使用API函数登录
    const res: any = await fetchLoginAPI(params);
    console.log('登录响应:', res);
    
    if (res.success) {
      // 登录成功
      console.log('登录成功');
      // 使用新的loginSuccess方法，避免页面刷新
      await authStore.loginSuccess(res.data);
    } else {
      console.error('登录失败:', res.message);
      Nmessage.error(res.message || '登录失败');
    }
  } catch (error: any) {
    console.error('登录请求错误:', error);
    Nmessage.error('登录失败: ' + (error.message || '网络错误'));
  } finally {
    loading.value = false;
  }
}

// 提交注册表单
async function submitRegisterForm() {
  try {
    console.log('开始提交注册表单');
    loading.value = true;
    
    // 创建准确匹配API定义的参数对象
    const params = {
      username: registerForm.value.contact || '', 
      password: registerForm.value.password || '', 
      contact: registerForm.value.contact || '', 
      code: registerForm.value.code || '',
      inviteCode: registerForm.value.inviteCode || ''
    };
    console.log('注册请求参数:', JSON.stringify(params));
    
    let res: any;
    
    // 如果有邀请码，使用带邀请码的注册接口
    if (params.inviteCode) {
      res = await fetchRegisterWithInviteAPI(params);
    } else {
      res = await fetchRegisterAPI(params);
    }
    
    console.log('注册响应:', res);

    const { success, message } = res;
    if (!success) {
      console.error('注册失败:', message);
      return Nmessage.error(message || '注册失败');
    }
    
    console.log('注册成功');
    Nmessage.success(t('login.registrationSuccess'));
    
    // 保存当前用户输入的凭据
    const { contact, password } = registerForm.value;
    loginForm.value.username = contact;
    loginForm.value.password = password;
    
    // 切换到登录页
    isLogin.value = true;
  } catch (error: any) {
    console.error('注册过程发生错误:', error);
    Nmessage.error(error?.message || '注册失败，请稍后重试');
  } finally {
    loading.value = false;
  }
}

</script>

<template>
  <div class="flex w-full flex-col h-full justify-center " :class="isMobile ? 'px-5 py-5' : 'px-10 py-5'">
    <NForm v-if="!isLogin&& !isCaptchaLogin" ref="formRef" :model="registerForm" :rules="rules" label-placement="left" label-width="auto"
      require-mark-placement="right-hanging">
      <div class="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 class="mb-8 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900 dark:text-gray-300">
          {{ siteName }} {{ t('login.registerTitle') }}
        </h2>
      </div>
        <div class="mt-4  flex">
        <input id="username" type="text" v-model="registerForm.contact"
          :placeholder="t('login.enterContact') + loginTypeText"
          class="flex-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm dark:text-gray-300 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-300 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:focus:ring-gray-400" />

      </div>

      <div v-if="!noVerifyRegister" class="mt-4  relative">
        <input id="username" type="text" v-model="registerForm.code" :placeholder="t('login.enterCode')"

          class="block w-full rounded-md border-0 py-2 px-2 text-gray-900 shadow-sm dark:text-gray-300 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-300 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:focus:ring-gray-400 pl-3 pr-12" />
          <button block
        v-if="!noVerifyRegister"
          class="absolute right-0 top-1/2 transform -translate-y-1/2 flex justify-center rounded-r-md bg-primary-500 px-3 py-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-primary-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          :disabled="loading" :loading="loading" @click="isShow = true">
          {{ t('login.sendVerificationCode') }}
        </button>
      </div>

      <div class="rounded-lg ">
    <Vcode :show="isShow" @success="handleSendCaptcha()" @close="isShow = false"  class="bg-red-500" />

  </div>

      <div class="mt-4 ">
        <input id="username" type="password" v-model="registerForm.password" :placeholder="t('login.enterPassword')"
          class="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm dark:text-gray-300 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-300 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:focus:ring-gray-400" />
      </div>

      <div class="mt-4 ">
        <input id="inviteCode" type="text" v-model="registerForm.inviteCode" placeholder="请输入邀请码(选填)"
          class="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm dark:text-gray-300 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-300 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:focus:ring-gray-400" />
      </div>

      <div v-if="globalConfig.isAutoOpenAgreement === '1'" class="flex items-center justify-between my-3">
        <div class="flex items-center">
          <input
            v-model="agreedToUserAgreement"
            type="checkbox"
            class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"

          />
          <p class="ml-1 text-center text-sm text-gray-500 dark:text-gray-400">
            已阅读并同意
            <a
              href="#"
              class="font-semibold leading-6 text-primary-600 hover:text-primary-500 dark:text-primary-500 dark:hover:text-primary-600"
              @click="handleClick"
              >《{{globalConfig.agreementTitle}}》</a
            >
          </p>
        </div>
      </div>

      <div>
        <button @click="handlerSubmit" type="submit"
          class="flex w-full my-5 justify-center rounded-md bg-primary-500 px-3 py-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-primary-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
          {{ t('login.registerAccount') }}
        </button>
      </div>

      <p v-if="emailLoginStatus || phoneLoginStatus"
        class=" text-center text-sm text-gray-500 dark:text-gray-400">
        {{ t('login.alreadyHaveAccount') }}
        <a href="#"
          class="font-semibold leading-6 text-primary-600 hover:text-primary-500 dark:text-primary-500 dark:hover:text-primary-600"
          @click="isLogin = !isLogin">{{ t('login.goToLogin') }}</a>
      </p>
    </NForm>

    <!-- login -->
    <NForm v-if="isLogin && !isCaptchaLogin" size="large" ref="formRef" :model="loginForm" :rules="rules" label-placement="left"
      label-width="auto" require-mark-placement="right-hanging">
      <div class="mb-8 sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 class=" text-center text-2xl font-bold leading-9 tracking-tight text-gray-900 dark:text-gray-300">
          {{ siteName }} 登录
        </h2>
      </div>


      <div class="mt-4 ">
        <label for="username" class="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300">{{
          loginTypeText }}</label>
        <div class="mt-2">
          <input id="username" type="text" v-model="loginForm.username" :placeholder="loginEnterType"
            class="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm dark:text-gray-300 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-300 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:focus:ring-gray-400" />
        </div>
      </div>

      <!-- 密码 输入框 -->
      <div class="mt-4 ">
        <!-- 使用flex布局将标签和忘记密码链接放在同一行 -->
        <div class="mt-2">
                  <label for="username" class="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300">{{
          t('login.password') }}</label>
          <input id="password" type="password" v-model="loginForm.password" :placeholder="t('login.enterYourPassword')"
            class="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm dark:text-gray-300 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-300 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:focus:ring-gray-400" />
        </div>
      </div>

      <div class="flex items-center justify-between my-3">
              <div v-if="globalConfig.isAutoOpenAgreement === '1'" class="flex items-center justify-between my-3">
        <div class="flex items-center">
          <input
            v-model="agreedToUserAgreement"
            type="checkbox"
            class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"

          />
          <p class="ml-1 text-center text-sm text-gray-500 dark:text-gray-400">
            已阅读并同意
            <a
              href="#"
              class="font-semibold leading-6 text-primary-600 hover:text-primary-500 dark:text-primary-500 dark:hover:text-primary-600"
              @click="handleClick"
              >《{{globalConfig.agreementTitle}}》</a
            >
          </p>
        </div>
      </div>
        <!-- <div class="flex items-center">
          <input id="remember-me" name="remember-me" type="checkbox"
            class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" />
          <label for="remember-me" class="ml-3 block text-sm leading-6 text-gray-500 dark:text-gray-400">{{
            t('login.rememberAccount') }}</label>
        </div> -->

        <!-- <div class="text-sm leading-6">
          <a href="#" class="font-semibold text-gray-500 hover:text-indigo-500 dark:text-gray-400" @click="isCaptchaLogin = !isCaptchaLogin">{{
            t('login.forgotPassword') }}</a>
        </div> -->
      </div>

      <div>
        <button @click="handlerSubmit" type="submit"
          class="flex w-full my-5 justify-center rounded-md bg-primary-500 px-3 py-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-primary-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
          {{ t('login.loginAccount') }}
        </button>
      </div>

      <p v-if="emailLoginStatus || phoneLoginStatus"
        class=" text-center text-sm text-gray-500 dark:text-gray-400">
        {{ t('login.noAccount') }}
        <a href="#"
          class="font-semibold leading-6 text-primary-600 hover:text-primary-500 dark:text-primary-500 dark:hover:text-primary-600"
          @click="isLogin = !isLogin">
          {{ t('login.register') }}</a>
      <div v-if="wechatRegisterStatus">
        {{ t('login.orUse')
        }}<a href="#"
          class="font-semibold leading-6 text-primary-600 hover:text-primary-500 dark:text-primary-500 dark:hover:text-primary-600"
          @click="emit('changeLoginType', 'wechat')">
          {{ t('login.scanLogin') }}
        </a>
      </div>

      </p>
    </NForm>

    <!-- forget passwd-->
    <NForm v-if="isCaptchaLogin" ref="formRef" :model="registerForm" :rules="rules" label-placement="left" label-width="auto"
      require-mark-placement="right-hanging">
      <div class="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 class="mb-8 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900 dark:text-gray-300">
         验证码登录
        </h2>
      </div>

        <div class="mt-4  relative">
        <input id="username" type="text" v-model="registerForm.contact"
          :placeholder="t('login.enterContact') + loginTypeText"
          class="block w-full rounded-md border-0 py-2 px-2 text-gray-900 shadow-sm dark:text-gray-300 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-300 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:focus:ring-gray-400 pl-3 pr-12" />
        <button block

          class="absolute right-0 top-1/2 transform -translate-y-1/2 flex justify-center rounded-r-md bg-primary-500 px-2 py-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-primary-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          :disabled="loading" :loading="loading" @click="handleSendCaptcha">
          {{ t('login.sendVerificationCode') }}
        </button>
      </div>


      <div  class="mt-4  flex">
        <input id="username" type="text" v-model="registerForm.code" :placeholder="t('login.enterCode')"
          class="flex-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm dark:text-gray-300 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-300 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:focus:ring-gray-400" />
      </div>



      <div>
        <button @click="handlerSubmit" type="submit"
          class="flex w-full my-5 justify-center rounded-md bg-primary-500 px-3 py-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-primary-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
          验证码登录
        </button>
      </div>

      <p v-if="emailLoginStatus || phoneLoginStatus"
        class="mt-0 mb-5 text-center text-sm text-gray-500 dark:text-gray-400">
         继续使用密码登录？
        <a href="#"
          class="font-semibold leading-6 text-primary-600 hover:text-primary-500 dark:text-primary-500 dark:hover:text-primary-600"
          @click="isCaptchaLogin = !isCaptchaLogin">返回</a>
      </p>
    </NForm>
  </div>


</template>
