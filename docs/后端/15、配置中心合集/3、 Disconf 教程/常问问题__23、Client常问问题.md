# 23、Client常问问题
- 来源：https://ddkk.com/zhuanlan/config/disconf/23.html
- 分类：配置中心
- 分组：常问问题
## 2.1. 异常: ERROR c.b.d.c.c.processor.impl.DisconfCoreProcessUtils - Spring Context is null. Cannot autowire com.szzjcs.commons.thirdapi.push.config.JpushConfig

**可能原因：**

- 程序没有使用spring环境
- `` 放在 disconfMgrBean 定义的后面
- 对于版本2.6.28（包括此版本）之前的版本， component-scan 可能没有扫描 com.baidu.disconf

**解决办法：**

- 非静态配置 必须使用spring环境
- `` 必须出现在disconfMgrBean之前
- 对于版本2.6.28（包括此版本）之前的版本，必须使 component-scan 增加扫描项 com.baidu.disconf

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://disconf.readthedocs.io/zh_CN/latest/index.html
