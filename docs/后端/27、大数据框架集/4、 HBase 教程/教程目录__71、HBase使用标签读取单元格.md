# 71、HBase使用标签读取单元格
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/71.html
- 分类：大数据框架
- 分组：教程目录
## 使用标签读取单元格

当您发出扫描或获取时，HBase会使用您的一组默认授权来过滤掉您无权访问的单元格。超级用户（superuser）可以通过使用set_auths HBase Shell命令或VisibilityClient.setAuths()方法为给定用户设置默认授权集。

如果您使用API，则可以在扫描或获取期间通过在HBase Shell中传递AUTHORIZATIONS选项或在Scan.setAuthorizations()方法中指定不同的授权。此授权将与您的默认设置一起作为附加过滤器。它会进一步过滤你的结果，而不是给你额外的授权。

HBase Shell

```java
hbase> get_auths 'myUser'
hbase> scan 'table1', AUTHORIZATIONS => ['private']
```

例子：Java API

```java
...
public Void run() throws Exception {
  String[] auths1 = { SECRET, CONFIDENTIAL };
  GetAuthsResponse authsResponse = null;
  try {
    VisibilityClient.setAuths(conf, auths1, user);
    try {
      authsResponse = VisibilityClient.getAuths(conf, user);
    } catch (Throwable e) {
      fail("Should not have failed");
    }
  } catch (Throwable e) {
  }
  List<String> authsList = new ArrayList<String>();
  for (ByteString authBS : authsResponse.getAuthList()) {
    authsList.add(Bytes.toString(authBS.toByteArray()));
  }
  assertEquals(2, authsList.size());
  assertTrue(authsList.contains(SECRET));
  assertTrue(authsList.contains(CONFIDENTIAL));
  return null;
}
...
```
