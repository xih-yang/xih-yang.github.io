# 05、RDF 主要元素
- 来源：https://ddkk.com/zhuanlan/other/rdf/5.html
- 分类：RDF 教程
- 分组：教程目录
RDF的主要元素是 `` 以及可表示某个资源的 `` 元素

##  元素

`` 是 RDF 文档的根元素，它将 XML 文档定义为一个 RDF 文档

它也包含了对 RDF 命名空间的引用

```xml
<?xml version="1.0"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
... Description goes here...
</rdf:RDF>
```

##  元素

`` 元素可通过 rdf:about 属性标识一个资源

`` 元素可包含描述资源的那些元素

```xml
<?xml version="1.0"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
    xmlns:cd="http://z.cn/cd#">
    <rdf:Description rdf:about="http://z.cn/cd/Empire Burlesque">
        <cd:artist>Bob Dylan</cd:artist>
        <cd:country>USA</cd:country>
        <cd:company>Columbia</cd:company>
        <cd:price>10.90</cd:price>
        <cd:year>1985</cd:year>
    </rdf:Description>
</rdf:RDF>
```

artist、country、company、price、year 元素定义在命名空间 http://z.cn/cd# 中

此命名空间在 RDF 之外（并非 RDF 的组成部分）

RDF仅仅定义了这个框架

而artist、country、company、price 以及 year 这些元素必须被其他人（公司、组织或个人等）进行定义

## 属性（property）来定义特性（attribute）

属性元素（property elements）也可作为特性（attributes）来被定义

> property 和 attribute 都可以翻译为属性,但这样反而更模糊，所以我更希望把 property 翻译为属性 attribute 翻译为特性

```xml
<?xml version="1.0"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
    xmlns:cd="http://z.cn/cd#">
    <rdf:Description 
        rdf:about="http://z.cn/cd/Empire Burlesque"
        cd:artist="Bob Dylan" 
        cd:country="USA"
        cd:company="Columbia"
        cd:price="10.90"
        cd:year="1985" />
</rdf:RDF>
```

属性可以通过 rdf:resource 引用外部的资源定义

```xml
<?xml version="1.0"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
    xmlns:cd="http://z.cn/cd#">
    <rdf:Description rdf:about="http://z.cn/cd/Empire Burlesque">
    <cd:artist rdf:resource="http://z.cn/cd/dylan" />
        ......
    </rdf:Description>
</rdf:RDF>
```
