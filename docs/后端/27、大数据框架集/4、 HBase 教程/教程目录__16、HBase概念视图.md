# 16、HBase概念视图
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/16.html
- 分类：大数据框架
- 分组：教程目录
## HBase概念视图

本节介绍 HBase 的概念视图。

本节的示例是根据 BigTable 论文进行稍微修改后的示例。在本节的示例中有一个名为表 webtable，其中包含两行（com.cnn.www 和 com.example.www）以及名为 contents、anchor 和 people 的三个列族。在本例中，对于第一行（com.cnn.www）， anchor 包含两列（anchor:cssnsi.com，anchor:my.look.ca），并且 contents 包含一列（contents:html）。本示例包含具有行键 com.cnn.www 的行的5个版本，以及具有行键 com.example.www 的行的一个版本。contents:html 列限定符包含给定网站的整个 HTML。锚（anchor）列族的限定符每个包含与该行所表示的站点链接的外部站点以及它在其链接的锚点（anchor）中使用的文本。people 列族代表与该网站相关的人员。

列名称：按照约定，列名由其列族前缀和限定符组成。例如，列内容: html 由列族contents和html限定符组成。冒号字符（:）从列族限定符分隔列族。

webtable 表如下所示：

行键（Row Key）
时间戳（Time Stamp）
ColumnFamilycontents
ColumnFamilyanchor
ColumnFamily people

“com.cnn.www”

T9

anchor：cnnsi.com =“CNN”

“com.cnn.www”

T8

anchor：my.look.ca =“CNN.com”

“com.cnn.www”

T6

内容：html =“ …”

“com.cnn.www”

T5

内容：html =“ …”

“com.cnn.www”

T3

内容：html =“ …”

“com.example.www”

T5

内容：html =“ …”

people:author = “John Doe”

此表中显示为空的单元格在 HBase 中不占用空间或实际上存在。这正是使 HBase “稀疏”的原因。表格视图并不是查看 HBase 数据的唯一可能的方法，甚至是最准确的。以下代表与多维地图相同的信息。这只是用于说明目的的模拟，可能并不严格准确。

```java
{
  "com.cnn.www": {
    contents: {
      t6: contents:html: "<html>..."
      t5: contents:html: "<html>..."
      t3: contents:html: "<html>..."
    }
    anchor: {
      t9: anchor:cnnsi.com = "CNN"
      t8: anchor:my.look.ca = "CNN.com"
    }
    people: {}
  }
  "com.example.www": {
    contents: {
      t5: contents:html: "<html>..."
    }
    anchor: {}
    people: {
      t5: people:author: "John Doe"
    }
  }
}
```
