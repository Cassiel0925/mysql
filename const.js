const env = require('./env')

let dbHost
let dbUser
let dbPwd
if (env === 'dev') {
    dbHost = 'localhost'
    dbUser = 'root'
    dbPwd = '123456'
} else if (env === 'prod') {
    dbHost = '175.178.126.200'
    dbUser = 'root'
    dbPwd = 'Abcd123456.'
}

const category = [
    'novel',
    'literature',
    'philosophy',
    'art',
    'biography',
    'psychology',
    'prose',
    'caricature',
    'history',
    'science',
    'workplace',
    'youth',
    'drama'
]

module.exports = {
    category,
    dbHost,
    dbUser,
    dbPwd
}