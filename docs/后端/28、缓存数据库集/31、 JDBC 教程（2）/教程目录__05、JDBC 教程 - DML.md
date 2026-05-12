# 05、JDBC 教程 - DML
- 来源：https://ddkk.com/zhuanlan/db/jdbc/2/5.html
- 分类：缓存数据库
- 分组：教程目录
## (一)环境搭建

前提条件：建好**account表**，如下：

在完成以上需求之前先来看看我们在**JDBC快速入门** 里面写的Demo01：

存在着**内存泄漏**的问题，因为这种写法的意思是只有成功执行了sql后才释放资源

而main函数是**按顺序执行的**，前面的没执行完是不会执行后面的

我们要**加以改进**，如下：

我们把**Statement**和**Connection**对象都声明为**全局**，以便于释放

我们把**释放资源**的代码写在**finally**里面，无论sql语句是否成功执行，资源都会**被释放**

## (二)添加一条记录

```java
public class JDBCDemo02 {
    public static void main(String[] args) {
        Statement stmt = null;
        Connection conn = null;
        //1. 注册驱动
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            //2. 定义sql
            String sql = "insert into account values(null,'王五',3000)";
            //3. 获取Connection对象
            conn = DriverManager.getConnection("jdbc:mysql:///test03", "root", "root");
            //4. 获取执行sql的对象 Statement
            stmt = conn.createStatement();
            //5. 执行sql
            long count = stmt.executeLargeUpdate(sql); //影响的行数
            //6. 处理结果
            System.out.println(count);
            if (count > 0) {
                System.out.println("添加成功！");
            } else {
                System.out.println("添加失败！");
            }
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            // stmt.close();
            // 避免空指针异常
            if (stmt != null) {
                try {
                    stmt.close();
                } catch (SQLException e) {
                    e.printStackTrace();
                }
            }
            if (conn != null) {
                try {
                    conn.close();
                } catch (SQLException e) {
                    e.printStackTrace();
                }
            }
        }
    }
}
```

## (三)修改记录

```java
//2. 定义sql
String sql = "update account set balance = 1500 where id = 3";
```

```java
if (count > 0) {
    System.out.println("修改成功！");
 } else {
    System.out.println("修改失败！");
 }
```

## (四)删除一条记录

```java
//2. 定义sql
String sql = "delete from account where id = 3";
```

```java
if (count > 0) {
    System.out.println("删除成功！");
} else {
    System.out.println("删除失败！");
}
```
