# 17、JavaScript 严格模式
- 来源：https://ddkk.com/zhuanlan/qianduan/javascript/1/17.html
- 分类：前端框架
- 分组：教程目录
除了正常运行模式，ES5添加l第二种运行模式：‘严格模式’

写在哪个作用域下，就在那个作用域下生效。

格式：‘use strict’

注：尽量不要把严格模式写在全局作用域下。

### 严格模式目的：

**1、** 消除Javascript语法的一些不合理不严谨之处，减少一些怪异行为；

**2、** 消除代码运行的一些不安全之处，保证代码运行的安全；

**3、** 提高编译器效率，增加运行速度；

**4、** 为未来新版本的Javascript做好铺垫；

### 使用严格模式，主要变化：

**1、** 全局变量声明时，必须加var；

普通模式：

严格模式：

**2、** this无法指向全局对象；

普通模式：

严格模式：

**3、** 函数内重名属性；

普通模式：

严格模式：

**4、** arguments对象不允许被动态改变；

普通模式：

严格模式：

**5、** 新增保留字：implements，interface，let，package，private，protected，public，static，yield；

正常模式：

严格模式：
