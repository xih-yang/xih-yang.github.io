# 05、JMeter 实战 - JDBC Request
- 来源：https://ddkk.com/zhuanlan/tools/jmeter/2/5.html
- 分类：开发工具
- 分组：教程目录
jmeter中取样器（Sampler）是与服务器进行交互的单元。一个取样器通常进行三部分的工作：向服务器发送请求，记录服务器的响应数据和记录响应时间信息

有时候工作中我们需要对数据库发起请求或者对数据库施加压力，那么这时候就需要用到**JDBC Request**

JDBC Request可以向数据库发送一个请求（sql语句），一般它需要配合JDBC Connection Configuration配置元件一起使用

首先，还是先建立一个测试计划，添加线程组

为了方便，这里线程数我设置为1，然后在线程组上面右键单击选择配置元件→ **JDBC Connection Configuration（JDBC连接配置）**

JDBC Connection Configuration界面如下：

**Variable Name（变量名）：** 这里写入数据库连接池的名字

**Database URL：** 数据库连接地址

**JDBC Driver class：** 数据库驱动（可以将需要连接的数据库驱动jar包复制到jmeter的lib/目录下，然后在设置测试计划界面，最下面的Library中导入）

**Username：** 数据库登录名

**Password：** 数据库登陆密码

这里顺带说说不同数据库的驱动类和URL格式：

设置好JDBC连接配置后，添加JDBC请求，界面如下：

**Variable name：** 这里写入数据库连接池的名字（和JDBC Connection Configuration名字保持一致 ）

**Query：** 里面填入查询数据库数据的SQL语句（填写的SQL语句末尾不要加“；”）

**parameter valus：** 数据的参数值

**parameter types：** 数据的参数类型

**cariable names：** 保存SQL语句返回结果的变量名

**result cariable name：** 创建一个对象变量，保存所有返回结果

**query timeout：** 查询超时时间

**handle result set：** 定义如何处理由callable statements语句返回的结果

完成了上面的操作后，就可以添加监听器，来查看我们的请求是否成功了

这是请求内容，即SQL语句

这是响应数据，正确的显示了我查询的该表的对应字段的数据

jmeter这个工具还是蛮强大的，每个组件的作用都不同，不同组合的情况下，可以实现95％的性能测试的辅助工作。。。。。。
