# 03、Solr：Solr 单机版安装
- 来源：https://ddkk.com/zhuanlan/search/solr/2/17.html
- 分类：搜索引擎
- 分组：Solr 实战 (B)
Solr 是使用 Java 编写，所以必选先安装 JDK。

## 1.上传并解压

上传压缩包 solr-8.2.0.tgz 到/usr/local/tmp 中

解压

#cd /usr/local/tmp

#tar zxf solr-8.2.0.tgz

## 2.复制到/usr/local 中

#cp -r solr-8.2.0 …/solr

## 3.修改启动参数

修改启动参数，否则启动时报警告。提示设置 SOLR_ULIMIT_CHECKS=false

#cd /usr/local/solr/bin

#vim solr.in.sh

## 4.启动 Solr

Solr 内嵌 Jetty，直接启动即可。默认监听 **8983 端口**。

Solr 默认不推荐 root 账户启动，如果是 root 账户启动需要添加-force 参数

#./solr start -force
