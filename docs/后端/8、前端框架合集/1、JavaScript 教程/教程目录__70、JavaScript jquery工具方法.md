# 70、JavaScript jquery工具方法
- 来源：https://ddkk.com/zhuanlan/qianduan/javascript/1/70.html
- 分类：前端框架
- 分组：教程目录
JQ的工具方法和我们自己封装的js方法没有区别。

jq方法调用$().xxx() 必须是JQ对象调用

jq工具方法调用 $.xxx() 与普通封装的js方法没区别

.t y p e ( ) 输 出 当 前 数 据 的 数 据 类 型 功 能 类 似 于 t y p e o f 但 是 .type() 输出当前数据的数据类型 功能类似于typeof 但是 .type()输出当前数据的数据类型功能类似于typeof但是.type（）更加的完善。

$.trim() 删除字符串首尾空格 功能类似于 ECM5删除首尾空格 .trim（）

参数：需要删除空格的字符串

$.inArray() 获取数据下标 功能类似于ECM5 indexOf

第一参数：需要查询的数据

第二参数：查询的对象

$.proxy() 功能类似于bind

第一参数：需要改变this指向的函数

第二参数：this指向的对象

返回值：返回改变this指向之后的函数

$.noConflict() 起别名

当我们定义的一个变量名与我们的 一 致 时 ， 就 会 造 成 后 续 的 j Q u e r y 方 法 调 用 就 会 报 错 。 ! [ 在 这 里 插 入 图 片 描 述 ] ( h t t p s : / / i m g − b l o g . c s d n i m g . c n / 20210624102232848. p n g ? x − o s s − p r o c e s s = i m a g e / w a t e r m a r k , t y p e Z m F u Z 3 p o Z W 5 n a G V p d G k , s h a d o w 1 0 , t e x t a H R 0 c H M 6 L y 9 i b G 9 n L m N z Z G 4 u b m V 0 L 3 d l a X h p b l 80 N D c z M D I 0 N A = = , s i z e 1 6 , c o l o r F F F F F F , t 7 0 ) 因 此 需 要 将 一致时，就会造成后续的jQuery方法调用就会报错。 ![在这里插入图片描述](https://img-blog.csdnimg.cn/20210624102232848.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3dlaXhpbl80NDczMDI0NA==,size_16,color_FFFFFF,t_70) 因此需要将 一致时，就会造成后续的jQuery方法调用就会报错。![在这里插入图片描述](https://img−blog.csdnimg.cn/20210624102232848.png?x−oss−process=image/watermark,typeZmFuZ3poZW5naGVpdGk,shadow10,textaHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3dlaXhpbl80NDczMDI0NA==,size16,colorFFFFFF,t70)因此需要将进行换一个别名，后续的jQuery的方法可以使用这个别名调用。

不过我觉得你有这个功夫起别名，还不如不要设置同名，省时间。。。。

$.parseJSON() JSON.parse()

参数：数据结构

$.makeArray 将伪数组转成数组，Array.from（）

参数：伪数组

伪数组：元素集合，set，map，arguments…都是伪数组
