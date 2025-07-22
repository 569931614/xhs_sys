declare namespace API {
  // ... existing types ...

  // 通用响应类型
  interface Result<T> {
    code: number;
    message: string;
    data: T;
  }

  // 自定义页面
  interface CustomPage {
    id: number;
    title: string;
    path: string;
    type: number;
    icon: string;
    description: string;
    order: number;
    status: number;
    createTime: string;
    updateTime: string;
  }

  interface CustomPageListParams {
    page?: number;
    size?: number;
  }

  interface CustomPageListResult {
    code: number;
    message: string;
    data: {
      list: CustomPage[];
      total: number;
    };
  }

  interface CustomPageCreateParams {
    title: string;
    path: string;
    type?: number;
    icon?: string;
    description?: string;
    order?: number;
    status?: number;
  }

  type CustomPageUpdateParams = Partial<CustomPageCreateParams>;

  // ... other types ...
} 