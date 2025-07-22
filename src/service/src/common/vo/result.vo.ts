export class Result {
  static success(data: any = null, message: string = 'success'): ResultObj {
    return {
      success: true,
      code: 200,
      message,
      data,
    };
  }

  static fail(message: string = 'fail', code: number = 400, data: any = null): ResultObj {
    return {
      success: false,
      code,
      message,
      data,
    };
  }
}

export interface ResultObj {
  success: boolean;
  code: number;
  message: string;
  data: any;
} 