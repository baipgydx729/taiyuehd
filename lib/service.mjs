import fs from 'fs';
import FormData from 'form-data';
import request from './request.mjs'; 
 
export async function checkStatus() {
  return request({
    loading: "正在检查系统状态...",
    withCredentials: true,
    url: '/ajax.aspx',
    method: 'get',
    params: {
      type: "getIsRun",
      t: +new Date()
    },
    validateStatus: function (status) {
      return status >= 200 && status < 303;
    },
  });
};

export async function login({ name, idcard, phone, pass }) {
  return request({
    loading: "正在登陆系统...",
    url: '/ajax.aspx',
    method: 'get',
    params: {
      type: "CustLoginFst",
      txtFname: name,
      idcard: escape(idcard),
      phone: escape(phone),
      userpwd: escape(pass),
      t: +new Date()
    },
    validateStatus: function (status) {
      return status >= 200 && status < 303;
    },
  });
};

export async function sendPhoneCode({ idcard, phone, pass = '' }) {
  return request({
    loading: `正在发送手机验证码[${phone}]...`,
    withCredentials: true,
    url: '/ajax.aspx',
    method: 'get',
    params: {
      type: "getYZMTy",
      idcard: escape(idcard),
      phone: escape(phone),
      userpwd: escape(pass),
      t: +new Date()
    },
    validateStatus: function (status) {
      return status >= 200 && status < 303;
    },
  });
};

export async function getUserStatus() {
  return request({
    loading: `正在获取用户状态信息...`,
    withCredentials: true,
    url: '/ajax.aspx',
    method: 'get',
    params: {
      Type: "getCustLoginStatus",
      t: +new Date()
    },
    validateStatus: function (status) {
      return status >= 200 && status < 303;
    },
  });
}

export async function uploadFile({ fname, ftype, filePath }) {
  const imageData = fs.readFileSync(filePath);
  const formData = new FormData();
  formData.append('file', imageData, { filepath: filePath, contentType: 'image/jpg' });
  return request({
    loading: `正在上传[${ftype}]文件...\r\n`,
    withCredentials: true, //跨域请求时是否需要使用凭证
    url: `/Management/UploadFile.aspx?fname=${escape(fname)}&ftype=${escape(ftype)}&t=${+new Date()}`,
    method: 'post',
    headers: formData.getHeaders(),
    data: formData,
    validateStatus: function (status) {
      return status >= 200 && status < 303;
    },
    responseType: 'json',
  });
};

export async function submitOrder({ flm, bdhk, fcardno, fwcn, fhyzk, fkfs, ftj = 1 }) {
  return request({
    loading: "正在提交注册资料...",
    url: '/ajax.aspx',
    method: 'get',
    params: {
      type: "SQTJ",
      flm, bdhk, fcardno, fwcn, fhyzk, fkfs, ftj,
      t: +new Date()
    },
    validateStatus: function (status) {
      return status >= 200 && status < 303;
    },
  });
};
