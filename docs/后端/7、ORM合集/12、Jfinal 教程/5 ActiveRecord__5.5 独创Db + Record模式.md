# 5.5 独创Db + Record模式
- 来源：https://ddkk.com/zhuanlan/orm/jfinal/45.html
- 分类：ORM框架
- 分组：5 ActiveRecord
## 1､常见用法

Db类及其配套的Record类，提供了在Model类之外更为丰富的数据库操作功能。使用Db与Record类时，无需对数据库表进行映射，Record相当于一个通用的Model。以下为Db + Record模式的一些常见用法：

```java
// 创建name属性为James,age属性为25的record对象并添加到数据库
Record user = new Record().set("name", "James").set("age", 25);
Db.save("user", user);
// 删除id值为25的user表中的记录
Db.deleteById("user", 25);
// 查询id值为25的Record将其name属性改为James并更新到数据库
user = Db.findById("user", 25).set("name", "James");
Db.update("user", user);
// 获取user的name属性
String userName = user.getStr("name");
// 获取user的age属性
Integer userAge = user.getInt("age");
// 查询所有年龄大于18岁的user
List<Record> users = Db.find("select * from user where age > 18");
// 分页查询年龄大于18的user,当前页号为1,每页10个user
Page<Record> userPage = Db.paginate(1, 10, "select *", "from user where age > ?", 18);
```

以下为事务处理示例：

```java
boolean succeed = Db.tx(new IAtom(){
    public boolean run() throws SQLException {
       int count = Db.update("update account set cash = cash - ? where id = ?", 100, 123);
       int count2 = Db.update("update account set cash = cash + ? where id = ?", 100, 456);
       return count == 1 && count2 == 1;
    }});
```

以上两次数据库更新操作在一个事务中执行，如果执行过程中发生异常或者run()方法返回false，则自动回滚事务。

## 2、Db.query(...)

第一种用法：当 select 后的字段只有一个时，可以使用合适的泛型接收数据：

```java
List<String> titleList = Db.query("select title from blog");
```

以上sql 中 select 后面只有一个 title 字段，所以使用 `List` 来接收数据。接收数据的泛型变量可根据返回值类理来变动，例如当前返回值为 Integer 时，代码如下：

```java
List<Integer> idList = Db.query("select id from blog");
```

以上sql 中的字段 id 返回值为 Integer，所以接收变量为 `List`

第二种用法：当 select 后的字段有多个时，必须使用 `List` 接收数据，例如：

```java
List<Object[]> list = Db.query("select id, title, content from blog");
List<Object[]> list = Db.query("select * from blog");
```

## 3、Db.queryXxx(...)

Db.queryXxx 系方法有：queryInt、queryLong、queryStr 等等，这些方法对于使用聚合函数这类的 sql 十分方便，例如：

```java
int total = Db.queryInt("select count(*) from account");
```

以上sql 使用了 count(*) 聚合函数，使用 Db.queryInt 不仅方便而且性能是最好的。

除了聚合函数以外，还可以用于查询某条记录的某个字段值，例如：

```java
String nickName = Db.queryStr("select nickName from account where id = ? limit 1", 123);
```

以上代码通过 queryStr 可以很方便去查询 id 值为 123 的 account 的 nickName。

至此可以看出来，Db.queryXxx 系方法要求 select 后面必须**只能有一个字段名**，或者说只能返回一个 column 值（例如 count(*)）。

## 4、Db.find(...) 系与 Db.query(...)/Db.queryXxx(...) 系的区别

前者将返回值一律封装到一个 Record 对象中，而后者不封装，只将数据原样返回。查询所使用的 sql 与参数用法完全一样。

## 5､扩展 Db 功能

Db工具类所有功能都依赖于底层的 DbPro，而 DbPro 可以通过继承来定制自己想要的功能，例如：

```java
public class MyDbPro extends DbPro {
  public MyDbPro(String configName) {
    super(configName);
  }
  public List<Record> find(String sql, Object... paras) {
    System.out.println("Sql: " + sql);
    System.out.println("Paras: " + Arrays.toString(paras));
    return super.find(sql, paras);
  }
}
```

以上代码扩展了 DbPro 并覆盖了父类的 find(String, Object...) 方法，该方法在调用 super.find(...) 之前输出了 sql 及其 para 值。

然后配置一下即可让 MyDbPro 取代 DbPro 的功能：

```java
ActiveRecordPlugin arp = new ActiveRecordPlugin(...);
arp.setDbProFactory(configName -> new MyDbPro(configName));
```

通过如上配置，在使用 Db.find(String, Object...) 方法时用到的将是自己在 MyDbPro 中实现的 find 方法。通过此方法可以替换、增强、改变所有 DbPro 中 public、protected 方法的行为，极为灵活方便

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> JFinal 官方 | https://jfinal.com
