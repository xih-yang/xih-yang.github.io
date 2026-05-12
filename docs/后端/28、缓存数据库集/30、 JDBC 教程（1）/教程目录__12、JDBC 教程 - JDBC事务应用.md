# 12、JDBC 教程 - JDBC事务应用
- 来源：https://ddkk.com/zhuanlan/db/jdbc/1/12.html
- 分类：缓存数据库
- 分组：教程目录
## JDBC 事务应用

### Oracle 中的事务

**1、** 在默认情况下，每执行一条增、删、改SQL语句，都是一个单独的事务如果需要在一个事务中包含多条SQL语句，那么需要开启事务和结束事务；

**2、** 结束事务：commit或rollback；

**3、** 在执行增、删、改一条SQL就开启了一个事务（事务的起点），然后可以去执行多条SQL语句，最后要结束事务，commit表示提交，即事务中的多条SQL语句所做出的影响会持久化到数据库中或者rollback，表示回滚，即回滚到事务的起点，之前做的所有操作都被撤消了！；

**4、** 下面演示魏宇轩给wyx转账1000元的示例；

```java
UPDATE account SET balance=balance-10000 WHERE id=1;
UPDATE account SET balance=balance+10000 WHERE id=2;
ROLLBACK;--回滚
```

```java
UPDATE account SET balance=balance-10000 WHERE id=1;
UPDATE account SET balance=balance+10000 WHERE id=2;
COMMIT;--提交
```

### jdbc 中的事务

**1、** Connection的三个方法与事务相关：

① setAutoCommit(boolean)：设置是否为自动提交事务，如果 true（默认值就是 true）表示自动提交，也就是每条执行的 SQL语句都是一个单独的事务，如果设置 false，那么就相当于开启了事务了；

② commit()：提交结束事务；

③ rollback()：回滚结束事务。

**2、** 初始状态；

**3、** 出现异常；

**4、** 未出现异常；

### 源码

- DBUtils 类

```java
package com.wyx.jdbc.utils;
import java.io.InputStream;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Properties;
public class DBUtils
{
	public static Connection getConn()
	{
		InputStream in = DBUtils.class.getClassLoader().getResourceAsStream(
				"db.properties");
		Properties prop = new Properties();
		Connection conn = null;
		try
		{
			prop.load(in);
			String driverClass = prop.getProperty("driverClass");
			String url = prop.getProperty("url");
			String username = prop.getProperty("username");
			String password = prop.getProperty("password");
			// 注册驱动
			Class.forName(driverClass);
			conn = DriverManager.getConnection(url, username, password);
		} catch (Exception e)
		{
			e.printStackTrace();
		}
		return conn;
	}
	public static PreparedStatement getPstmt(String sql)
	{
		Connection conn = getConn();
		PreparedStatement pstmt = null;
		try
		{
			pstmt = conn.prepareStatement(sql);
		} catch (SQLException e)
		{
			e.printStackTrace();
		}
		return pstmt;
	}
	public static void closeUpdateRes(PreparedStatement ps)
	{
		if (ps != null)
		{
			try
			{
				Connection conn = ps.getConnection();
				ps.close();
				if (conn != null)
				{
					conn.close();
				}
			} catch (SQLException e)
			{
				e.printStackTrace();
			}
		}
	}
	public static void closeQueryRes(ResultSet rs)
	{
		if (rs != null)
		{
			Statement pstmt;
			try
			{
				pstmt = rs.getStatement();
				if (pstmt != null)
				{
					Connection conn = pstmt.getConnection();
					rs.close();
					pstmt.close();
					if (conn != null)
					{
						conn.close();
					}
				}
			} catch (SQLException e)
			{
				e.printStackTrace();
			}
		}
	}
}
```

- 主类 JDBCTran

```java
package com.wyx.jdbc;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import com.wyx.jdbc.utils.DBUtils;
public class JDBCTran
{
	public static void main(String[] args)
	{
		String sql = "update myaccount t set t.blance = t.blance - ? where t.id =?";
		String sql2 = "update myaccount t set t.blance = t.blance + ? where t.id =?";
		Connection conn = DBUtils.getConn();
		PreparedStatement ps = null;
		PreparedStatement ps1 = null;
		try
		{
			ps = conn.prepareStatement(sql);
			ps1 = conn.prepareStatement(sql);
			// 设置事务是手动提交，让当前的连接connection的所有的数据库变更的sql都在同一个事务之内，要么同时成功，要么同时失败
			conn.setAutoCommit(false);
			ps.setBigDecimal(1, new BigDecimal(1000));
			ps.setInt(2, 1);
			ps.executeUpdate();
			// 在两个事物执行途中抛出异常，查看是否同时成功同时失败
			if (false)
			{
				throw new Exception();
			}
			ps1.setBigDecimal(1, new BigDecimal(1000));
			ps1.setInt(2, 2);
			ps1.executeUpdate();
			// 手动提交事务
			conn.commit();
		} catch (Exception e)
		{
			try
			{
				// 如果发生异常事务就回滚
				conn.rollback();
			} catch (SQLException e1)
			{
				e1.printStackTrace();
			}
			e.printStackTrace();
		} finally
		{
			DBUtils.closeUpdateRes(ps1);
			DBUtils.closeUpdateRes(ps);
		}
	}
}
```

为了方便，直接提供源码文件，请使用 MyEclipse 导入工程打开查看，[点此下载](https://download.csdn.net/download/qq_36260974/11133635)。
