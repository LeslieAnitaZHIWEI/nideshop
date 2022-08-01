const mysql = require('think-model-mysql');

module.exports = {
  handle: mysql,
  database: 'nideshop',
  prefix: 'nideshop_',
  encoding: 'utf8mb4',
  // host: '127.0.0.1', //正式
  host: '47.100.21.119', // 测试
  port: '3306',
  // user: 'root',
  // password: 'Zhejiaju1+',
  user: 'zhejia',
  password: 'Tw2Rq7yIF5dYqdi1Bhe%NaAWqR9yNF6d',
  dateStrings: true
};
