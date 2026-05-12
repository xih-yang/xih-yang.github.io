# 70、HBase可见性标签管理（Administration）
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/70.html
- 分类：大数据框架
- 分组：教程目录
## 可见性标签管理（Administration）

管理（Administration）任务可以使用HBase Shell或Java API执行。为了定义可见性标签并将标签与用户关联，HBase Shell可能更简单。

**1、** 定义可见性标签列表HBaseShell；

```java
    hbase> add_labels [ 'admin', 'service', 'developer', 'test' ]
```

```java
示例：
```

```java
    public static void addLabels() throws Exception {
      PrivilegedExceptionAction<VisibilityLabelsResponse> action = new PrivilegedExceptionAction<VisibilityLabelsResponse>() {
        public VisibilityLabelsResponse run() throws Exception {
          String[] labels = { SECRET, TOPSECRET, CONFIDENTIAL, PUBLIC, PRIVATE, COPYRIGHT, ACCENT,
              UNICODE_VIS_TAG, UC1, UC2 };
          try {
            VisibilityClient.addLabels(conf, labels);
          } catch (Throwable t) {
            throw new IOException(t);
          }
          return null;
        }
      };
      SUPERUSER.runAs(action);
    }
```

**2、** 将标签与用户关联：HBaseShell；

```java
    hbase> set_auths 'service', [ 'service' ]
```

```java
hbase> set_auths'testuser'，['test']
```

```java
hbase> set_auths'qa'，['test'，'developer']
```

```java
hbase> set_auths'@qagroup'，['test']
```

Java API

```java
public void testSetAndGetUserAuths() throws Throwable {
  final String user = "user1";
  PrivilegedExceptionAction<Void> action = new PrivilegedExceptionAction<Void>() {
    public Void run() throws Exception {
      String[] auths = { SECRET, CONFIDENTIAL };
      try {
        VisibilityClient.setAuths(conf, auths, user);
      } catch (Throwable e) {
      }
      return null;
    }
    ...
```

**1、** 清除用户的标签：HBaseShell；

```java
    hbase> clear_auths 'service', [ 'service' ]
```

```java
hbase> clear_auths'testuser'，['test']
```

```java
hbase> clear_auths'qa'，['test'，'developer']
```

```java
hbase> clear_auths'@qagroup'，['test'，'developer']
```

Java API

```java
...
auths = new String[] { SECRET, PUBLIC, CONFIDENTIAL };
VisibilityLabelsResponse response = null;
try {
  response = VisibilityClient.clearAuths(conf, auths, user);
} catch (Throwable e) {
  fail("Should not have failed");
  ...
}
```

**1、** 将标签或表达式应用于单元格：该标签仅适用于数据写入时该标签与给定版本的单元格相关联HBaseShell；

```java
    hbase> set_visibility 'user', 'admin|service|developer', { COLUMNS => 'i' }
```

```java
hbase> set_visibility'user'，'admin | service'，{COLUMNS =>'pii'}
```

```java
hbase> set_visibility'user'，'test'，{COLUMNS => ['i'，'pii']，FILTER =>“（PrefixFilter（'test'））”}
```

注意：HBase Shell支持将标签或权限应用于单元格以进行测试和验证支持，不应将其用于生产使用，因为它不会将标签应用于尚不存在的单元格。应用单元级别标签的正确方法是在存储值时在应用程序代码中执行此操作。

Java API

```java
static Table createTableAndWriteDataWithLabels(TableName tableName, String... labelExps)
    throws Exception {
  Configuration conf = HBaseConfiguration.create();
  Connection connection = ConnectionFactory.createConnection(conf);
  Table table = NULL;
  try {
    table = TEST_UTIL.createTable(tableName, fam);
    int i = 1;
    List<Put> puts = new ArrayList<Put>();
    for (String labelExp : labelExps) {
      Put put = new Put(Bytes.toBytes("row" + i));
      put.add(fam, qual, HConstants.LATEST_TIMESTAMP, value);
      put.setCellVisibility(new CellVisibility(labelExp));
      puts.add(put);
      i++;
    }
    table.put(puts);
  } finally {
    if (table != null) {
      table.flushCommits();
    }
  }
```
