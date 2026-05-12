# 09、JDBC 教程 - JDBC批处理
- 来源：https://ddkk.com/zhuanlan/db/jdbc/1/9.html
- 分类：缓存数据库
- 分组：教程目录
## JDBC 批处理

### PreparedStatement 批处理

**1、** 批处理就是一批一批的处理，而不是一个一个的处理！；

**2、** 当你有100条SQL语句要执行时，一次向服务器发送一条SQL语句，这么做效率上很差！处理的方案是使用批处理，即一次向服务器发送多条SQL语句，然后由服务器一次性处理；

**3、** PreparedStatement的批处理有所不同，因为每个PreparedStatement对象都绑定一条SQL模板所以向PreparedStatement中添加的不是SQL语句，而是给“?”赋值；

**4、** 示例代码（完整代码见文末）：；

**5、** 结果图:；

### 源码

```java
package com.wyx;
import java.sql.Connection;
import java.sql.Date;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
public class JDBCUpdate3
{
	public static void main(String[] args)
	{
		savePersonBatch();
	}
	public static void savePersonBatch()
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
		String addSql = "insert into person values(personid.nextval,?,?,?)";
		try
		{
			// 注册数据库的驱动程序
			Class.forName(driverClass);
			// 获得数据库的连接
			conn = DriverManager.getConnection(url, username, password);
			// 创建sql执行对象
			ps = conn.prepareStatement(addSql);
			for (int i = 0; i < 100; i++)
			{
				ps.setString(1, "魏宇轩");
				ps.setString(2, "1");
				ps.setDate(3, new Date(new java.util.Date().getTime()));
				ps.addBatch();
			}
			ps.executeBatch();
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
