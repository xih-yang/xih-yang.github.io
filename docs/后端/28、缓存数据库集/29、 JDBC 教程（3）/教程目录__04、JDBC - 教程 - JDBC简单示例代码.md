# 04、JDBC - 教程 - JDBC简单示例代码
- 来源：https://ddkk.com/zhuanlan/db/jdbc/3/4.html
- 分类：缓存数据库
- 分组：教程目录
本文章教程中将演示如何创建一个简单的JDBC应用程序的示例。 这将显示如何打开数据库连接，执行SQL查询并显示结果。

这个示例代码中涉及所有步骤，一些步骤将在本教程的后续章节中进行说明。

### 创建JDBC应用程序

构建JDBC应用程序涉及以下六个步骤 -

- **导入包**：需要包含包含数据库编程所需的JDBC类的包。 大多数情况下，使用import java.sql.*就足够了。
- **注册JDBC驱动程序**：需要初始化驱动程序，以便可以打开与数据库的通信通道。
- **打开一个连接**：需要使用DriverManager.getConnection()方法创建一个Connection对象，它表示与数据库的物理连接。
- **执行查询**：需要使用类型为Statement的对象来构建和提交SQL语句到数据库。
- **从结果集中提取数据**：需要使用相应的ResultSet.getXXX()方法从结果集中检索数据。
- **清理环境**：需要明确地关闭所有数据库资源，而不依赖于JVM的垃圾收集。

### 示例代码

当您以后需要创建自己的JDBC应用程序时，可将此示例可以作为模板使用，建议您收藏好此网页。

此示例代码是基于上一章完成的环境和数据库设置之后编写的。

在*FirstExample.java* (F:\worksp\jdbc\FirstExample.java)中复制并粘贴以下示例，编译并运行如下 -

```java
//STEP 1. Import required packages
import java.sql.*;
public class FirstExample {
   // JDBC driver name and database URL
   static final String JDBC_DRIVER = "com.mysql.jdbc.Driver";  
   static final String DB_URL = "jdbc:mysql://localhost/emp";
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
      //STEP 4: Execute a query
      System.out.println("Creating statement...");
      stmt = conn.createStatement();
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
   System.out.println("There are so thing wrong!");
}//end main
}//end FirstExample
```

Java

把上面代码存放到 *F:\worksp\jdbc\FirstExample.java* 文件中，并创建一个目录：*F:\worksp\jdbc\libs*，下载 `mysql-connector-java-5.1.40-bin.jar` 放入到*F:\worksp\jdbc\libs* 目录中。

下载地址：[MySQL :: Download MySQL Connector/J (Archived Versions)](http://downloads.mysql.com/archives/c-j/)

使用命令行编译Java程序并加载指定目录中的Jar包(`mysql-connector-java-5.1.40-bin.jar`)：

```java
F:\worksp\jdbc> javac -Djava.ext.dirs=./libs FirstExample.java
##-- 或者
F:\worksp\jdbc> javac -Djava.ext.dirs=F:\worksp\jdbc\libs FirstExample.java
```

Shell

编译上面代码后，得到以下结果 -

```java
## F:\worksp\jdbc>javac -Djava.ext.dirs=./libs FirstExample.java
## 运行程序 -
F:\worksp\jdbc>java -Djava.ext.dirs=./libs FirstExample
Connecting to database...
Tue May 30 22:43:18 CST 2017 WARN: Establishing SSL connection without server's identity verification is not recommended. According to MySQL 5.5.45+, 5.6.26+ and 5.7.6+ requirements SSL connection must be established by default if explicit option isn't set. For compliance with existing applications not using SSL the verifyServerCertificate property is set to 'false'. You need either to explicitly disable SSL by setting useSSL=false, or set useSSL=true and provide truststore for server certificate verification.
Creating statement...
ID: 100, Age: 28, First: Max, Last: Su
ID: 101, Age: 25, First: Wei, Last: Wang
ID: 102, Age: 30, First: Xueyou, Last: Zhang
ID: 103, Age: 28, First: Jack, Last: Ma
There are so thing wrong!
F:\worksp\jdbc>
```

Shell

完整的执行过程如下 -

或者使用 `Eclipse` 或其它IDE创建代码执行。
