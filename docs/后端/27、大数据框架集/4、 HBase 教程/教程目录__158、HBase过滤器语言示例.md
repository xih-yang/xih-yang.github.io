# 158、HBase过滤器语言示例
- 来源：https://ddkk.com/zhuanlan/bigdata/hbase/158.html
- 分类：大数据框架
- 分组：教程目录
## 使用过滤器语言的PHP客户端程序示例

```java
<?
  $_SERVER['PHP_ROOT'] = realpath(dirname(__FILE__).'/..');
  require_once $_SERVER['PHP_ROOT'].'/flib/__flib.php';
  flib_init(FLIB_CONTEXT_SCRIPT);
  require_module('storage/hbase');
  $hbase = new HBase('<server_name_running_thrift_server>', <port on which thrift server is running>);
  $hbase->open();
  $client = $hbase->getClient();
  $result = $client->scannerOpenWithFilterString('table_name', "(PrefixFilter ('row2') AND (QualifierFilter (>=, 'binary:xyz'))) AND (TimestampsFilter ( 123, 456))");
  $to_print = $client->scannerGetList($result,1);
  while ($to_print) {
    print_r($to_print);
    $to_print = $client->scannerGetList($result,1);
  }
  $client->scannerClose($result);
?>
```

## 过滤器字符串示例

- “PrefixFilter (‘Row’) AND PageFilter (1) AND FirstKeyOnlyFilter ()” 将返回符合以下条件的所有键值对：

**1、** 包含键值的行应该有前缀Row；

**2、** 键值必须位于表的第一行；

**3、** 键值对必须是行中的第一个键值；

- “(RowFilter (=, ‘binary:Row 1’) AND TimeStampsFilter (74689, 89734)) OR ColumnRangeFilter (‘abc’, true, ‘xyz’, false))”将返回符合以下两个条件的所有键值对：
- 键值位于具有行键Row 1的行中；
- 键值必须具有74689或89734的时间戳；
- 或者它必须符合以下条件：

键值对必须位于按字典顺序>`= abc和`

“SKIP ValueFilter (0)”，如果行中的任何值不为0，则将跳过整行
