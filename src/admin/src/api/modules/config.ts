import api from '../index';

interface KeyValue {
  configKey: string;
  configVal: any;
}

export default {
  queryAllConfig: () => api.get('config/queryAll'),
  queryConfig: (data: { keys: string[] }) => api.post('config/query', data),
  setConfig: (data: Record<string, any>) => api.post('config/set', data),
};
