#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import * as Timer from './lib/timer';
import * as Service from './lib/service';
import * as Cookie from './lib/cookie';


let config = null;
const __dirName = process.cwd();
const fileName = path.join(__dirName, "config.json");
try {
  if (!fs.existsSync(fileName)) {
    console.error('ERROR: 未找到相关配置文件');
  } else {
    config = JSON.parse(fs.readFileSync(fileName, 'utf-8'));
    console.log(chalk.green("--------------------config--------------------------"));
    console.log(config);
    console.log(chalk.green("----------------------------------------------"));
  }
} catch (error) {
  console.error(chalk.red('ERROR: 配置文件加载失败,请校验配置文件'));
}

init();

async function init() {
  await waitStatus();
  let userStatus = await waitUserStatus();
  if (userStatus.needLogin) {
    await waitLogin(config.pass);
    userStatus = await waitUserStatus();
  }
  if (userStatus.needSubmit) {
    await waitUploadImages();
    await waitSubmitOrder();
  }
}

async function waitStatus() {
  const retStatus = await Service.checkStatus();
  const arr = retStatus.split('$');
  if (arr[0] == 'False') {
    console.error(chalk.yellow(arr[2]));
    return Timer.sleep(3000).then(async () => {
      return await waitStatus();
    });
  } else {
    console.log('活动地址：' + arr[1]);
    return true;
  }
}

async function waitPass() {
  const result = await Service.sendPhoneCode({ idcard: config.idcard, phone: config.phone });
  if (result == "活动暂未开始") {
    console.error(chalk.red(result));
    process.exit();
  }
  return new Promise((resolve, reject) => {
    inquirer.prompt([
      {
        type: 'input',
        name: 'code',
        message: '请输入手机收到的验证码！'
      }
    ]).then((result) => {
      resolve(result.code);
    })
  })
}

async function waitLogin(pass) {
  let pwd = pass || await waitPass();
  const retlogin = await Service.login({ name: config.name, idcard: config.idcard, phone: config.phone, pass: pwd });
  console.log(retlogin)
  if (retlogin == "登录成功") return true;
  const isSend = await new Promise((resolve, reject) => {
    inquirer.prompt([
      {
        type: 'confirm',
        name: 'isSend',
        message: '是否重新发送密码？'
      }
    ]).then((result) => {
      resolve(result.isSend);
    })
  });
  if (isSend) {
    pwd = await waitPass();
  }
  return await waitLogin(pwd);
}

async function waitIsUpload() {
  return new Promise((resolve, reject) => {
    inquirer.prompt([
      {
        type: 'confirm',
        name: 'bool',
        message: '是否立即上传图片？'
      }
    ]).then((result) => {
      resolve(result.bool);
    })
  });
}
async function waitIsSubmit() {
  return new Promise((resolve, reject) => {
    inquirer.prompt([
      {
        type: 'confirm',
        name: 'bool',
        message: '是否立即提交资料？'
      }
    ]).then((result) => {
      resolve(result.bool);
    })
  });
}

async function waitUserStatus() {
  const result = {};
  const Datajson = await Service.getUserStatus();
  if (Datajson.result.statu != 'true') {
    result.needLogin = true;
    console.error(chalk.red("未登录客户"));
    return result;
  }
  if (Datajson.user.froomno != "") {
    console.log(chalk.green(`欢迎您！${Datajson.user.CustName}您成功预订的房源：${Datajson.user.froomno.replace('|', ' ')}`));
    result.needSubmit = true;
  } else {
    if (Datajson.user.fstatus == '1') {
      console.log(chalk.green('欢迎您！' + Datajson.user.CustName + ',您的资料审核中！'));
    } else if (Datajson.user.fstatus == '2') {
      console.log(chalk.green('欢迎您！' + Datajson.user.CustName + ',您的资料已经审核通过！'));
    } else if (Datajson.user.fstatus == '3') {
      console.log(chalk.yellow('欢迎您！' + Datajson.user.CustName + ',您的资料审核未通过！'));
    } else if (Datajson.user.fstatus == '4') {
      console.log(chalk.red('欢迎您！' + Datajson.user.CustName + ',您的帐号为无效帐号！'));
      result.needLogin = true;
    } else {
      result.needSubmit = true;
      console.log(chalk.green('欢迎您！' + Datajson.user.CustName));
    }
  }
  config.cookie = {
    custnamecookie: escape(Datajson.user.CustName),
    userphonecookie: escape(Datajson.user.userphone),
    zhiyeguwencookie: escape(Datajson.user.zhiyeguwen),
    ftypecookie: escape(Datajson.user.ftype),
    ftimescookie: escape(Datajson.user.ftimes),
    fstatus: escape(Datajson.user.fstatus)
  }
  console.log(config.cookie);
  Cookie.setCookieWithObject(config.cookie);
  return result;
}

async function waitUploadImages() {
  const arrays = [];
  (Object.keys(config.upload)).forEach(key => {
    const images = config.upload[key];
    if (images.length == 0) return false;
    return images.forEach((imgPath) => {
      arrays.push({ type: key, path: imgPath })
    });
  });
  if (arrays.length == 0) return false;
  const custfnocookie = Cookie.getCookie("custfnocookie") || config.cookie.custfnocookie;
  for (let item of arrays) {
    const ret = await Service.uploadFile({ fname: custfnocookie, ftype: item.type, filePath: item.path });
    console.log(JSON.stringify(ret));
  }
  //return Promise.all(arrays.map(item => Service.uploadFile({ fname: config.cookie.custfnocookie, ftype: item.type, filePath: item.path }).then(ret => JSON.stringify(ret))));
  return true;
}

async function waitSubmitOrder() {
  const data = {
    flm: config.form.flm,         //是否联名  【1:是 0:否】
    bdhk: config.form.bdhk,       //是否本地户口  【1:是 0:否】
    fcardno: config.idcard,       //证件号码
    fwcn: config.form.fwcn,       //是否有未成年子女 【1:是 0:否】
    fhyzk: config.form.fhyzk,     //婚姻状况 【1:未婚 2:离异 3:已婚 4:丧偶 】
    fkfs: config.form.fkfs,       //付款方式 【1:一次性 2:商贷 3:公积金 4:组合贷款 】
    ftj: 1
  };
  console.log(data)
  const retsult = await Service.submitOrder(data);
  console.log(retsult);
  return retsult;
} 