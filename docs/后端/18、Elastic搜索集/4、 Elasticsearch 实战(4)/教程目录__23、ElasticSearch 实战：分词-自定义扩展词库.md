# 23、ElasticSearch 实战：分词-自定义扩展词库
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/4/23.html
- 分类：搜索引擎
- 分组：教程目录
> 接第22节

#### 3）、自定义词库

ik分词器默认的分词并不能满足我们的需求，对于一些新的网络用语，ik 分词器就会无法准确的进行分词识别，比如：

```java
POST _analyze
{
  "analyzer": "ik_max_word",
  "text": "乔碧萝殿下"
}
```

分词之后显示为如下，可以看到 ik 分词器无法识别出“乔碧萝”是一个人名：

所以，需要进行自定义拓展词库。

要自定义拓展词库，可以修改 ik 分词器的配置文件，指定一个远程词库，让 ik 分词器向远程发送请求，要到一些最新的单词，这样最新的单词就会作为最新的词源进行分解。

自定义词库有两种方式实现：

**1、** 自己实现一个服务，处理ik分词器的请求，让ik分词器的给自定义的项目发送请求；

**2、** 搭建一个nginx服务器，将最新词库放到nginx中，让ik分词器给nginx发送请求，由nginx给ik分词器返回最新的词库，这样ik分词器就可以将原来的词库和新词库合并起来；

> nginx 安装参考 六、附录-安装nginx

在这里我使用第二种方式来自定义词库，创建前需要先安装 nginx， 请访问[第六章](https://blog.csdn.net/runewbie/article/details/106462125)有关内容。

在`/mydata/nginx/html/` 路径下新建一个 `es` 目录，并新建一个词库 `fenci.txt`：

访问[http://192.168.56.10/es/fenci.txt](http://192.168.56.10/es/fenci.txt)，可以请求的词库的内容：

修改`/usr/share/elasticsearch/plugins/ik/config/` 中的 `IKAnalyzer.cfg.xml`

`/usr/share/elasticsearch/plugins/ik/config`

```java
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">
<properties>
        <comment>IK Analyzer 扩展配置</comment>
        <!--用户可以在这里配置自己的扩展字典 -->
        <entry key="ext_dict"></entry>
         <!--用户可以在这里配置自己的扩展停止词字典-->
        <entry key="ext_stopwords"></entry>
        <!--用户可以在这里配置远程扩展字典 -->
        <entry key="remote_ext_dict">http://192.168.56.10/es/fenci.txt</entry>
        <!--用户可以在这里配置远程扩展停止词字典-->
        <!-- <entry key="remote_ext_stopwords">words_location</entry> -->
</properties>
```

> 注意：如果打开 IKAnalyzer.cfg.xml 为乱码的话，可以在先退出当前文件，在命令行输入 vi /etc/virc，
>
> 然后在文件添加 set encoding=utf-8，保存退出，重新打开 IKAnalyzer.cfg.xml 即可。

`原来的xml`：

```java
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">
<properties>
        <comment>IK Analyzer 扩展配置</comment>
        <!--用户可以在这里配置自己的扩展字典 -->
        <entry key="ext_dict"></entry>
         <!--用户可以在这里配置自己的扩展停止词字典-->
        <entry key="ext_stopwords"></entry>
        <!--用户可以在这里配置远程扩展字典 -->
        <!-- <entry key="remote_ext_dict">words_location</entry> -->
        <!--用户可以在这里配置远程扩展停止词字典-->
        <!-- <entry key="remote_ext_stopwords">words_location</entry> -->
</properties>
```

`重启ES` ：

```java
docker restart elasticsearch 
```

重新在kibana 中进行分词，可以看到之前无法识别的“乔碧萝”现在已经可以识别为一个单词了：

如果我们以后还有新的词组，直接在上面的自定义词库`fenci.txt`中进行添加，并重启 ES 即可。

> 由于之前在安装 nginx 时重装了 ES，所以需要设置一下 ES 的自动启动服务：
>
> docker update elasticsearch --restart=always

> 参考文档-analysis
