# 06、Solr：实现从mysql定时自动同步数据
- 来源：https://ddkk.com/zhuanlan/search/solr/2/6.html
- 分类：搜索引擎
- 分组：Solr 实战 (A)
## 0. 引言

上一章节我们讲解了从msyql同步数据到solr，但是我们每次同步都需要在solr-admin中点击同步按钮，这在生产环境中肯定是不可行的，那么solr是否支持自动化同步了，答案当然是可以，我们今天继续来探索如何实现`solr自动从mysql同步数据`

## 1. 思路

首先我们要知道，我们在solr-admin中实现数据同步，是通过solr的`dataimport`接口来实现的，而solr本身也把该接口暴露给我们了，所以理论上我们只要定时调用对应核心的`dataimport`接口，即可实现定时增量同步

而调用`dataimport`接口，只需要通过普通的http请求即可

接口地址：

> http://solr服务ip:solr服务端口/solr/核心/dataimport?command=同步类型&commit=true&clean=true
>
> command 同步类型支持全量同步full-import和增量同步delta-import
>
> clean 是否清除原数据，增量同步时注意设置为false
>
> commit 批量同步时，是否每批次提交立即更新solr中数据

我们甚至可以直接访问接口进行同步：

全量同步接口地址：

[http://192.168.244.41:8983/solr/orders/dataimport?command=full-import&commit=true&clean=true](http://192.168.244.41:8983/solr/orders/dataimport?command=full-import&commit=true&clean=true)

增量同步接口地址：

[http://192.168.244.41:8983/solr/orders/dataimport?command=delta-import&commit=true&clean=true](http://192.168.244.41:8983/solr/orders/dataimport?command=delta-import&commit=true&clean=true)

注：这里仅测试，未将clean设置为false，实际使用时不能设置为true，否则原数据会被清楚

## 2. 实操

那么我们可以基于之前的定时任务项目来实现定时调用同步接口，从而实现自动同步

**0、** 在实现之前，有更加基础的配置，我们在前几章已经讲解过了，如果还不知道的同学，可以先学习一下前几章，这里我们就不再重复讲解了；

**1、** 首先基于之前的项目书写一个数据同步的定时任务，其核心处理逻辑就是调用增量同步接口；

（项目地址：[https://gitee.com/wuhanxue/wu_study/tree/master/demo/xxljob_demo](https://gitee.com/wuhanxue/wu_study/tree/master/demo/xxljob_demo)）

```java
@XxlJob("orderSolrImport")
    public void solrImport(){
        HashMap<String, Object> param = new HashMap<>();
        param.put("commit", true);
        param.put("command", "delta-import");
        String result = HttpUtil.get("http://192.168.244.41:8983/solr/orders/dataimport", param);
        System.out.println("同步成功：\n"+result);
    }
```

如上代码需要引入hutool工具包

```xml
<dependency>
    <groupId>cn.hutool</groupId>
    <artifactId>hutool-all</artifactId>
    <version>5.8.7</version>
</dependency>
```

**2、** 然后在xxl-job管理端配置一个定时任务；

这里我配置的是30s执行一次同步，具体可根据项目情况调整

**3、** 启动任务之后，先在数据库新增两条数据；

**4、** 之后我们就可以在后台看到同步日志了；

这里如果出现了增量数据再重复更新，这是因为`solr安装目录/server/核心/conf/dataimport.properties`文件中的增量同步时间不是当前时间导致，它会持续更新递增， 一直更新到当前时间为止，你也可以直接修改其时间为当前时间

```java
orders.last_index_time=2023-06-08 00\:22\:00
last_index_time=2023-06-08 00\:22\:00
```

**5、** solr中也能查到刚同步的数据了；

## 3. 总结

至此我们数据定时同步的简单实现就完成了，当然你也可以选择其他的定时任务框架，或实现方式，但是实现思路是不变的，同时我们这里是通过http直接调用的同步接口，实际上我们引入solr客户端后，还可以使用solr客户端提供的方法来实现，但核心原理依然相同！
