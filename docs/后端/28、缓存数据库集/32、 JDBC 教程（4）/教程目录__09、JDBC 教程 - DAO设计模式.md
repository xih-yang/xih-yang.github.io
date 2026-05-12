# 09、JDBC 教程 - DAO设计模式
- 来源：https://ddkk.com/zhuanlan/db/jdbc/4/9.html
- 分类：缓存数据库
- 分组：教程目录
## JDBC基础

### DAO设计模式

#### 什么是DAO设计模式？

上面几章下来，其实我们已经差不多完成了DAO的基础了，我们在第6章和第8章已经实现了使用面向对象的思想通过JDBC对数据库进行了更新操作(INSERT、UPDATE、DELETE)和查询操作(SELECT);

其中我们在第8章中`JDBCUtils`类的`select()`方法返回的是`List`集合，而我们平时有可能只需要查询返回一个对象，那么只要将解析`ResultSet`结果集的`while(rs.next())`改成`if(rs.next())`，那么就只会返回一个对象了。

我们把查询的方法和更新的方法放在一个类里，那么调用层只需要调用这个类中的方法，传入需要的参数，那么就可以实现JDBC的操作

DAO类的特点：

**1、** 访问数据信息的类，包含了对数据的CRUD方法；

**2、** DAO的类里不包含任何业务相关的信息；

#### 我们为什么要用DAO设计模式？

好处是什么：

**1、** 实现功能的模块化，更有利于代码的维护和升级；

**2、** DAO可以被子类继承或直接使用；

#### DAO设计模式怎么用？

使用JDBC编写DAO可能包含的方法：

**1、** 更新方法(可参照第6章JDBCUtils类的update()方法)；

**2、** 查询多条记录的方法(可参照第8章JDBCUtils类的select()方法)；

**3、** 查询单条记录的方法(可根据第8章JDBCUtils类的select()方法稍作改变，上面提到了)；

**4、** 查询某条记录的某个字段的值或一个统计的值(可根据第8章JDBCUtils类的select()方法稍作改变，在解析时读取SQL返回字段的值后，返回Object对象，外部接收后强转以下即可)；

针对第4点，我举个栗子：我需要一个查询表数量的查询方法，下面是JDBCUtils的针对多条数据某些字段或单个数据的数量值的select方法。这种查询方法可以根据具体的查询需求进行抽象为通用方法，抽象方法越通用，那么灵活性必然也越高，调用层需要转换(迁就)的部分也就越多

```java
/**
 * 查询单条数据的某些字段
 * @param path 数据库连接信息文件地址
 * @param sql 查询的sql
 * @param args 可变参数
 * @return
 */
public static List<Map<String, Object>> selectForValue(String path, String sql, Object ... args){
    getConnection(path);
    // 如果创建连接失败，返回null
    if(con == null){
        System.out.println("创建数据库连接失败");
        return null;
    }
    List<Map<String, Object>>  list = new ArrayList<Map<String, Object>>();
    try{
        ps = con.prepareStatement(sql);
        for(int i=0;i<args.length;i++){
            ps.setObject(i+1, args[i]);
        }
        rs = ps.executeQuery();
        while(rs.next()){
            ResultSetMetaData rsmd = rs.getMetaData();
            Map<String, Object> map = new HashMap<String, Object>();
            for(int i=0;i<rsmd.getColumnCount();i++) {
                String columnLabel = rsmd.getColumnLabel(i+1);
                Object columnValue = rs.getObject(columnLabel);
                map.put(columnLabel, columnValue);
            }
            list.add(map);
        }
    } catch (Exception e){
        e.printStackTrace();
    } finally {
        // 关闭数据库连接
        close();
    }
    return list;
}
```

这里是调用层的代码，我写了两个方法，一个是查询表数据量的，一个是查询某个表符合条件的数据的特定字段的

```java
public Integer selectUserCount() {
    String sql = "SELECT count(1) count FROM user";
    List<Map<String, Object>> list = JDBCUtils.selectForValue("database.properties", sql, User.class);
    Integer count = Integer.parseInt(list.get(0).get("count").toString());
    return count;
}
public List<Map<String, Object>> selectUser(Integer age) {
    String sql = "SELECT name, remark FROM user WHERE age = ?";
    List<Map<String, Object>> list = JDBCUtils.selectForValue("database.properties", sql, User.class, age);
    return list;
}
```

测试代码

```java
Integer count = service.selectUserCount();
System.out.println("User表数据量：" + count);
List<Map<String, Object>> list3 = service.selectUser(19);
for(Map<String, Object> map : list3) {
    System.out.println(map.get("name") + ":" + map.get("remark"));
}
```

结果：

```java
User表数据量：4
浅夏:这是一个乐观的女孩
苏熙:这是一个可爱的美少女
```
