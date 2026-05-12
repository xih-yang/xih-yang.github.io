# 31、MongoDB 状态检测 ( mongostat )
- 来源：https://ddkk.com/zhuanlan/db/mongodb/31.html
- 分类：缓存数据库
- 分组：教程目录
我们安装部署并启动 MongoDB 服务后，必须要了解 MongoDB 的运行情况，并查看 MongoDB 的性能

这样在流量比较大的是可以很好的应对并保证 MongoDB 持续正常运作

MongoDB 中提供了 mongostat 和 mongotop 两个命令来监控 MongoDB 的运行情况

## mongostat 命令

mongostat 是 MongoDB 自带的状态检测工具，在命令行下使用

mogostat 命令会间隔固定时间获取 MongoDB 的当前运行状态，并输出

如果你发现数据库突然变慢或者有其他问题的话，首先要做的操作就考虑采用 mongostat 来查看 mongo 的状态

### 语法

MongoDB mongostat 脚本命令语法格式如下

```sh
$ mongostat <options> <polling interval in seconds>
```

### 范例

```sh
$ mongostat
```

输出结果如下

```sh
$ mongostat
insert query update delete getmore command flushes mapped vsize   res faults qrw arw net_in net_out conn                time
    *0    *0     *0     *0       0     2|0       0        6.49G 18.0M      0 0|0 0|0   160b   24.5k    2 Oct 24 07:56:41.321
    *0    *0     *0     *0       0     2|0       0        6.49G 18.0M      0 0|0 0|0   158b   24.1k    2 Oct 24 07:56:42.317
    *0    *0     *0     *0       0     1|0       0        6.49G 18.0M      0 0|0 0|0   157b   24.0k    2 Oct 24 07:56:43.319
    *0    *0     *0     *0       0     2|0       0        6.49G 18.0M      0 0|0 0|0   158b   24.1k    2 Oct 24 07:56:44.317
```
