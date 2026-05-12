# 10、JDBC 教程 - JDBC元数据
- 来源：https://ddkk.com/zhuanlan/db/jdbc/4/10.html
- 分类：缓存数据库
- 分组：教程目录
## JDBC进阶

### JDBC元数据

#### DatabaseMetaData类和ResultSetMataData类

#### 一、我们能获得哪些JDBC元数据？

Java通过JDBC获得连接以后，得到一个Connection对象，可以从这个对象里获得有关数据库关系系统的各种信息，包括数据库中的各种表，表中的各个列，数据类型，触发器，存储过程等各方面的信息。根据这些信息，JDBC可以访问一个实现事先并不了解的数据库。

获取这些信息的方法都是在`DatabaseMetaData`类的对象上实现的，而`DatabaseMetaData`对象是在`Connection`对象上获取的。

#### 二、DatabaseMetaData类

DatabaseMetaData类常用的方法

- getURL(); 返回一个String类对象，代表数据库的URL
- getUserName(); 返回连接当前数据库管理系统的用户名
- isReadOnly(); 返回一个boolean值，指示数据库是否只允许读操作
- getDatabaseProductName(); 返回数据库的产品名称
- getDatabaseProductVersion(); 返回数据库的版本号
- getDriverName(); 返回驱动程序的名称
- getDriverVersion(); 返回驱动程序的版本号
- getCatalogs(); 返回数据库管理系统的数据库名结果集

**样例**：

```java
@Test
public void MetaDataTest(){
    try {
        JDBCUtils.getConnection("database.properties");
        DatabaseMetaData dbmd = JDBCUtils.con.getMetaData();
        System.out.println("getURL()："+dbmd.getURL());
        System.out.println("getUserName()："+dbmd.getUserName());
        System.out.println("isReadOnly()："+dbmd.isReadOnly());
        System.out.println("getDatabaseProductName()："+dbmd.getDatabaseProductName());
        System.out.println("getDatabaseProductVersion()："+dbmd.getDatabaseProductVersion());
        System.out.println("getDriverName()："+dbmd.getDriverName());
        System.out.println("getDriverVersion()："+dbmd.getDriverVersion());
        // 查询数据库管理系统有哪些数据库
        System.out.println("\n查询数据库管理系统有哪些数据库:");
        ResultSet rs = dbmd.getCatalogs();
        while(rs.next()){
            System.out.println(rs.getString(1));
        }
    } catch (SQLException e) {
        e.printStackTrace();
    } finally {
        JDBCUtils.close();
    }
}
```

**结果**：

#### 三、ResultSetMataData类

ResultSetMataData类用于获取关于ResultSet对象中列的类型和属性信息的对象

- getColumnName(int column); 获取指定列的名称
- getColumnCount(); 返回当前ResultSet对象中的列数
- getColumnTypeName(int column); 检索指定列的数据库特定的类型名称
- getColumnDisplaySize(int column); 指示指定列的最大标准宽度，以字符为单位
- isNullable(int column); 指示指定列中的值是否可以为null
- isAutoIncrement(int column); 指示是否自动为指定列进行编号，这样这些列仍然是只读

**举例**：

基于第8章的JDBCUtils中的select()方法改编的

```java
ResultSetMetaData rsmd = rs.getMetaData();
// 得到列的个数
System.out.println("得到列的个数："+rsmd.getColumnCount());
for(int i=0;i<rsmd.getColumnCount();i++) {
    // 得到列的别名(更多用于对象属性名)
    System.out.println("得到列的别名："+rsmd.getColumnLabel(i+1));
    // 得到列名(更多是数据库列名)
    System.out.println("得到列名："+rsmd.getColumnName(i+1));
}
```

**结果**：
