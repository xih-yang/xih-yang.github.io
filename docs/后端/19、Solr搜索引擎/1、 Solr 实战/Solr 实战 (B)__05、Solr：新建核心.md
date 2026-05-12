# 05、Solr：新建核心
- 来源：https://ddkk.com/zhuanlan/search/solr/2/19.html
- 分类：搜索引擎
- 分组：Solr 实战 (B)
Solr 安装完成后默认是没有核心的。需要手动配置

需要在 solr/server/solr 下新建文件夹，并给定配置文件，否则无法建立

## 1.新建目录

在/usr/local/solr/server/solr 中新建自定义名称目录。此处示例名称为 testcore。

#cd /usr/local/solr/server/solr

#mkdir testcore

## 2.复制配置文件

在 configsets 里面包含了_default 和 sample_techproducts_configs。里面都是配置文件示例。_default 属于默认配置，较纯净。sample_techproducts_configs 是带有了一些配置示例

#cp -r configsets/_default/conf/ testcore/

## 3.填写 Core 信息

在可视化管理界面中 Core Admin 中编写信息后点击 Add Core 后，短暂延迟后 testcore 就会创建成功。schema 处不用更改

## 4.出现 testcore

在客户端管理界面中，选择新建的 Core 后，就可以按照自己项目的需求进行操作了。
