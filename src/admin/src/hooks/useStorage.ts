/**
 * 本地存储钩子
 * 提供对localStorage的封装，支持JSON对象的存储和读取
 */
const useStorage = () => {
  /**
   * 设置数据到localStorage
   * @param key 键名
   * @param value 值（可以是任何类型）
   */
  const setItem = (key: string, value: any): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('保存到localStorage失败', error);
    }
  };

  /**
   * 从localStorage获取数据
   * @param key 键名
   * @returns 解析后的数据，如果不存在或解析失败则返回null
   */
  const getItem = <T = any>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error('从localStorage读取失败', error);
      return null;
    }
  };

  /**
   * 从localStorage删除数据
   * @param key 键名
   */
  const removeItem = (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('从localStorage删除失败', error);
    }
  };

  /**
   * 清空localStorage
   */
  const clear = (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('清空localStorage失败', error);
    }
  };

  return {
    setItem,
    getItem,
    removeItem,
    clear
  };
};

export default useStorage; 