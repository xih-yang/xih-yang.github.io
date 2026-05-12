# 06、JDBC 教程 - JDBC 连接 Oracle 数据库的预编译
- 来源：https://ddkk.com/zhuanlan/db/jdbc/1/6.html
- 分类：缓存数据库
- 分组：教程目录
## JDBC 连接数据库的预编译

### 什么是 SQL 注入

在需要用户输入的地方，用户输入的是 SQL 语句的片段，最终用户输入的 SQL 片段与我们 DAO 中写的 SQL 语句合成一个完整的 SQL 语句！例如用户在登录时输入的用户名和密码都是为 SQL 语句的片段！

### 演示 SQL 注入

**1、** 首先我们需要创建一张用户表，用来存储用户的信息；

**2、** 按照之前的方法，生成数据库脚本文件以后，在PL_SQL里执行脚本文件，以此来建立这张用户表；

**3、** 添加数据到表中；

**4、** 编写一个login()方法！；

貌似完成了登录功能，但是存在极大隐患！

如果输入的用户名和密码是 SQL 语句片段，最终与我们的 login() 方法中的 SQL 语句组合在一起！那将会发生什么呢？

### 防止 SQL 注入

**1、** 过滤用户输入的数据中是否包含非法字符；

**2、** 使用PreparedStatement；

### 源码

- 示例一：

```java
package com.wyx;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
public class JDBCQuery1
{
	public static void main(String[] args)
	{
		// 通过输入不合法的 sql 片段可以破坏原有的 sql 带来极大的风险
		boolean isLogin = login("---", "---' or 'a' = 'a");		
		//boolean isLogin = login("wyx", "321");
		if (isLogin)
		{
			System.out.println("登录成功");
		} else
		{
			System.out.println("用户名或者密码出错误");
		}
	}
	public static boolean login(String uname, String pword)
	{
		boolean isExsit = false;
		// 定义 oracle 数据库的驱动的类
		String driverClass = "oracle.jdbc.OracleDriver";
		// 定义连接的 oracle 的 url
		String url = "jdbc:oracle:thin:@127.0.0.1:1521:orcl";
		// 用户名
		String username = "scott";
		// 密码
		String password = "tiger";
		// 定义 Connection 连接
		Connection conn = null;
		// 定义数据库的 sql 执行对象
		Statement stmt = null;
		// 定义查询结果的 ResultSet 对象
		ResultSet rs = null;
		String querySql = "select * from users where username = '" + uname+ "' and password='" + pword + "'";
		System.out.println(querySql);
		try
		{
			// 注册数据库的驱动程序
			Class.forName(driverClass);
			// 获得数据库的连接
			conn = DriverManager.getConnection(url, username, password);
			// 创建 sql 执行对象
			stmt = conn.createStatement();
			// 执行查询 sql
			rs = stmt.executeQuery(querySql);
			// 是否存在下一条数据
			isExsit = rs.next();
		} catch (Exception e)
		{
			e.printStackTrace();
		} finally
		{
			try
			{
				if (rs != null)
				{
					rs.close();
				}
				if (stmt != null)
				{
					stmt.close();
				}
				if (conn != null)
				{
					conn.close();
				}
			} catch (Exception e)
			{
				e.printStackTrace();
			}
		}
		return isExsit;
	}
}
```

- 示例二

```java
package com.wyx;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
public class JDBCQuery2
{
	public static void main(String[] args)
	{
		boolean isLogin = login("---", "---' or 'a' = 'a");		
		//boolean isLogin = login("魏宇轩", "123");
		if (isLogin)
		{
			System.out.println("登录成功");
		} else
		{
			System.out.println("用户名或者密码出错误");
		}
	}
	public static boolean login(String uname, String pword)
	{
		boolean isExsit = false;
		// 定义oracle数据库的驱动的类
		String driverClass = "oracle.jdbc.OracleDriver";
		// 定义连接的oracle的url
		String url = "jdbc:oracle:thin:@127.0.0.1:1521:orcl";
		// 用户名
		String username = "scott";
		// 密码
		String password = "tiger";
		// 定义Connection连接
		Connection conn = null;
		// 定义预编译的sql执行对象
		PreparedStatement ps = null;
		// 定义查询结果的ResultSet对象
		ResultSet rs = null;
		String querySql = "select * from users where username = ? and password= ?";
		System.out.println(querySql);
		try
		{
			// 注册数据库的驱动程序
			Class.forName(driverClass);
			// 获得数据库的连接
			conn = DriverManager.getConnection(url, username, password);
			// 创建预编译的sql执行对象
			ps = conn.prepareStatement(querySql);
			// 给编译好的sql来设置参数值， 参数值从左到右从1开始依次递增索引
			ps.setString(1, uname);
			ps.setString(2, pword);
			// 执行sql
			rs = ps.executeQuery();
			// 是否存在下一条数据
			isExsit = rs.next();
		} catch (Exception e)
		{
			e.printStackTrace();
		} finally
		{
			try
			{
				if (rs != null)
				{
					rs.close();
				}
				if (ps != null)
				{
					ps.close();
				}
				if (conn != null)
				{
					conn.close();
				}
			} catch (Exception e)
			{
				e.printStackTrace();
			}
		}
		return isExsit;
	}
}
```
