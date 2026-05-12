# 11、JDBC - 教程 - JDBC事务提交/回滚实例
- 来源：https://ddkk.com/zhuanlan/db/jdbc/3/11.html
- 分类：缓存数据库
- 分组：教程目录
以下是使用事务教程中描述的提交和回滚的代码示例。

此示例代码是基于前面章节中完成的环境和数据库设置编写的。

复制并将以下示例代码保存到：*CommitAndRollback.java* 中，编译并运行如下 -

```java
//STEP 1. Import required packages
import java.sql.*;
public class CommitAndRollback {
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
      //STEP 2: Register JDBC driver
      Class.forName("com.mysql.jdbc.Driver");
      //STEP 3: Open a connection
      System.out.println("Connecting to database...");
      conn = DriverManager.getConnection(DB_URL,USER,PASS);
      //STEP 4: Set auto commit as false.
      conn.setAutoCommit(false);
      //STEP 5: Execute a query to create statment with
      // required arguments for RS example.
      System.out.println("Creating statement...");
      stmt = conn.createStatement(
                           ResultSet.TYPE_SCROLL_INSENSITIVE,
                           ResultSet.CONCUR_UPDATABLE);
      //STEP 6: INSERT a row into Employees table
      System.out.println("Inserting one row....");
      String SQL = "INSERT INTO Employees " +
                    "VALUES (106, 28, 'Curry', 'Stephen')";
      stmt.executeUpdate(SQL);  
      //STEP 7: INSERT one more row into Employees table
      SQL = "INSERT INTO Employees " +
                    "VALUES (107, 32, 'Kobe', 'Bryant')";
      stmt.executeUpdate(SQL);
      //STEP 8: Commit data here.
      System.out.println("Commiting data here....");
      conn.commit();
      //STEP 9: Now list all the available records.
      String sql = "SELECT id, first, last, age FROM Employees";
      ResultSet rs = stmt.executeQuery(sql);
      System.out.println("List result set for reference....");
      printRs(rs);
      //STEP 10: Clean-up environment
      rs.close();
      stmt.close();
      conn.close();
   }catch(SQLException se){
      //Handle errors for JDBC
      se.printStackTrace();
      // If there is an error then rollback the changes.
      System.out.println("Rolling back data here....");
      try{
         if(conn!=null)
            conn.rollback();
      }catch(SQLException se2){
         se2.printStackTrace();
      }//end try
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
   public static void printRs(ResultSet rs) throws SQLException{
      //Ensure we start with first row
      rs.beforeFirst();
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
   }//end printRs()
}//end JDBCExample
```

Java

编译并运行结果如下 -

```java
F:\worksp\jdbc>javac -Djava.ext.dirs=F:\worksp\jdbc\libs CommitAndRollback.java
F:\worksp\jdbc>java -Djava.ext.dirs=F:\worksp\jdbc\libs CommitAndRollback
Connecting to database...
Thu Jun 01 02:30:04 CST 2017 WARN: Establishing SSL connection without server's identity verification is not recommended. According to MySQL 5.5.45+, 5.6.26+ and 5.7.6+ requirements SSL connection must be established by default if explicit option isn't set. For compliance with existing applications not using SSL the verifyServerCertificate property is set to 'false'. You need either to explicitly disable SSL by setting useSSL=false, or set useSSL=true and provide truststore for server certificate verification.
Creating statement...
Inserting one row....
Commiting data here....
List result set for reference....
ID: 100, Age: 28, First: Max, Last: Su
ID: 101, Age: 25, First: Wei, Last: Wang
ID: 102, Age: 35, First: Xueyou, Last: Zhang
ID: 103, Age: 30, First: Jack, Last: Ma
ID: 106, Age: 28, First: Curry, Last: Stephen
ID: 107, Age: 32, First: Kobe, Last: Bryant
Goodbye!
F:\worksp\jdbc>
```
