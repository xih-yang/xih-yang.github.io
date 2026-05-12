# 12、实现一个配置更新下载器agent
- 来源：https://ddkk.com/zhuanlan/config/disconf/12.html
- 分类：配置中心
- 分组：客户端
## 9.1. 问题

我想在我的机器上做一个配置下载器agent, 可以实现以下功能：

- 启动时下载配置
- 配置被更新时，可以感知并下载下来

## 9.2. 解决方法

可以修改一下 disconf-demos/disconf-standalone-demo 这个项目，让其变成一个 长驻进程，并指定

disconf.user_define_download_dir 这个配置到你想指定的路径。

done.

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://disconf.readthedocs.io/zh_CN/latest/index.html
