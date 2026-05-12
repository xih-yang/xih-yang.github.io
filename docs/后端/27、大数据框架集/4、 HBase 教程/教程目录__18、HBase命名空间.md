# 18、HBase命名空间
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/18.html
- 分类：大数据框架
- 分组：教程目录
## HBase命名空间

HBase命名空间 namespace 是与关系数据库系统中的数据库类似的表的逻辑分组。这种抽象为即将出现的多租户相关功能奠定了基础：

- 配额管理（Quota Management）（HBASE-8410） – 限制命名空间可占用的资源量（即区域，表）。
- 命名空间安全管理（Namespace Security Administration）（HBASE-9206） – 为租户提供另一级别的安全管理。
- 区域服务器组（Region server groups）（HBASE-6721） – 命名空间/表可以固定在 RegionServers 的子集上，从而保证粗略的隔离级别。

### 命名空间管理

你可以创建、删除或更改命名空间。通过指定表单的完全限定表名，在创建表时确定命名空间成员权限：

```java
<table namespace>:<table qualifier>
```

示例：

```java
#Create a namespace
create_namespace 'my_ns'
#create my_table in my_ns namespace
create 'my_ns:my_table', 'fam'
#drop namespace
drop_namespace 'my_ns'
#alter namespace
alter_namespace 'my_ns', {METHOD => 'set', 'PROPERTY_NAME' => 'PROPERTY_VALUE'}
```

### HBase预定义的命名空间

在HBase 中有两个预定义的特殊命名空间：

- hbase：系统命名空间，用于包含 HBase 内部表
- default：没有显式指定命名空间的表将自动落入此命名空间

示例：

```java
#namespace=foo and table qualifier=bar
create 'foo:bar', 'fam'
#namespace=default and table qualifier=bar
create 'bar', 'fam'
```
