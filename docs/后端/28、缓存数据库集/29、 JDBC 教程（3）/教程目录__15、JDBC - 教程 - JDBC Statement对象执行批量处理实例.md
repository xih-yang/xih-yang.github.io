# 15、JDBC - 教程 - JDBC Statement对象执行批量处理实例
- 来源：https://ddkk.com/zhuanlan/db/jdbc/3/15.html
- 分类：缓存数据库
- 分组：教程目录
以下是使用`Statement`对象的批处理的典型步骤序列 -

- 使用createStatement()方法创建Statement对象。
- 使用setAutoCommit()将自动提交设置为false。
- 使用addBatch()方法在创建的Statement对象上添加SQL语句到批处理中。
- 在创建的Statement对象上使用executeBatch()方法执行所有SQL语句。
- 最后，使用commit()方法提交所有更改。

此示例代码是基于前面章节中完成的环境和数据库设置编写的。

以下代码片段提供了使用`Statement`对象的批量更新示例，将下面代码保存到文件：*BatchingWithStatement.java* -

```java
// Import required packages
import java.sql.*;
public class BatchingWithStatement {
   // JDBC driver name and database URL
   static final String JDBC_DRIVER = "com.mysql.jdbc.Driver";  
   static final String DB_URL = "jdbc:mysql://localhost/EMP";
   //  Database credentials
   static final String USER = "root";
   static final String PASS = "123456";
   public static void main(String[] args) {
   Connection conn = null;
   Statement stmt = null;
   try{
      // Register JDBC driver
      Class.forName("com.mysql.jdbc.Driver");
      // Open a connection
      System.out.println("Connecting to database...");
      conn = DriverManager.getConnection(DB_URL,USER,PASS);
      // Create statement
      System.out.println("Creating statement...");
      stmt = conn.createStatement();
      // Set auto-commit to false
      conn.setAutoCommit(false);
      // First, let us select all the records and display them.
      printRows( stmt );
      // Create SQL statement
      String SQL = "INSERT INTO Employees (id, first, last, age) " + 
                   "VALUES(200,'Curry', 'Stephen', 30)";
      // Add above SQL statement in the batch.
      stmt.addBatch(SQL);
      // Create one more SQL statement
      SQL = "INSERT INTO Employees (id, first, last, age) " +
            "VALUES(201,'Kobe', 'Bryant', 35)";
      // Add above SQL statement in the batch.
      stmt.addBatch(SQL);
      // Create one more SQL statement
      SQL = "UPDATE Employees SET age = 35 " +
            "WHERE id = 100";
      // Add above SQL statement in the batch.
      stmt.addBatch(SQL);
      // Create an int[] to hold returned values
      int[] count = stmt.executeBatch();
      //Explicitly commit statements to apply changes
      conn.commit();
      // Again, let us select all the records and display them.
      printRows( stmt );
      // Clean-up environment
      stmt.close();
      conn.close();
   }catch(SQLException se){
      //Handle errors for JDBC
      se.printStackTrace();
   }catch(Exception e){
      //Handle errors for Class.forName
      e.printStackTrace();
   }finally{
      //finally block used to close resources
      try{
         if(stmt!=null)
            stmt.close();
      }catch(SQLException se2){
      }// nothing we can do
      try{
         if(conn!=null)
            conn.close();
      }catch(SQLException se){
         se.printStackTrace();
      }//end finally try
   }//end try
   System.out.println("Goodbye!");
}//end main
public static void printRows(Statement stmt) throws SQLException{
   System.out.println("Displaying available rows...");
   // Let us select all the records and display them.
   String sql = "SELECT id, first, last, age FROM Employees";
   ResultSet rs = stmt.executeQuery(sql);
   while(rs.next()){
      //Retrieve by column name
      int id  = rs.getInt("id");
      int age = rs.getInt("age");
      String first = rs.getString("first");
      String last = rs.getString("last");
      //Display values
      System.out.print("ID: " + id);
      System.out.print(", Age: " + age);
      System.out.print(", First: " + first);
      System.out.println(", Last: " + last);
   }
   System.out.println();
   rs.close();
}//end printRows()
}//end JDBCExample
```

SQL

编译上面代码，如下 -

```java
F:\worksp\jdbc>javac -Djava.ext.dirs=F:\worksp\jdbc\libs BatchingWithStatement.java
```

Shell

执行上面代码如下所示 -

```java
F:\worksp\jdbc>java -Djava.ext.dirs=F:\worksp\jdbc\libs BatchingWithStatement
Connecting to database...
Thu Jun 01 04:41:05 CST 2017 WARN: Establishing SSL connection without server's identity verification is not recommended. According to MySQL 5.5.45+, 5.6.26+ and 5.7.6+ requirements SSL connection must be established by default if explicit option isn't set. For compliance with existing applications not using SSL the verifyServerCertificate property is set to 'false'. You need either to explicitly disable SSL by setting useSSL=false, or set useSSL=true and provide truststore for server certificate verification.
Creating statement...
Displaying available rows...
ID: 100, Age: 28, First: Max, Last: Su
ID: 101, Age: 25, First: Wei, Last: Wang
ID: 102, Age: 35, First: Xueyou, Last: Zhang
ID: 103, Age: 30, First: Jack, Last: Ma
ID: 106, Age: 28, First: Curry, Last: Stephen
ID: 107, Age: 32, First: Kobe, Last: Bryant
Displaying available rows...
ID: 100, Age: 35, First: Max, Last: Su
ID: 101, Age: 25, First: Wei, Last: Wang
ID: 102, Age: 35, First: Xueyou, Last: Zhang
ID: 103, Age: 30, First: Jack, Last: Ma
ID: 106, Age: 28, First: Curry, Last: Stephen
ID: 107, Age: 32, First: Kobe, Last: Bryant
ID: 200, Age: 30, First: Curry, Last: Stephen
ID: 201, Age: 35, First: Kobe, Last: Bryant
Goodbye!
F:\worksp\jdbc>
```
