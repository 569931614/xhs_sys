/**
 * 消息提示工具
 */
export const message = {
  /**
   * 成功消息
   * @param content 消息内容
   */
  success: (content: string) => {
    console.log(`成功: ${content}`);
    // 在这里可以实现更复杂的消息提示，例如使用toast组件
  },

  /**
   * 错误消息
   * @param content 消息内容
   */
  error: (content: string) => {
    console.error(`错误: ${content}`);
    // 在这里可以实现更复杂的消息提示，例如使用toast组件
  },

  /**
   * 警告消息
   * @param content 消息内容
   */
  warning: (content: string) => {
    console.warn(`警告: ${content}`);
    // 在这里可以实现更复杂的消息提示，例如使用toast组件
  },

  /**
   * 信息消息
   * @param content 消息内容
   */
  info: (content: string) => {
    console.info(`信息: ${content}`);
    // 在这里可以实现更复杂的消息提示，例如使用toast组件
  }
}; 