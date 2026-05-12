# 09、MongoDB 创建数据库
- 来源：https://ddkk.com/zhuanlan/db/mongodb/9.html
- 分类：缓存数据库
- 分组：教程目录
### 语法

MongoDB 创建数据库的语法格式如下：

```sh
use DATABASE_NAME
```

如果数据库不存在，则创建数据库，否则切换到指定数据库

### 范例

以下实例我们创建了数据库 souyunku:

```sh
> use souyunku
switched to db souyunku
> db
souyunku
>
```

如果想查看所有数据库，可以使用 **show dbs** 命令

```sh
> show dbs
local   0.078GB
test  0.078GB
> 
```

咦，没创建成功 ？刚创建的数据库 *souyunku* 并不在数据库的列表中啊

MongoDB 默认不会显示没有数据的数据库，要显示 souyunku 数据库

需要向souyunku 数据库插入一些数据

```sh
> db.souyunku.insert({"name":"教程 ","site":"https://ddkk.com/"})
WriteResult({ "nInserted" : 1 })
> show dbs
local   0.078GB
souyunku  0.078GB
test    0.078GB
>
```

MongoDB 中默认的数据库为 test，如果你没有创建新的数据库，集合将存放在 test 数据库中
