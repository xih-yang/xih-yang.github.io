# Sole之安装zookeeper可视化工具PrettyZoo、ZooKeeperAssistant
- 来源：https://ddkk.com/zhuanlan/search/solr/2/14.html
- 分类：搜索引擎
- 分组：Solr 实战 (A)
## 0. 引言

今天安装zookeeper的可视化工具遇到一些问题，将其记录下来，以供后续的同学参考，在mac软件安装上少走弯路。同时也让大家体会下这两款不同的zk可视化工具的差别

## 1. 安装PrettyZoo

**1、** 下载；

直接在[github](https://github.com/vran-dev/PrettyZoo/releases)上选择版本下载：

我这里因为是mac m1安装，选择的mac版本，如果是window系统可以选择win版本

github访问有问题的同学，可以直接在我网盘下载安装包

[网盘地址](https://pan.baidu.com/s/1UQAg-KRFY4aoi0QTT1DraA)

提取码: pv3t

**2、** 下载完成后双击安装；

**3、** 打开`prettyZoo`，这时可能会出现`prettyZoo已经损坏，无法打开`的提示；

**4、** 这是因为mac启用了新的安全机制，在`系统偏好设置->安全性与隐私->通用`中查看是否只有如图的两个选项；

**5、** 如果只有两个选项，那么打开`终端`窗口，输入指令，输入密码回车即可；

```bash
sudo spctl --master-disable
```

**6、** 再次打开，会发现已经设置为`任何来源`了，如果你上述有这个选项，那就直接选择即可；

**7、** 再次打开`prettyZoo`，提示是否打开，选择`打开`；

**8、** 打开成功；

**9、** 点击`new`新建一个连接，输入地址、端口，点击`save`保存即可；

**10、** 双击即可连接zk，然后就可以看到已经注册在zk上的服务了，比如我这里注册了一个userService服务；

## 2. 安装ZooKeeperAssistant

**1、** 下载安装包，这个软件的可视化做的要比PrettyZoo更好，但是它是收费的；

下载地址：[http://www.redisant.cn/za](http://www.redisant.cn/za)

**2、** 选择你需要的版本下载；

**3、** 点击后会跳转到[gitlab](https://gitee.com/chenjing9412/zookeeper-assistant-release/releases/tag/ZA-1.0.10.0-preview-2)下载，选择版本下载即可；

**4、** 下载后双击安装包安装，安装完成打开，输入地址、端口连接即可；

**5、** 其提供的界面个人感觉更加简单直接，可以清楚的在service栏看到注册的服务数；
