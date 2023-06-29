import { AppDataSource } from "../../data-source"
import moment from "moment"

import utils from '../../utils'

import { Goods } from '../../models/Goods'
import { Order } from '../../models/Order'
import { Order_Item } from '../../models/Order_Item'

import OrderDTO from '../../dto/Order'

const orderRepo = AppDataSource.getRepository(Order)
const orderItemRepo = AppDataSource.getRepository(Order_Item)
const goodsRepo = AppDataSource.getRepository(Goods)

export default class CategoryController {
  async list (ctx) {
    const token = JSON.parse(ctx.cookies.get('token'))
    const orders = await orderRepo.findBy({ user_id: token.id })
    
    let orderList:any = []
    const format = 'YYYY-MM-DD hh:mm:ss'
    // 遍历数据库中的订单列表
    await Promise.all(orders.map(async (order:Order) => {
      const ois:any = await orderItemRepo.findBy({ order_id: order.id })

      let goodsList:any = []
      // 遍历数据库中的每个订单的订单项
      await Promise.all(ois.map(async (oi:Order_Item) => {
        const goods:any = await goodsRepo.findOneBy({ id: oi.goods_id })
        // 组装订单中的商品信息
        goodsList.push({
          ...goods,
          num: oi.num,
          amount: goods.price * Number(oi.num),
          created_at: moment(goods.created_at).format(format),
          updated_at: moment(goods.updated_at).format(format),
        })
      }))

      // 计算订单总金额
      let totalAmount = 0
      goodsList.map(goods => {
        totalAmount += goods.amount
      })

      // const orderDto:OrderDTO = {
      const orderDto = {
        ...order,
        id: String(order.id).padStart(10, '0'),
        goods: goodsList,
        bill: '元',
        totalAmount,
        created_at: moment(order.created_at).format(format),
        updated_at: moment(order.updated_at).format(format),
      }
      orderList.push(orderDto)
    }))

    orderList.sort((m, n) => n.id - m.id)
    
    ctx.body = utils.respond({ data: orderList })
  }
  
  async detail (ctx) {
  }
  
  async add (ctx) {
    const { goods_id, num } = ctx.request.body
    let token = ctx.cookies.get('token')
    if (token) {
      token = JSON.parse(token)
      const oi1 = await orderRepo.save({ user_id: token.id })
      const oi2 = await orderItemRepo.save({ goods_id, num, order_id: oi1.id })
      ctx.body = utils.respond({ data: oi2 })
    } else {
      ctx.body = utils.respond({ errMsg: 'need signin' })
    }
  }

  async update (ctx) {
    
  }

  async delete (ctx) {
    
  }
}