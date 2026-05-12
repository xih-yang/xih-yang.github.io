# 07、RDF 集合
- 来源：https://ddkk.com/zhuanlan/other/rdf/7.html
- 分类：RDF 教程
- 分组：教程目录
RDF集合是通过属性 rdf:parseType="Collection" 来描述仅包含指定成员的组

## rdf:parseType="Collection" 属性

前面章节中有提到，我们无法关闭一个容器。 容器规定了所包含的资源为成员，但它没有规定其他的成员是不被允许的

### 范例

```xml
<?xml version="1.0"?>
<rdf:RDF
  xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" 
  xmlns:bk="/bk#">
  <rdf:Description rdf:about="/bk/t">
    <bk:devlang rdf:parseType="Collection">
      <rdf:Description rdf:about="/bk/t/python"/>
      <rdf:Description rdf:about="/bk/t/csharp"/>
      <rdf:Description rdf:about="/bk/t/perl"/>
      <rdf:Description rdf:about="/bk/t/ruby"/>
    </cd:artist>
  </rdf:Description>
</rdf:RDF>
```
