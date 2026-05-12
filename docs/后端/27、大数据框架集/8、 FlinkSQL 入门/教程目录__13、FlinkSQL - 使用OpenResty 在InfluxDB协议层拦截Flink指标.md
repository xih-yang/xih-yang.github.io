# 13、FlinkSQL - 使用OpenResty 在InfluxDB协议层拦截Flink指标
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/3/13.html
- 分类：大数据框架
- 分组：教程目录
之前的一篇文章[【Flink系列】构建实时计算平台——特别篇，用InfluxDb收集Flink Metrics](/zhuanlan/bigdata/flink/3/3.html) ，里面写道

> Influxdb 1.8，100个作业的情况下， 内存占用峰值会超过20GB，这个时候容器会自动重启，客户端无法上报

现在又过了一年多，现在部署于K8s中的Influxdb占用内存经常超过90%，经过检查，发现有几个Flink作业，在修改InfluxDB Reporter之前就提交过了，仍然在大量上报指标。

说明解决方案还不够好。

## 目标

- 需要找到一种，可以不重启用户作业的方法，直接过滤指标。
- 因为Flink作业支持Prometheus的指标上报，使用InfluxDB仅收集Checkpoint类型的指标，所以需要过滤其他所有指标。

## 过程

大约6年前，早在大四的时候，有室友玩过OpenResty，其实就是Nginx™ + Lua™，那个时候便知道了这种技术。

*于是花了两个晚上，下班回家熬夜，再加上白天工作的时候，忙里抽空* 对着Lua 官方文档 + NginxLuaModule鼓捣出来了。

由于InfluxDb官方经常翻，便知道他的文档专门讲了协议，幸好是纯文本的协议。

HTTP报文如下：

```java
POST /write?db=var1&rp=retentionPolicy&precision=[h/m/s/ms/u/n]&consistency=
Header: BasicAuth
Content-Type: text/plain; charset=UTF-8
Body
<measurement>[,<tag_key>=<tag_value>[,<tag_key>=<tag_value>]] <field_key>=<field_value>[,<field_key>=<field_value>] [<timestamp>]
<measurement>[,<tag_key>=<tag_value>[,<tag_key>=<tag_value>]] <field_key>=<field_value>[,<field_key>=<field_value>] [<timestamp>]
<measurement>[,<tag_key>=<tag_value>[,<tag_key>=<tag_value>]] <field_key>=<field_value>[,<field_key>=<field_value>] [<timestamp>]
```

知道协议之后，就可以通过HTTP请求体来过滤 measurement，将不需要的指标全部删除。

## 方法

使用OpenResty的 access_by_lua 方法，访问读取请求体：

**不完全的代码**

```java
access_by_lua_block {
          ngx.req.read_body()
          local data = ngx.req.get_body_data()
          //...slankka...
          for s in data:gmatch("[^\r\n]+") do
              if string.find(s, "jobmanager_job_lastCheckpointExternalPath") then
                ngx.req.set_body_data(s)
                ngx.log(ngx.ERR, "Captured success:", s)
                break
              end
          end 
          //...slankka...    
        }
```

## 验证

## 方法一：可通过抓包的方式验证。

抓包的方法是，tcpdump 直接在InfluxDB所在的服务器进行抓包。

```java
tcpdump tcp -t -s 0  -c 100 port 8086 and src net 10.11.12.13 -w ./influxdb_slankka_traffic.cap
```

## 方法二：通过Influx 客户端 InfluxQueryLanguage语法

```java
show measurements on slankka;
//应该只看到这一个指标
jobmanager_job_lastCheckpointExternalPath
```

## 方法三：通过Influxdb厂家的Chronograf，直接连接到Influxdb进行查看

上一篇关于InfluxDB的文章[【Flink系列】构建实时计算平台——特别篇，用InfluxDb收集Flink Metrics](/zhuanlan/bigdata/flink/3/3.html)已经有Chronograf的安装说明，不再赘述。

## 总结

OpenResty 为终极优化方案，效果极为优异。

调试Lua，需要多看OpenResty官方文档，最终指标必须完全符合自己的Lua脚本逻辑，才算完成。

## 额外

本片文章 刚好可以作为下列问题的临时可靠解决方案

- [Improve influxdb reporter performance for kafka source/sink](https://issues.apache.org/jira/browse/FLINK-14537)
