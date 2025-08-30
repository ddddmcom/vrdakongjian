// 简单的Express服务器用于API模拟
const express = require('express')
const cors = require('cors')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())
app.use(express.static('dist'))

// 模拟数据存储
let shops = [
  {
    id: 1,
    name: '体验店A',
    address: '北京市朝阳区xxx街道123号',
    contact: '张三',
    phone: '13800138001',
    adminAccount: 'shop001',
    adminPassword: '123456',
    authStartTime: '2024-01-01T00:00:00.000Z',
    authEndTime: '2024-12-31T23:59:59.000Z',
    shareAmount: 500,
    shareRatio: null,
    suggestedPrice: 20,
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z'
  }
]

let contents = [
  {
    id: 1,
    title: 'VR冒险游戏',
    description: '刺激的冒险体验，包含多个精彩关卡',
    totalLevels: 10,
    totalDuration: 120,
    price: 20.00,
    createdAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 2,
    title: '太空探索',
    description: '探索神秘的宇宙空间',
    totalLevels: 8,
    totalDuration: 90,
    price: 18.00,
    createdAt: '2024-01-01T00:00:00.000Z'
  }
]

let devices = [
  {
    id: 1,
    deviceCode: 'A001',
    shopId: 1,
    status: 'online',
    currentContentId: null,
    currentLevel: 0,
    lastActiveTime: new Date().toISOString()
  }
]

let users = [
  {
    id: 1,
    username: 'admin',
    password: '123456',
    role: 'admin',
    shopId: null,
    shopName: null
  },
  {
    id: 2,
    username: 'shop001',
    password: '123456',
    role: 'shop',
    shopId: 1,
    shopName: '体验店A'
  }
]

// 认证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({ code: 401, message: '未授权访问' })
  }
  
  // 简单的token验证（实际项目中应使用JWT）
  const user = users.find(u => u.username === token)
  if (!user) {
    return res.status(401).json({ code: 401, message: '无效token' })
  }
  
  req.user = user
  next()
}

// 登录接口
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body
  
  const user = users.find(u => u.username === username && u.password === password)
  
  if (user) {
    res.json({
      code: 200,
      message: '登录成功',
      data: {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          shopId: user.shopId,
          shopName: user.shopName
        },
        token: user.username // 简化的token
      }
    })
  } else {
    res.json({
      code: 400,
      message: '用户名或密码错误'
    })
  }
})

// 获取店铺列表
app.get('/api/shops', authenticateToken, (req, res) => {
  const page = parseInt(req.query.page) || 1
  const size = parseInt(req.query.size) || 10
  
  const start = (page - 1) * size
  const end = start + size
  
  res.json({
    code: 200,
    data: {
      list: shops.slice(start, end),
      total: shops.length
    }
  })
})

// 创建店铺
app.post('/api/shops', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ code: 403, message: '权限不足' })
  }
  
  const newShop = {
    id: shops.length + 1,
    ...req.body,
    createdAt: new Date().toISOString()
  }
  
  shops.push(newShop)
  
  // 创建店铺管理员账户
  const newUser = {
    id: users.length + 1,
    username: req.body.adminAccount,
    password: req.body.adminPassword,
    role: 'shop',
    shopId: newShop.id,
    shopName: newShop.name
  }
  users.push(newUser)
  
  res.json({
    code: 200,
    data: newShop
  })
})

// 更新店铺
app.put('/api/shops/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ code: 403, message: '权限不足' })
  }
  
  const id = parseInt(req.params.id)
  const shopIndex = shops.findIndex(s => s.id === id)
  
  if (shopIndex === -1) {
    return res.status(404).json({ code: 404, message: '店铺不存在' })
  }
  
  shops[shopIndex] = { ...shops[shopIndex], ...req.body }
  
  res.json({
    code: 200,
    data: shops[shopIndex]
  })
})

// 获取内容列表
app.get('/api/content', authenticateToken, (req, res) => {
  const page = parseInt(req.query.page) || 1
  const size = parseInt(req.query.size) || 10
  
  const start = (page - 1) * size
  const end = start + size
  
  res.json({
    code: 200,
    data: {
      list: contents.slice(start, end),
      total: contents.length
    }
  })
})

// 创建内容
app.post('/api/content', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ code: 403, message: '权限不足' })
  }
  
  const newContent = {
    id: contents.length + 1,
    ...req.body,
    createdAt: new Date().toISOString()
  }
  
  contents.push(newContent)
  
  res.json({
    code: 200,
    data: newContent
  })
})

// 获取店铺设备
app.get('/api/shops/:shopId/devices', authenticateToken, (req, res) => {
  const shopId = parseInt(req.params.shopId)
  const shopDevices = devices.filter(d => d.shopId === shopId)
  
  res.json({
    code: 200,
    data: shopDevices
  })
})

// 设备控制
app.post('/api/devices/:id/control', authenticateToken, (req, res) => {
  const deviceId = parseInt(req.params.id)
  const { action, contentId } = req.body
  
  const device = devices.find(d => d.id === deviceId)
  if (!device) {
    return res.status(404).json({ code: 404, message: '设备不存在' })
  }
  
  switch (action) {
    case 'play':
      device.status = 'playing'
      if (contentId) {
        device.currentContentId = contentId
        device.currentLevel = 1
      }
      break
    case 'pause':
      device.status = 'paused'
      break
    case 'stop':
      device.status = 'online'
      device.currentContentId = null
      device.currentLevel = 0
      break
  }
  
  device.lastActiveTime = new Date().toISOString()
  
  res.json({
    code: 200,
    message: '操作成功'
  })
})

// 静态文件服务
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`VR管理系统服务器运行在端口 ${PORT}`)
  console.log(`访问地址: http://localhost:${PORT}`)
})

module.exports = app