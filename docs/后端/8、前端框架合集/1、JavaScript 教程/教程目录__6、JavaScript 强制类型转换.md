# 6、JavaScript 强制类型转换
- 来源：https://ddkk.com/zhuanlan/qianduan/javascript/1/6.html
- 分类：前端框架
- 分组：教程目录
Boolean（）：将其他的数据类型转化成布尔值

当传入的是数字类型的，除了0以外的其他数值都是true，0为false。非0即真

当传入的是字符串，非空 ( ’ ') 即真

当传入的是undifined，null，NaN都为false

Number（）：将其他的数据类型转成数字

parseInt（）:

**1、** 取整；

**2、** 将别的进制转成十进制，必须传入字符串；

进制之间转换可以看我另外一篇的文章([https://blog.csdn.net/weixin_44730244/article/details/116880640](/zhuanlan/qianduan/javascript/4.html))

二进制、八进制、十六进制转十进制

当然也可以不用字符串和进制数表示

二进制在js用 0b开头表示二进制，

八进制在js用 0开头表示八进制，

十六进制在js用 0x开头表示十六进制进制，

parseFloat（）：取浮点数
