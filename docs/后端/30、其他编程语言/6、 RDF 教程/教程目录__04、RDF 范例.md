# 04、RDF 范例
- 来源：https://ddkk.com/zhuanlan/other/rdf/4.html
- 分类：RDF 教程
- 分组：教程目录
假设我们有两条 CD 信息

标题
艺术家
国家
公司
价格
年份

Empire Burlesque
Bob Dylan
USA
Columbia
10.90
1985

Hide your heart
Bonnie Tyler
UK
CBS Records
9.90
1988

现在我们使用 RDF 来描述这两条数据

```xml
<?xml version="1.0"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
    xmlns:cd="http://z.cn/cd#">
    <rdf:Description 
        rdf:about="http://z.cn/cd/Empire Burlesque">
        <cd:artist>Bob Dylan</cd:artist>
        <cd:country>USA</cd:country>
        <cd:company>Columbia</cd:company>
        <cd:price>10.90</cd:price>
        <cd:year>1985</cd:year>
    </rdf:Description>
    <rdf:Description 
        rdf:about="http://z.cn/cd/Hide your heart">
        <cd:artist>Bonnie Tyler</cd:artist>
        <cd:country>UK</cd:country>
        <cd:company>CBS Records</cd:company>
        <cd:price>9.90</cd:price>
        <cd:year>1988</cd:year>
    </rdf:Description>
</rdf:RDF>
```

- 范例的第一行是 XML 声明。 这个 XML 声明之后是 RDF 文档的根元素： ****
- **xmlns:rdf** 命名空间规定了带有前缀 rdf 的元素来自命名空间

```xml
http://www.w3.org/1999/02/22-rdf-syntax-ns#
```

- **xmlns:cd** 命名空间规定了带有前缀 cd 的元素来自命名空间

```xml
http://z.cn/cd#
```

- **** 元素包含了对被 **rdf:about** 属性标识的资源的描述
- 元素： **** 、 **** 、 **** 等是此资源的属性

## RDF 在线验证器

[W3C 的 RDF 在线验证服务](https://www.w3.org/RDF/Validator/)

我们可以将我们定义好的 RDF 文档使用上面的服务来验证

RDF在线验证器可解析 RDF 文档，检查其中的语法，并为您的 RDF 文档生成表格和图形视图

### RDF 在线验证器范例

把下面这个范例拷贝粘贴到 W3C 的 RDF 验证器上试一试吧

```xml
<?xml version="1.0"?>
<rdf:RDF 
    xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
    xmlns:si="/rdf/">
  <rdf:Description 
    rdf:about="https://www.ddkk.com">
    <si:title>ddkk.cn</si:title>
    <si:author>Jan Egil Refsnes</si:author>
   </rdf:Description>
</rdf:RDF>
```

输出结果

```xml
Validation Results
Your RDF document validated successfully
```
