# 01、RDF 基础教程
- 来源：https://ddkk.com/zhuanlan/other/rdf/1.html
- 分类：RDF 教程
- 分组：教程目录
在图书馆里，每一本书都要被编目，这样才能方便查找和利用。于是，很早就有人想到，网上所有的资源也需要"编目"

如果要对网络资源编目，首先就必须有一套"编目规则"

资源描述框架 ( Resource Description Framework，简称 RDF )，就是一套 W3C 提出的描述网络资源的方法

RDF的基本思想很简单，就是说任何网络资源都可以唯一地用 URI ( 统一资源标识符，Uniform Resource Identifier ) 来表示

RDF(资源描述框架)是描述网络资源的 W3C 标准, ，比如网页的标题、作者、修改日期、 内容以及版权信息等

## RDF 范例

```xml
<?xml version="1.0"?>
<rdf:RDF
xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
xmlns:si="/rdf/">
  <rdf:Description rdf:about="http://www.ddkk.com/rdf/#si">
    <si:title>DDKK.COM 弟弟快看，程序员编程资料站</si:title>
    <si:author>语飞</si:author>
  </rdf:Description>
</rdf:RDF>
```
