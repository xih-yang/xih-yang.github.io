# 10、XQuery 函数
- 来源：https://ddkk.com/zhuanlan/xml/xquery/10.html
- 分类：XML语言教程
- 分组：教程目录
XQuery 1.0、XPath 2.0 以及 XSLT 2.0 有着共同的函数库

## XQuery 函数

XQuery 有着 100+ 个内建的函数用于字符串值、数值、日期以及时间比较、节点和 QName 操作、序列操作、逻辑值等等

我们也可在 XQuery 中定义自己的函数

## XQuery 内建函数

XQuery 函数命名空间为

```xml
http://www.w3.org/2005/02/xpath-functions
```

函数命名空间的默认前缀是 fn:

> info: XQuery 函数经常被通过 fn: 前缀进行调用，例如 fn:string() 当然，由于 fn: 是命名空间的默认前缀，所以函数名称不必在被调用时使用前缀

我们可以在《内建 XQuery 函数参考手册 》中找到完整的函数信息

## XQuery 函数调用范例

XQuery 函数调用可与 XQuery 表达式一同使用，让我们来看一个例子：

### 范例1：在元素中使用 upper-case 函数

```xml
<name>{upper-case($booktitle)}</name>
```

### 范例2: 在路径表达式的谓语中使用 substring 函数

```xml
doc("books.xml")/bookstore/book[substring(title,1,5)='Harry']
```

### 范例3: 在 let 语句中使用 substring 函数

```xml
let $name := (substring($booktitle,1,4))
```

## XQuery 用户自定义函数

如果找不到所需的 XQuery 函数，我们可以编写自己的函数：

可在查询中或独立的库中使用 declare function 定义用户自定义函数

### 语法

```xml
declare function 前缀:函数名($参数 AS 数据类型)
  AS 返回的数据类型
{
(: ...函数代码... :)
};
```

我们在自定义函数时，需要遵守一些规则

- 请使用 declare function 关键词
- 函数名须使用前缀
- 参数的数据类型通常与在 XML Schema 中定义的数据类型一致
- 函数主体须被花括号 {} 包围
- (: :) 是注释语句

### 范例4： 一个在查询中声明的用户自定义函数：

```xml
declare function lo:minPrice (
  $price as xs:decimal?,
  $discount as xs:decimal?)
  AS xs:decimal?
{
let $disc := ($price * $discount) div 100
return ($price - $disc)
};
(: 这是注释 下面是调用上面的函数的例子 :)
<minPrice>{lo:minPrice($book/price, $book/discount)}</minPrice>
```
