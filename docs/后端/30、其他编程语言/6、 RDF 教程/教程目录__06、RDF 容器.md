# 06、RDF 容器
- 来源：https://ddkk.com/zhuanlan/other/rdf/6.html
- 分类：RDF 教程
- 分组：教程目录
RDF容器用于描述一组事物

例如，把一本书的所有作者列在一起

RDF容器有三种类型：

- ``
- ``
- ``

##

`` 元素描述了一个无序的列表

>  元素可包含重复的值

### 范例

```xml
<?xml version="1.0"?>
<rdf:RDF
  xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
  xmlns:cd="http://z.cn/cd#">
  <rdf:Description rdf:about="http://z.cn/cd/Beatles">
    <cd:artist>
      <rdf:Bag>
        <rdf:li>吴军</rdf:li>
        <rdf:li>保罗R.尼文（Paul R. Niven）</rdf:li>
        <rdf:li>本·拉莫尔特（Ben Lamorte）</rdf:li>
        <rdf:li>Ringo</rdf:li>
      </rdf:Bag>
    </cd:artist>
  </rdf:Description>
</rdf:RDF>
```

##  元素

`` 元素描述了一个有序的列表

>  元素可包含重复的值

### 范例

```xml
<?xml version="1.0"?>
<rdf:RDF
  xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
  xmlns:cd="http://z.cn/cd#">
  <rdf:Description rdf:about="http://z.cn/cd/Beatles">
    <cd:artist>
        <rdf:Seq>
            <rdf:li>George</rdf:li>
            <rdf:li>John</rdf:li>
            <rdf:li>Paul</rdf:li>
            <rdf:li>Ringo</rdf:li>
        </rdf:Seq>
    </cd:artist>
  </rdf:Description>
</rdf:RDF>
```

##  元素

`` 元素描述了一个只能单选的值的列表

### 范例

```xml
<?xml version="1.0"?>
<rdf:RDF 
  xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
  xmlns:cd="http://www.recshop.fake/cd#">
  <rdf:Descriptio rdf:about="http://www.recshop.fake/cd/Beatles">
      <cd:format>
        <rdf:Alt>
            <rdf:li>CD</rdf:li>
            <rdf:li>Record</rdf:li>
            <rdf:li>Tape</rdf:li>
        </rdf:Alt>
      </cd:format>
    </rdf:Descriptio>
</rdf:RDF>
```

## RDF 术语

在上面的例子中，我们在描述容器元素时已经讨论了"值的列表"

在RDF 中，这些"值的列表"被称为成员（members）

所以，我们可以这么说：

- 一个容器是一个包含事物的资源
- 被包含的事物被称为成员
