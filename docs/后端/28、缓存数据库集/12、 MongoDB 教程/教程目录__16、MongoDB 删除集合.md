# 16、MongoDB 删除集合
- 来源：https://ddkk.com/zhuanlan/db/mongodb/16.html
- 分类：缓存数据库
- 分组：教程目录
```sh
db.collection_name.drop()
```

## 范例

下面的命令演示了如何删除 souyunku 数据库中的集合 site

```sh
> use souyunku
switched to db souyunku
> show tables
site
> db.site.drop()
true
> show tables
>
```
