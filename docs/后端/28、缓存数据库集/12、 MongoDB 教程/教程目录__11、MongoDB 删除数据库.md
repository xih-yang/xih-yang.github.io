# 11、MongoDB 删除数据库
- 来源：https://ddkk.com/zhuanlan/db/mongodb/11.html
- 分类：缓存数据库
- 分组：教程目录
```sh
db.dropDatabase()
```

默认数据库为 test，可以使用 db 命令查看当前数据库名

## 范例

接下来我们将演示如何删除 souyunku 数据库

**1、** 首先查看所有数据库；

```sh
    > show dbs
    local   0.000GB
    souyunku    0.000GB
    test    0.000GB
```

**2、** 接下来切换到数据库souyunku；

```sh
    > use souyunku
    switched to db souyunku
    >
```

**3、** 执行删除命令；

```sh
    > db.dropDatabase()
    { "dropped" : "souyunku", "ok" : 1 }
```

**4、** 最后通过showdbs命令数据库是否删除成功；

```sh
    > show dbs
    local  0.000GB
    test   0.000GB
    >
```
