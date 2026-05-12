# 11、ElasticSearch 实战：图解es并发冲突的发生过程和解决办法
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/3/11.html
- 分类：搜索引擎
- 分组：教程目录
### 1、什么是并发冲突

举个例子，我跟你在淘宝在同一时间下单买了同一本书，两个线程同时去es扣这本书的库存，库存有100本书，正常情况扣完库存后应该变成98本，但如果两个线程并发冲突，就会变成这样

可以看到库存的值变成了99本，与我们期望中的98本不符。这一现象也叫超卖，对数据库的库存扣减的时候也会出现这种并发冲突的情况。

### 2、并发冲突的解决办法

#### (1) 悲观锁思路

悲观锁的思路是在线程1读到库存是100的时候就把es的这条库存给锁上，阻止线程2去读库存，线程1扣完库存并把新的库存量99写入es后，才允许线程2去读取库存，这时线程2读取出来的库存是99而不是100，扣减完变成98再写入es。

> 这种思路实际是把并发的线程转成串行执行，非常方便，直接加锁就行，对程序来说不需要做额外的操作，但是并发能力低，同一时间只能一条线程去扣减库存。

#### (2) 乐观锁思路

乐观锁的思路是给es的库存附加一个版本号，并发冲突的情况下，线程1读取库存库存100(版本号1)，线程2读取库存100(版本号1)，线程1扣减库存后变成99，线程2扣减后变成99，线程1写入库存99到es前比对库存版本号(线程1读取的库存版本号为1，当前es的库存版本号为1)发现一致，于是写入库存99到es并更新库存版本号为2，线程2写入库存99到es前比对库存版本号(线程2读取的库存版本号为1，当前es的库存版本号为2)发现不一致，线程2写入失败，线程2重新读取库存99(版本号2)，线程2扣减后变成98，线程2写入库存98到es前比对库存版本号(都是2)发现一致，于是写入库存98到es并更新库存版本号为3

> 这种方式只是在把库存写入es那一刻检查一下版本号判断是否可以写入就行了，不需要把库存锁上，因此并发能力很高，但这种方式编码的时候比较麻烦，每次更新库存都要去比对版本号和更新版本号，版本号对不上的时候还需要重新读取库存并扣库存。

### 3、es内部如何基于_version进行乐观锁并发控制

es内部本身也存在多线程异步修改数据的过程（primary shard向replica shard同步数据），采用乐观锁的方式基于document自身的版本号_version控制并发冲突，把乱序的修改请求(可能先修改的先到，可能先修改的后到)变成有序修改。

### 4、基于_version进行乐观锁并发控制

话不多说，上图演示，先put一个document进去

```java
PUT /test_index/test_type/1
{
  "test_field": "test"
}
```

可以看到此时_version是1，这是最新的版本号，我们基于最新的版本号去修改这个document

```java
PUT /test_index/test_type/1?version=1
{
  "test_field": "test2"
}
```

修改成功，且这个document的_version更新成了2,我们再尝试基于旧_version修改这个document

```java
PUT /test_index/test_type/1?version=1
{
  "test_field": "test3"
}
```

修改失败。因为新的修改请求必须基于最新的version:2去修改。

### 5、使用partial update进行乐观锁并发控制

先写入一条测试数据

```java
PUT /test_index/test_type/3
{
  "test_field": "test"
}
```

基于版本号1进行更新

```java
POST /test_index/test_type/3/_update?version=1
{
  "doc": {
    "test_field": "test_post"
  }
}
```

### 6、基于external version进行乐观锁并发控制

document自身的_version是es内部提供的，我们可以不用这个版本号来进行并发控制。比如我们es的数据是mysql导进来的，我们在mysql表里面自己维护了一个版本号，我们想直接用这个版本号来进行并发控制。

话不多说，上图演示，先put一个document进去

```java
PUT /test_index/test_type/2
{
  "test_field": "test"
}
```

可以看到此时_version是1，这是最新的版本号，我们基于我们自己维护的version(比如version=1000)去修改这个document

```java
PUT /test_index/test_type/2?version=1000&version_type=external
{
  "test_field": "test"
}
```

修改成功，且这个document的_version更新成了1000。

当我们使用version_type=external的时候，当我提供的version:1000比最新版本号version:1大时就可以修改，并在修改后把最新版本号修改为我们提供的版本号。用此方式使我们同时往es和mysql同时写入数据时两者的版本号是一样的。
