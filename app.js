//导入mysql模块
// const models = require('./db')
const mysql = require('mysql');
const express = require('express')
const app = express()
const constant = require('./const')

const jwt = require('jsonwebtoken')
const secret = 'jksfnkejf'

// 解决跨域
const cors = require('cors')
app.use(cors())

//创建连接

function connect() {
    return mysql.createConnection({
        host: constant.dbHost,
        user: constant.dbUser,
        password: constant.dbPwd,
        database: 'bookinfo'
    })
}

//  推荐你可能会喜欢的书
function createGuessYouLike(data) {
    const n = parseInt(randomArray(1, 3)) + 1
    data['type'] = n
    switch (n) {
        case 1:
            data['result'] = data.id % 2 === 0 ? '《明朝那些事儿》' : '《杀死一只知更鸟》'
            break
        case 2:
            data['result'] = data.id % 2 === 0 ? '《白鹿原》' : '《长安的荔枝》'
            break
        case 3:
            data['result'] = '《万历十五年》'
            data['percent'] = data.id % 2 === 0 ? '92%' : '97%'
            break
    }
    return data
}

// 推荐
function createRecommendData(data) {
    data['readers'] = Math.floor(data.id / 2 * randomArray(1, 100))
    return data
}

function createCategoryIds(n) {
    const arr = []
    constant.category.forEach((item, index) => {
        arr.push(index + 1)
    })
    const result = []
    for (let i = 0; i < n; i++) {
        // 获取的随机数不能重复
        const ran = Math.floor(Math.random() * (arr.length - i))
            // 获取分类对应的序号
        result.push(arr[ran])
            // 将已经获取的随机数取代，用最后一位数
        arr[ran] = arr[arr.length - i - 1]
    }
    return result
}

function createCategoryData(data) {
    const categoryIds = createCategoryIds(6)
    const result = []
    categoryIds.forEach(categoryId => {
        const subList = data.filter(item => item.category === categoryId).slice(0, 4)
        subList.map(item => {
            return handleData(item)
        })
        result.push({
            category: categoryId,
            list: subList
        })
    })
    return result.filter(item => item.list.length === 4)
}

// 随机数 n 选几本书 l 一共有几本书
function randomArray(n, l) {
    let rnd = []
    for (let i = 0; i < n; i++) {
        rnd.push(Math.floor(Math.random() * l))
    }
    return rnd
}


function createData(results, key) {
    return handleData(results[key])
}

function handleData(data) {
    data['selected'] = false
    data['private'] = false
    data['cache'] = false
    data['haveRead'] = 0
    return data
}

//  首页数据
app.get('/book/home', (req, res) => {
    const conn = connect()
    conn.query('select * from book where cover != \'\'',
        (err, results) => {
            console.log(results);
            const length = results.length
            const guessYouLike = []
            const banner = [
                'https://pic51.photophoto.cn/20190510/0017029523724254_b.jpg',
                'https://scpic.chinaz.net/files/pic/psd1/201803/psd26261.jpg',
                'https://tse2-mm.cn.bing.net/th/id/OIP-C.o35Ao0QVEiFO9sLRX4O7_wHaEa?pid=ImgDet&rs=1',
            ]
            const recommend = []
            const featured = []
            const random = []
            const categoryList = createCategoryData(results)
            randomArray(9, length).forEach(key => {
                guessYouLike.push(createGuessYouLike(createData(results, key)))
            })
            randomArray(3, length).forEach(key => {
                recommend.push(createRecommendData(createData(results, key)))
            })
            randomArray(6, length).forEach(key => {
                featured.push(createData(results, key))
            })
            randomArray(1, length).forEach(key => {
                random.push(createData(results, key))
            })
            res.json({
                    guessYouLike,
                    banner,
                    recommend,
                    featured,
                    random,
                    categoryList,
                })
                // 关闭数据库
            conn.end()
        })

})

//  详情数据
app.get('/book/detail', (req, res) => {
    const conn = connect()
    const fileName = req.query.fileName
    const sql = `select * from book where fileName='${fileName}'`
    conn.query(sql, (err, results) => {
        if (err) {
            res.json({
                error_code: 1,
                msg: '电子书详情获取失败'
            })
        } else {
            if (results && results.length === 0) {
                res.json({
                    error_code: 1,
                    msg: '电子书详情获取失败'
                })
            } else {
                const book = handleData(results[0])
                res.json({
                    error_code: 0,
                    msg: '获取成功',
                    data: book
                })
            }
        }
        conn.end()
    })
})

app.get('/book/list', (req, res) => {
    const conn = connect()
    conn.query('select * from book where cover!=\'\'',
        (err, results) => {
            if (err) {
                res.json({
                    error_code: 1,
                    msg: '获取失败'
                })
            } else {
                results.map(item => handleData(item))
                const data = {}
                constant.category.forEach(categoryText => {
                    data[categoryText] = results.filter(item => item.categoryText === categoryText)
                })
                res.json({
                    error_code: 0,
                    msg: '获取成功',
                    data: data,
                    total: results.length
                })
            }
            conn.end()
        })
})

app.get('/book/flat-list', (req, res) => {
    const conn = connect()
    conn.query('select * from book where cover!=\'\'',
        (err, results) => {
            if (err) {
                res.json({
                    error_code: 1,
                    msg: '获取失败'
                })
            } else {
                results.map(item => handleData(item))
                res.json({
                    error_code: 0,
                    msg: '获取成功',
                    data: results,
                    total: results.length
                })
            }
            conn.end()
        })
})

app.get('/book/categories', (req, res) => {
    const conn = connect()
    conn.query('select * from category',
        (err, results) => {
            if (err) {
                res.json({
                    error_code: 1,
                    msg: '获取失败'
                })
            } else {
                res.json({
                    error_code: 0,
                    msg: '获取成功',
                    data: results,
                    total: results.length
                })
            }
            conn.end()
        })
})

app.get('/book/shelf', (req, res) => {
    res.json({
        bookList: []
    })
})

app.post('/login', (req, res) => {
    const conn = connect()
    const phone = req.query.phone
    const password = req.query.password
    const user_form = { 'phone': this.phone, 'password': this.password }
    const sql = `select * from user where mobile='${phone}' and password='${password}'`
    conn.query(sql, (err, results) => {
        if (err) {
            res.json({
                error_code: 1,
                msg: '用户信息获取失败'
            })
        } else {
            if (results && results.length === 0) {
                res.json({
                    error_code: 1,
                    msg: '用户未注册'
                })
            } else {
                const token = jwt.sign(user_form, secret, { expiresIn: 60 * 60 * 24 })
                res.json({
                    error_code: 0,
                    msg: '获取成功',
                    token: token,
                    data: results
                })
            }
        }
        conn.end()
    })
})


app.post('/addUser', (req, res) => {
    const conn = connect()
    const username = req.query.username
    const mobile = req.query.mobile
    const enrollPassword = req.query.enrollPassword
    const userForm = { 'mobile': mobile, 'password': enrollPassword }
    const sql = "insert into user (username, password, mobile) values ('" + username + "','" + enrollPassword + "','" + mobile + "')"
    conn.query(sql, (err, results) => {
        if (err) {
            res.json({
                error_code: 1,
                msg: '手机已被注册过'
            })
        } else {
            const token = jwt.sign(userForm, secret, { expiresIn: 60 * 60 * 24 })
            res.json({
                error_code: 0,
                msg: '注册成功',
                token: token,
                data: username
            })
        }
        // if (results) {
        //     jsonWrite(res, results);
        // }
        conn.end()
    })
})


const server = app.listen(3300, '0.0.0.0', () => {
    const host = server.address().address
    const port = server.address().port

    console.log('server is listening at http://%s:%s', host, port)
})