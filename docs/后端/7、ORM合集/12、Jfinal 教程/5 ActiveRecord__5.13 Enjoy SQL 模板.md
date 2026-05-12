# 5.13 Enjoy SQL 模板
- 来源：https://ddkk.com/zhuanlan/orm/jfinal/53.html
- 分类：ORM框架
- 分组：5 ActiveRecord
JFinal利用自带的 Enjoy Template Engine 极为简洁的实现了 Sql 模板管理功能。一如既往的极简设计，仅有 #sql、#para、#namespace 三个指令，学习成本依然低到极致。

**重要**：除了以上三个 sql 管理专用指令以外，jfinal 模板引擎的所有指令和功能也可以用在 sql 管理，jfinal 模板引擎用法见第 6 章：[http://www.jfinal.com/doc/6-1](http://www.jfinal.com/doc/6-1)

## 1、基本配置

在ActiveRecordPlugin中使用sql管理功能示例代码如下：

```java
ActiveRecordPlugin arp = new ActiveRecordPlugin(druidPlugin);
arp.addSqlTemplate("all.sql");
_MappingKit.mapping(arp);
me.add(arp);
```

如上例所示，ar.addSqlTemplate("all.sql") 将从 class path 或者 jar 包中读取 "all.sql" 文件。

可以通过多次调用addSqlTemplate来添加任意多个外部 sql 文件，并且对于不同的 ActiveRecordPlugin 对象都是彼此独立配置的，有利于多数据源下对 sql 进行模块化管理。

可以将sql 文件放在maven项目下的 src/main/resources 之下，编译器会自动将其编译至 class path 之下，进而可以被读取到，打包进入 jar 包中以后也可以被读到。

如果希望在开发阶段可以对修改的sql文件实现热加载，可以配置 arp.setDevMode(true)，如果不配置则默认使用 configConstant中的 me.setDevMode(…) 配置。

**特别注意：**sql 管理模块使用的 Engine 对象并非在 configEngine(Engine me)配置，因此在对其配置 shared method、directive 等扩展时需要使用 activeRecordPlugin.getEngine() 先得到 Engine 对象，然后对该 Engine 对象进行配置。

## 2、#sql 指令

#sql 指令用于定义 sql 模板，如下是代码示例：

```sh
#sql("findGirl")
  select * from girl where age > ? and age < ? and weight < 50
#end
```

上例通过 #sql 指令在模板文件中定义了 sqlkey 为 "findGirl" 的 sql 模板，在java 代码中的获取方式如下：

```java
String sql = Db.getSql("findGirl");
Db.find(sql, 16, 23);
```

上例中第一行代码通过 Db.getSql() 方法获取到定义好的sql语句，第二行代码直接将 sql 用于数据库查询。

此外，还可以通过 Model.getSql(key) 方法来获取sql语句，功能与Db.getSql(key) 完全一样。

## 3、#para 指令

### 3.1 使用 int 常量 #para(int)

#para 指令用于生成 sql 模板中的问号占位符以及问号占位符所对应的参数值，两者分别保存在 SqlPara对象的 sql 和 paraList 属性之中。

#para指令支持两种用法，一种是传入 **int型常量参数** 的用法，如下示例展示的是 int 型常量参数的用法：

```sh
#sql("findGirl")
  select * from girl where age > #para(0) and weight < #para(1)
#end
```

上例代码中两个 #para 指令，传入了两个 int 型常量参数，所对应的 java 后端代码必须调用 getSqlPara(String key, Object… paras)，如下是代码示例：

```java
// Db.template 用法（jfinal 4.0 新增）
Db.template("findGirl", 18, 50).find();
// Model.template 用法完全一样，以下假定 girl 为 Model
girl.template("findGirl", 18, 50).find();
// getSqlPara 用法
SqlPara sqlPara = Db.getSqlPara("findGirl", 18, 50);
Db.find(sqlPara);
```

以上第一行代码中的 18 与 50 这两个参数，分别被前面 #sql 指令中定义的 #para(0) 与 #para(1) 所使用。

Db.template(String key, Object... paras) 与 Db.getSqlPara(String key, Object... paras) 方法的第二个参数 Object... paras，在传入实际参数时，下标值从 0 开始算起与 #para(int) 指令中使用的 int 型常量一一对应。

jfinal 4.0 新增的 template(...) 用法与 getSqlPara(...) 所接受的参数完全一样，所以两者在本质上完全一样。

新增的template(...) 方法仅仅是为了减少代码量，提升开发体验，在功能上与 getSqlPara 完全一样，对于已经熟悉 getSqlPara 用法的同学不会增加学习成本。

### 3.2 使用非 int 常量 #para(expr)

#para 指令的另一种用法是传入除了 int 型常量以外的任意表达式参数 (注意：两种用法处在同一个 #sql 模板之中时只能选择其中一种)，如下是代码示例：

```sh
#sql("findGirl")
  select * from girl where age > #para(age) and weight < #para(weight)
#end
```

与上例模板文件配套的java代码如下所示：

```java
// 构造参数
Kv cond = Kv.of("age", 18).set("weight", 50);
// 使用 Db 的 template 方法
Db.template("findGirl", cond).find();
// 使用 Model 的 template 方法，以下假定 girl 为 Model
girl.template("findGirl", cond).find();
```

上例代码获取到的 SqlPara 对象 sqlPara 中封装的 sql 为：select * from girl where age > ? and weight  **?** and weight  版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> JFinal 官方 | https://jfinal.com
