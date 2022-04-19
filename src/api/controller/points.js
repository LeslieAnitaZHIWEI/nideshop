/**
 * @Author: ZHIWEI
 * @Description: points
 * @Date: 2022/4/15 14:56
 */
const Base = require('./base.js');
const moment = require('moment');

module.exports = class extends Base {
  async signInAction() {
    const hasRecord = await this.model('points_running').where({
      user_id: this.getLoginUserId(),
      operate_type: 1,
      operate_time: moment(new Date()).format('YYYY-MM-DD')
    }).find();

    if (!think.isEmpty(hasRecord)) {
      return this.fail({
        errmsg: '今日已打卡'
      });
    }

    const thisRecord = await this.model('points').where({user_id: this.getLoginUserId()}).find();

    let id;
    if (think.isEmpty(thisRecord)) {
      const info = {
        user_id: this.getLoginUserId(),
        points_total: 1
      };
      id = await this.model('points').add(info);
    } else {
      await this.model('points').where({user_id: thisRecord.user_id}).update({
        points_total: thisRecord.points_total + 1
      });
    }

    const record = {
      user_id: this.getLoginUserId(),
      operate_type: 1, // 1签到 2手动添加 3兑换
      operate_time: moment(new Date()).format('YYYY-MM-DD'),
      points_value: 1
    };

    await this.model('points_running').add(record);
    return this.success({
      msg: '打卡成功'
    });
  }

  async getBalanceAction() {
    const thisRecord = await this.model('points').where({user_id: this.getLoginUserId()}).find();
    if (think.isEmpty(thisRecord)) {
      const info = {
        user_id: this.getLoginUserId(),
        points_total: 0
      };
      await this.model('points').add(info);
      return this.success({
        balance: 0
      });
    } else {
      return this.success({
        balance: thisRecord.points_total
      });
    }
  }

  async exchangeAction() {
    const goodsId = this.get('id');
    const info = await this.model('goods').where({'id': goodsId}).find();
    const thisRecord = await this.model('points').where({user_id: this.getLoginUserId()}).find();
    if (thisRecord.points_total<info.points) {
      return this.fail({
        errmsg: '积分不足,无法兑换!'
      });
    } else {


      // 判断商品是否可以购买

      if (think.isEmpty(info) || info.is_delete === 1) {
        return this.fail(400, '商品已下架');
      }

      // 取得规格的信息,判断规格库存
      // const productInfo = await this.model('product').where({goods_id: goodsId, id: productId}).find();
      // if (think.isEmpty(productInfo) || productInfo.goods_number < 1) {
      //   return this.fail(400, '库存不足');
      // }

      // 判断购物车中是否存在此规格商品
      await this.model('cart_point').where({user_id: this.getLoginUserId()}).delete();

      // 添加规格名和值
      // let goodsSepcifitionValue = [];
      // if (!think.isEmpty(productInfo.goods_specification_ids)) {
      //   goodsSepcifitionValue = await this.model('goods_specification').where({
      //     goods_id: goodsId,
      //     id: {'in': productInfo.goods_specification_ids.split('_')}
      //   }).getField('value');
      // }

      // 添加到购物车
      const cartData = {
        goods_id: goodsId,
        product_id: '',
        goods_sn: '',
        goods_name: info.name,
        list_pic_url: info.list_pic_url,
        number: 1,
        session_id: 1,
        user_id: this.getLoginUserId(),
        retail_price: info.retail_price,
        market_price: info.retail_price,
        points: info.points,
        goods_specifition_name_value: '',
        goods_specifition_ids: '',
        checked: 1
      };

      await this.model('cart_point').add(cartData);

      return this.success({
        success: true
      });
    }
  }

  async exchangeTradingAction(){
    const thisRecord = await this.model('points').where({user_id: this.getLoginUserId()}).find();
    const cart=   await this.model('cart_point').where({user_id: this.getLoginUserId(), session_id: 1}).find();

    const addressId = this.post('addressId');
    const checkedAddress = await this.model('address').where({ id: addressId }).find();
    checkedAddress.province_name = await this.model('region').getRegionName(checkedAddress.province_id);
    checkedAddress.city_name = await this.model('region').getRegionName(checkedAddress.city_id);
    checkedAddress.district_name = await this.model('region').getRegionName(checkedAddress.district_id);
    checkedAddress.full_region = checkedAddress.province_name + checkedAddress.city_name + checkedAddress.district_name;
    let info='姓名:'+checkedAddress.name+' '+'手机号:'+checkedAddress.mobile+' '+'地址:'+checkedAddress.full_region+checkedAddress.address+' '+'商品名:'+cart.goods_name


    const record = {
      user_id: this.getLoginUserId(),
      operate_type: 3, // 1签到 2手动添加 3兑换
      operate_time: moment(new Date()).format('YYYY-MM-DD'),
      points_value: -cart.points,
      good_id:cart.goods_id
    };

    await this.model('points_running').add(record);
    await this.model('points').where({user_id: thisRecord.user_id}).update({
      points_total: thisRecord.points_total -cart.points
    });
    return this.success({
      msg:'兑换成功'
    })


  }
};
