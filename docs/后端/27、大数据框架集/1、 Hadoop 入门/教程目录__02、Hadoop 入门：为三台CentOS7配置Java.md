# 02、Hadoop 入门：为三台CentOS7配置Java
- 来源：https://ddkk.com/zhuanlan/bigdata/hadoop/1/2.html
- 分类：大数据框架
- 分组：教程目录
## 操作前说明

机器准备

- 版本：CentOS 7
- 三台机器ip：192.168.77.110； 192.168.77.110 ； 192.168.77.110；
- 三台机器名：node001； node002； node003；
- 要求：三台机器能相互ping通，三台机器能正常使用ssh

用户准备

- 用户：hadoop
- 密码：123456
- 目录准备
- 要求：hadoop的权限下
- 目录一：/sjj/soft
- 目录二：/sjj/install

## 一、获取jdk

[官网获取](https://www.oracle.com/java/technologies/downloads/)

## 二、终端传输

### 1-Mac上操作（win下可以用软件传输比如xshell之类的

`scp /xxx/xxx/……/jdk-8u321-linux-x64.tar hadoop@192.168.77.110:/sjj/soft`

- 注意
- Mac中文件拖入终端即可显示文件路径
- hadoop@192.168.77.110 表示传输到我的第一台机器以hadoop用户
- :/sjj/soft表示传输到机器的指定目录

### 2-node001操作

- 先看一下是否传输过去了

`cd/sjj/soft`

`ls`

- 接着解压文件到/sjj/install

`tar -xvf jdk-8u321-linux-x64.tar -C /sjj/install/`

**如果是tar.gz文件将-xvf换成-xzvf**

- 再看是否解压成功

`cd/sjj/install`

`ls`

## 三、配置java环境

- 输入
- `sudo vim /etc/profile`
- 输入密码
- 上键+G跳转到最后一行
- o新开一行
- 添加代码

```java
# Java环境配置
export JAVA_HOME=/sjj/install/jdk1.8.0_321
export PATH=$PATH:$JAVA_HOME/bin
```

按esc退出，输入:wq保存退出

- 让配置生效

`source /etc/profile`

- 查看配置是否成功

`java -version`

## 四，为其余两台机器配置

- 现在第一台机器已经有jdk了，可以通过第一台机器传输给其余两台机器（当然你也可以上面过程再走两遍

**1、** 将jdk传输给两台机器；

`cd /sjj/install`

`scp -r jdk1.8.0_321/ node002:$PWD`

`scp -r jdk1.8.0_321/ node003:$PWD`

#### 注意！！！上面的代码需要在node001的/sjj/install文件夹下操作

#### $PWD表示和当前目录一样的位置

**1、** 现在配置Java环境和之间一样了，请查看三操作；
