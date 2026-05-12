# 10、MongoDB 切换数据库
- 来源：https://ddkk.com/zhuanlan/db/mongodb/10.html
- 分类：缓存数据库
- 分组：教程目录
### 语法

MongoDB 切换数据库的语法格式如下：

```sh
use DATABASE_NAME
```

切换到指定数据库，如果数据库不存在，则创建数据库

### 范例

这个范例我们从 test 数据库切换到 souyunku 数据库

```sh
> db
test
> use souyunku
switched to db souyunku
> db
souyunku
> 
```

MongoDB 中默认的数据库为 test，如果没有创建新的数据库，集合将存放在 test 数据库中
