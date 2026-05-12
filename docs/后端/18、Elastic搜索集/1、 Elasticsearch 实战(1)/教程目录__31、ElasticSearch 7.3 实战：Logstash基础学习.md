# 31、ElasticSearch 7.3 实战：Logstash基础学习
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/1/31.html
- 分类：搜索引擎
- 分组：教程目录
### 一、Logstash基本介绍

Logstash 是一个功能强大的工具，可与各种部署集成。 它提供了大量插件，可帮助你解析，丰富，转换和缓冲来自各种来源的数据（文件、数据库......）。logstash简单来说就是一个**数据抽取工具**，将数据从一个地方转移到另一个地方。

Logstash 是 Elastic 栈非常重要的一部分，但是它不仅仅为 Elasticsearch 所使用。它可以介绍广泛的各种数据源。Logstash 可以帮利用它自己的`Filter`帮我们对数据进行解析，丰富，转换等。最后，它可以把自己的数据输出到各种需要的数据储存地（redis、kafaka等等），这其中一般主要就是Elasticsearch。

### 二、windows下安装

在windows下安装及其简单，下载zip包解压即可。

注意：如果要推送的数据到es，那么一定要和es的`版本相同`

下载地址：[https://www.elastic.co/cn/downloads/logstash](https://www.elastic.co/cn/downloads/logstash)

### 三、配置文件

logstash之所以功能强大和流行，与其丰富的过滤器插件是分不开的，过滤器提供的并不单单是过滤的功能，还可以对进入过滤器的原始数据进行复杂的逻辑处理，甚至添加独特的事件到后续流程中。

Logstash配置文件有如下三部分组成，其中input、output部分是必须配置，filter部分是可选配置，而filter就是过滤器插件，可以在这部分实现各种日志过滤功能。

```java
input {
   输入插件
}
filter {
   过滤匹配插件
}
output {
   输出插件
}
```

### 四、启动logstash

找到`logstash.bat`文件的目录，打开控制台。

为了好维护，下面这种写法一般不推荐。

```java
logstash.bat -e 'input{stdin{}} output{stdout{}}'
```

在config目录下面新建文件`test1.conf`，并将下方内容写入。意思是将控制台输入的内容输出到控制台

注意：内容的格式不能乱，缩进等等，若内容没问题的话，启动不起来一般都是格式的问题

```java
input{
    stdin{
    }
}
output {
    stdout{
        codec=>rubydebug    
    }
}
```

运行上方命令，时间较长稍微等一下

```java
logstash.bat -f ../config/test1.conf
```

启动成功界面如下

接下来在控制台输入`hello world`，返回结果如下

返回结果解析

- message：输出的结果
- host：主机名
- @version：版本号
- @timestamp：当前时间戳
