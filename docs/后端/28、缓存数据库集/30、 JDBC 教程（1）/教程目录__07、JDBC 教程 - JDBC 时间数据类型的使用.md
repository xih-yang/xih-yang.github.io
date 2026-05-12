# 07、JDBC 教程 - JDBC 时间数据类型的使用
- 来源：https://ddkk.com/zhuanlan/db/jdbc/1/7.html
- 分类：缓存数据库
- 分组：教程目录
## JDBC 对时间类型的处理

### Java 中的时间类型

**1、** java.sql包下给出三个与数据库相关的日期时间类型，分别是：；

① `Date`：表示日期，只有年月日，没有时分秒。会丢失时间；

② `Time`：表示时间，有年月日时分秒；

③ `Timestamp`：表示时间戳，有年月日时分秒，以及毫秒。

这三个类都是 java.util.Date 的子类。

`java.util.Date` – 年月日时分秒

`java.util.Calendar` – Date getTime()

**2、** 新建立一张时间测试表；

**3、** 导出为脚本文件，在使用PL_SQL工具执行，以在Oracle数据库中生成时间测试表；

**4、** 完整代码见文末；

**5、** 将上面存入的日期时间数据查询读取出来；

### 源码

```java
package com.wyx;
import java.sql.Connection;
import java.sql.Date;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Time;
import java.sql.Timestamp;
public class JDBCUpdate1
{
	public static void main(String[] args)
	{
		getTime();
	}
	public static void saveTime()
	{
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
		// 定义数据库的sql执行对象
		PreparedStatement ps = null;
		// 定义要执行的sql
		String addSql = "insert into  time_test values(?,?,?)";
		try
		{
			// 注册数据库的驱动程序
			Class.forName(driverClass);
			// 获得数据库的连接
			conn = DriverManager.getConnection(url, username, password);
			// 创建sql执行对象
			ps = conn.prepareStatement(addSql);
			java.util.Date date = new java.util.Date();
			ps.setDate(1, new Date(date.getTime()));
			ps.setTime(2, new Time(date.getTime()));
			ps.setTimestamp(3, new Timestamp(date.getTime()));
			int count = ps.executeUpdate();
			System.out.println("数据响应条数：" + count);
		} catch (Exception e)
		{
			e.printStackTrace();
		} finally
		{
			try
			{
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
	}
	public static void getTime()
	{
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
		// 定义数据库的sql执行对象
		PreparedStatement ps = null;
		// 定义结果集对象
		ResultSet rs = null;
		// 定义要执行的sql
		String sql = "select * from time_test";
		try
		{
			// 注册数据库的驱动程序
			Class.forName(driverClass);
			// 获得数据库的连接
			conn = DriverManager.getConnection(url, username, password);
			// 创建sql执行对象
			ps = conn.prepareStatement(sql);
			rs = ps.executeQuery();
			while (rs.next())
			{
				Date date = rs.getDate(1);
				Time time = rs.getTime(2);
				Timestamp timestamp = rs.getTimestamp(3);
				System.out.println("日期：" + date);
				System.out.println("时间：" + time);
				System.out.println("时间戳：" + timestamp);
			}
			//也可以使用 java.util下的date来接收
			/*
			while (rs.next())
			{
				java.util.Date date = rs.getDate(1);
				java.util.Date time = rs.getTime(2);
				java.util.Date timestamp = rs.getTimestamp(3);
				System.out.println("日期：" + date);
				System.out.println("时间：" + time);
				System.out.println("时间戳：" + timestamp);
			}*/
			/*while (rs.next())
			{
				java.util.Date date = rs.getDate(1);
				java.util.Date time = rs.getTimestamp(2);
				java.util.Date timestamp = rs.getTimestamp(3);
				System.out.println("日期：" + date);
				System.out.println("时间：" + time);
				System.out.println("时间戳：" + timestamp);
			}*/
		} catch (Exception e)
		{
			e.printStackTrace();
		} finally
		{
			try
			{
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
	}
}
```
