# 13、JDBC - 教程 - JDBC异常
- 来源：https://ddkk.com/zhuanlan/db/jdbc/3/13.html
- 分类：缓存数据库
- 分组：教程目录
异常处理允许我们以受控的方式处理异常情况，而不是直接退出程序，例如程序定义的错误。

发生异常时可以抛出异常。术语“**异常**”表示当前的程序执行停止，并且被重定向到最近的适用的`catch`子句。如果没有适用的`catch`子句存在，则程序的执行结束。

JDBC异常处理与Java异常处理非常相似，但对于JDBC，要处理的最常见异常是`java.sql.SQLException`。

### SQLException方法

驱动程序和数据库中都会发生`SQLException`。 发生这种异常时，`SQLException`类型的对象将被传递给`catch`子句。

传递的`SQLException`对象具有以下可用于检索有关异常信息的方法 -

方法
描述

getErrorCode( )
获取与异常关联的错误代码。

getMessage( )
获取驱动程序处理的错误的JDBC驱动程序的错误消息，或获取数据库错误的Oracle错误代码和消息。

getSQLState( )
获取XOPEN SQLstate字符串。 对于JDBC驱动程序错误，不会从此方法返回有用的信息。 对于数据库错误，返回五位数的XOPEN SQLstate代码。 此方法可以返回null。

getNextException( )
获取异常链中的下一个Exception对象。

printStackTrace( )
打印当前异常或可抛出的异常，并将其追溯到标准错误流。

printStackTrace(PrintStream s)
将此throwable及其回溯打印到指定的打印流。

printStackTrace(PrintWriter w)
打印这个throwable，它是回溯到指定的打印器(PrintWriter)。

通过利用`Exception`对象提供的信息，可以捕获异常并适当地继续执行程序。下面是一个`try`块的一般形式 -

```java
try {
   // Your risky code goes between these curly braces!!!
}
catch(Exception ex) {
   // Your exception handling code goes between these 
   // curly braces, similar to the exception clause 
   // in a PL/SQL block.
}
finally {
   // Your must-always-be-executed code goes between these 
   // curly braces. Like closing database connection.
}
```

Java

### 实例

学习研究以下示例代码以了解*try …. catch … finally*块的用法。将下面代码保存到文件：*TryCatchFinally.java* 中，

```java
//STEP 1. Import required packages
import java.sql.*;
public class TryCatchFinally {
   // JDBC driver name and database URL
   static final String JDBC_DRIVER = "com.mysql.jdbc.Driver";  
   static final String DB_URL = "jdbc:mysql://localhost/EMP";
   //  Database credentials
   static final String USER = "root";
   static final String PASS = "123456";
   public static void main(String[] args) {
   Connection conn = null;
   try{
      //STEP 2: Register JDBC driver
      Class.forName("com.mysql.jdbc.Driver");
      //STEP 3: Open a connection
      System.out.println("Connecting to database...");
      conn = DriverManager.getConnection(DB_URL,USER,PASS);
      //STEP 4: Execute a query
      System.out.println("Creating statement...");
      Statement stmt = conn.createStatement();
      String sql;
      sql = "SELECT id, first, last, age FROM Employees";
      ResultSet rs = stmt.executeQuery(sql);
      //STEP 5: Extract data from result set
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
      //STEP 6: Clean-up environment
      rs.close();
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
         if(conn!=null)
            conn.close();
      }catch(SQLException se){
         se.printStackTrace();
      }//end finally try
   }//end try
   System.out.println("Goodbye!");
}//end main
}//end JDBCExample
```

Java

现在编译上面例子中代码如下 -

```java
F:\worksp\jdbc>javac -Djava.ext.dirs=F:\worksp\jdbc\libs TryCatchFinally.java
```

Shell

执行上面编译后的代码，得到以下结果 -

```java
F:\worksp\jdbc>java -Djava.ext.dirs=F:\worksp\jdbc\libs TryCatchFinally
Connecting to database...
Thu Jun 01 02:59:01 CST 2017 WARN: Establishing SSL connection without server's identity verification is not recommended. According to MySQL 5.5.45+, 5.6.26+ and 5.7.6+ requirements SSL connection must be established by default if explicit option isn't set. For compliance with existing applications not using SSL the verifyServerCertificate property is set to 'false'. You need either to explicitly disable SSL by setting useSSL=false, or set useSSL=true and provide truststore for server certificate verification.
Creating statement...
ID: 100, Age: 28, First: Max, Last: Su
ID: 101, Age: 25, First: Wei, Last: Wang
ID: 102, Age: 35, First: Xueyou, Last: Zhang
ID: 103, Age: 30, First: Jack, Last: Ma
ID: 106, Age: 28, First: Curry, Last: Stephen
ID: 107, Age: 32, First: Kobe, Last: Bryant
Goodbye!
F:\worksp\jdbc>
```
