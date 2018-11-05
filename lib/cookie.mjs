import fs from 'fs';
import path from 'path';

const cookiePath = 'runtime/cookie.txt';

export function getLocalCookie() {
  if (!fs.existsSync(cookiePath)) return ""
  return String(fs.readFileSync(cookiePath, 'utf-8')).trim();
}

export function getCookieObject() {
  const cookies = getLocalCookie();
  const result = {};
  if (!cookies) return result;
  cookies.split("; ").forEach(item => {
    let arr = item.split("=");
    result[arr[0]] = arr[1];
  });
  return result;
}

export function getCookie(name) {
  const cookieObj = getCookieObject();
  return cookieObj[name];
}

export function setCookie(name, value = "") {
  const cookieObj = getCookieObject();
  cookieObj[name] = value;
  saveLocalCookie(cookieObj);
}

export function setCookieWithObject(cookieO = {}) {
  const cookieObj = Object.assign({}, getCookieObject(), cookieO);
  saveLocalCookie(cookieObj);
}
 

export function saveLocalCookie(cookieObj = {}) {
  const array = Object.keys(cookieObj).map(key => { return key + "=" + cookieObj[key] });
  fs.writeFileSync(cookiePath, array.join("; "), 'utf-8');
}
