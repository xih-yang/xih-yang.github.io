# 19、XML CDATA
- 来源：https://ddkk.com/zhuanlan/xml/xml/19.html
- 分类：其他语言
- 分组：教程目录
XML文档中的所有文本均会被解析器解析

只有CDATA 区段中的文本会被解析器忽略

## PCDATA - 被解析的字符数据

XML解析器通常会解析 XML 文档中所有的文本

当某个XML 元素被解析时，其标签之间的文本也会被解析：

```xml
<message>This text is also parsed</message>
```

解析器之所以这么做是因为 XML 元素可包含其它元素，就像这个范例中，其中的 `` 元素包含着另外的两个元素（first 和 last）：

```xml
<name><first>Bill</first><last>Gates</last></name>
```

而解析器会把它分解为像这样的子元素：

```xml
<name><first>Bill</first><last>Gates</last></name>
```

解析字符数据（PCDATA）是 XML 解析器解析的文本数据使用的一个术语

## CDATA - （未解析）字符数据

CDATA 是不应该由 XML 解析器解析的文本数据

像" " 结束：

```xml
<script><![CDATA[function matchwo(a,b){if (a < b && a < 0) then{return 1;}else{return 0;}}]]></script>
```

上面的范例，解析器会忽略 CDATA 部分中的所有内容

### 关于 CDATA 部分的注释

CDATA 部分不能包含字符串 "]]>"，也不允许嵌套的 CDATA 部分

标记CDATA 部分结尾的 "]]>" 不能包含空格或换行
