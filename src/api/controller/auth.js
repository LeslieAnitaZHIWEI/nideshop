const Base = require('./base.js');

module.exports = class extends Base {
  async loginByWeixinAction() {
    const code = this.post('code');
    const fullUserInfo = this.post('userInfo');
    const clientIp = this.ctx.ip;

    // 解释用户数据
    const { errno, errmsg, data: userInfo } = await this.service('weixin', 'api').login(code, fullUserInfo);
    if (errno !== 0) {
      return this.fail(errno, errmsg);
    }

    // 根据openid查找用户是否已经注册
    let userId = await this.model('user').where({ weixin_openid: userInfo.openId }).getField('id', true);
    if (think.isEmpty(userId)) {
      // 注册
      userId = await this.model('user').add({
        username: '微信用户' + think.uuid(6),
        password: '',
        register_time: parseInt(new Date().getTime() / 1000),
        register_ip: clientIp,
        mobile: '',
        weixin_openid: userInfo.openId,
        avatar: userInfo.avatarUrl || '',
        gender: userInfo.gender || 1, // 性别 0：未知、1：男、2：女
        nickname: userInfo.nickName
      });
    }

    // 查询用户信息
    const newUserInfo = await this.model('user').field(['id', 'username', 'nickname', 'gender', 'avatar', 'birthday']).where({ id: userId }).find();

    // 更新登录信息
    await this.model('user').where({ id: userId }).update({
      last_login_time: parseInt(new Date().getTime() / 1000),
      last_login_ip: clientIp
    });

    const TokenSerivce = this.service('token', 'api');
    const sessionKey = await TokenSerivce.create({ user_id: userId });

    if (think.isEmpty(sessionKey)) {
      return this.fail('生成 token 失败');
    }

    return this.success({ token: sessionKey, userInfo: newUserInfo });
  }


  async loginByPhoneAction() {
    const phone = this.post('phone');
    const clientIp = this.ctx.ip;



    // 根据openid查找用户是否已经注册
    let userId = await this.model('user').where({ mobile: phone }).getField('id', true);
    if (think.isEmpty(userId)) {
      // 注册
      userId = await this.model('user').add({
        username: '微信用户' + think.uuid(6),
        password: '',
        register_time: parseInt(new Date().getTime() / 1000),
        register_ip: clientIp,
        mobile: phone,
        weixin_openid: '',
        avatar: '',
        gender: '', // 性别 0：未知、1：男、2：女
        nickname: ''
      });

      const info = {
        user_id: this.getLoginUserId(),
        points_total: 0
      };
      await this.model('points').add(info);
    }

    // 查询用户信息
    const newUserInfo = await this.model('user').field(['id', 'username', 'nickname', 'gender', 'avatar', 'mobile']).where({ id: userId }).find();

    // 更新登录信息
    await this.model('user').where({ id: userId }).update({
      last_login_time: parseInt(new Date().getTime() / 1000),
      last_login_ip: clientIp
    });

    const TokenSerivce = this.service('token', 'api');
    const sessionKey = await TokenSerivce.create({ user_id: userId });

    if (think.isEmpty(sessionKey)) {
      return this.fail('生成 token 失败');
    }

    return this.success({ token: sessionKey, userInfo: newUserInfo });
  }

  async getPhoneAction(){
    const code = this.post('code');
    const token = await this.service('weixin', 'api').getToken();
    const {access_token} =JSON.parse(token)
    const phoneJson = await this.service('weixin', 'api').getPhone(code,access_token);
    return this.success(JSON.parse(phoneJson));
  }

  async logoutAction() {
    return this.success();
  }
};
