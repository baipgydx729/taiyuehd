import ora from 'ora';
import axios from 'axios';
import moment from 'moment';
import * as Cookie from './cookie.mjs';
import defaultConfig from '../config.mjs';


// 创建axios实例
const service = axios.create({
  baseURL: defaultConfig.apiUrl,
  timeout: 60 * 1000 // 请求超时时间
});

// request拦截器
service.interceptors.request.use(config => {
  if (config.loading) {
    this.spinner = ora(`[${moment().format('YYYY-MM-DD HH:mm:ss SSS')}] ${config.loading}`);
    this.spinner.start();
  }
  config.headers['Origin'] = defaultConfig.apiUrl;
  // config.headers['Host'] = "ctzlsq.taiyuehd.net";
  config.headers['Accept'] = 'application/json, text/javascript, */*; q=0.01';
  config.headers['X-Requested-With'] = 'XMLHttpRequest';
  config.headers['User-Agent'] = 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15G77 MicroMessenger/6.7.1 NetType/WIFI';
  config.headers['Referer'] = defaultConfig.apiUrl + '/wap/sq.htm';
  config.headers['Cookie'] = Cookie.getLocalCookie();
  if (!defaultConfig.proxy) {
    config.proxy = defaultConfig.proxy;
  }
  return config;
}, error => {
  this.spinner && spinner.fail();
  console.error(error);
  Promise.reject(error);
});

// respone拦截器
service.interceptors.response.use(
  response => {
    this.spinner && this.spinner.succeed();
    const headers = response.headers["set-cookie"] || [];
    if (Array.isArray(headers) && headers.length > 0) {
      let arr, cookieObj = {};
      headers.forEach(item => {
        arr = item.split(";")[0].split("=");
        cookieObj[arr[0]] = arr[1];
      });
      Cookie.setCookieWithObject(cookieObj);
    }
    return response.data;
  },
  error => {
    this.spinner && spinner.fail();
    console.error('err' + error);
    return Promise.reject(error);
  }
);
export default service;
