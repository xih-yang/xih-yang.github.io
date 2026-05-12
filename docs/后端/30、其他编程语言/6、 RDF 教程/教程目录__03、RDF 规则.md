# 03、RDF 规则
- 来源：https://ddkk.com/zhuanlan/other/rdf/3.html
- 分类：RDF 教程
- 分组：教程目录
RDF使用 WEB 标识符 (URIs) 来标识资源，使用属性和属性值来描述资源

## RDF 资源、属性和属性值

RDF使用 WEB 标识符来标识事物，并通过属性和属性值来描述资源。

关于资源、属性和属性值：

- **资源** 是可拥有 URI 的任何事物，比如 "http://www.ddkk.com/rdf"
- **属性** 是拥有名称的资源，比如 "author" 或 "homepage"
- **属性值** 是某个属性的值，比如 "David" 或 "http://www.ddkk.com"

> 注意属性值可以是另外一个资源

### 范例

下面的RDF 范例文档可描述资源: http://www.ddkk.com/rdf

```xml
<?xml version="1.0"?>
<RDF>
    <Description about="http://www.ddkk.com/rdf">
        <author>Jan Egil Refsnes</author>
        <homepage>http://www.ddkk.com</homepage>
    </Description>
</RDF>
```

> 范例是一个简化的例子，命名空间被忽略了

## RDF 陈述

资源、属性和属性值的组合可形成一个 **陈述**（被称为陈述的 **主体**、**谓语** 和 **客体** ）

我们来看一些陈述的具体范例，来加深理解：

陈述："The author of http://www.ddkk.com/rdf is David."

- 陈述的主体是：http://www.ddkk.com/rdf
- 谓语是：author
- 客体是：David

陈述："The homepage of http://www.ddkk.com/rdf is http://www.ddkk.com".

- 陈述的主体是：http://www.ddkk.com/rdf
- 谓语是：homepage
- 客体是：http://www.ddkk.com
