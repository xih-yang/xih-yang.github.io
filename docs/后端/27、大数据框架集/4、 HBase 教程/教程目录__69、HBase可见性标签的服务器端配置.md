# 69、HBase可见性标签的服务器端配置
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/69.html
- 分类：大数据框架
- 分组：教程目录
## 服务器端配置

**1、** 在开始HBase可见性标签的服务器端配置之前，你需要确认达到了[基本的服务器端配置](https://www.w3cschool.cn/hbase_doc/hbase_doc-ybm52ove.html)中的步骤；

**2、** 通过在hbase-site.xml中设置以下属性来安装和配置VisibilityController协处理器这些属性包含类名的列表；

```java
    <property>
      <name>hbase.security.authorization</name>
      <value>true</value>
    </property>
    <property>
      <name>hbase.coprocessor.region.classes</name>
      <value>org.apache.hadoop.hbase.security.visibility.VisibilityController</value>
    </property>
    <property>
      <name>hbase.coprocessor.master.classes</name>
      <value>org.apache.hadoop.hbase.security.visibility.VisibilityController</value>
    </property>
```

```java
如果将AccessController和VisibilityController协处理器一起使用，则AccessController必须位于列表中第一位，因为在这两个组件都处于活动状态时，VisibilityController会将其系统表上的访问控制委派给AccessController。
```

**3、** 调整配置默认情况下，用户可以用任何标签来标注单元格，包括它们没有关联的标签，这意味着用户可以放置他无法读取的数据例如，即使用户没有与该标签相关联，用户也可以用（假设的）’topsecret’标签来标记单元格如果您只希望用户能够标记与其关联的标签的单元格，请设置hbase.security.visibility.mutations.checkauths为true在这种情况下，如果使用用户未关联的标签，则更改将失败；

**4、** 分发您的配置并重新启动群集以使更改生效；
