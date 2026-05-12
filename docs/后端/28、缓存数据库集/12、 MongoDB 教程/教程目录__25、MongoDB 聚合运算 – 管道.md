# 25、MongoDB 聚合运算 – 管道
- 来源：https://ddkk.com/zhuanlan/db/mongodb/25.html
- 分类：缓存数据库
- 分组：教程目录
MongoDB 管道操作是可以重复的

管道在Linux 中一般用于将当前命令的输出结果作为下一个命令的参数

#### 表达式

MongoDB 表达式用于处理输入文档并输出

表达式是无状态的，只能用于计算当前聚合管道的文档，不能处理其它的文档

### MongoDB 聚合运算中常用的操作

**1、**`$` project；

```sh
修改输入文档的结构  
可以用来重命名、增加或删除域，也可以用于创建计算结果以及嵌套文档
```

**2、**`$` match；

```sh
用于过滤数据，只输出符合条件的文档  
$match 使用 MongoDB 的标准查询操作
```

**3、**`$` limit；

```sh
用来限制 MongoDB 聚合管道返回的文档数
```

**4、**`$` skip；

```sh
在聚合管道中跳过指定数量的文档，并返回余下的文档
```

**5、**`$` unwind；

```sh
将文档中的某一个数组类型字段拆分成多条，每条包含数组中的一个值
```

**6、**`$` group；

```sh
将集合中的文档分组，可用于统计结果
```

**7、**`$` sort；

```sh
将输入文档排序后输出
```

**8、**`$` geoNear；

```sh
输出接近某一地理位置的有序文档
```

## 管道聚合运算操作范例

**1、** ** `$` project**；

```sh
    > db.article.aggregate({ $project : {title : 1 ,author : 1 ,}});
```

```sh
上面聚合操作输出的结果中只有 *\_id* , *tilte* 和 *author* 三个字段
默认情况下 \_id 字段是被包含的，如果要想不包含 \_id 话可以这样
```

```sh
    > db.article.aggregate({$project:{_id:0 ,title : 1 ,author : 1}});
```

**2、** ** `$` match**；

```sh
    > db.articles.aggregate( [
                    { $match : { score : { $gt : 70, $lte : 90 } } },
                    { $group: { _id: null, count: { $sum: 1 } } }
                   ] );
```

```sh
**$match** 用于获取分数大于 70 小于或等于 90 记录  
然后将符合条件的记录送到下一阶段 $group 管道操作符进行处理
```

**3、** ** `$` skip**；

```sh
    > db.article.aggregate({ $skip : 5 });
```

```sh
经过 $skip 管道操作符处理后，前五个文档被 "筛选" 掉了
```
