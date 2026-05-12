# 05、JDBC 教程 - JDBC 操纵 Oracle 数据库的查询操作
- 来源：https://ddkk.com/zhuanlan/db/jdbc/1/5.html
- 分类：缓存数据库
- 分组：教程目录
## 应用示例

### 在第一个 JDBC 程序的基础上

**1、** 我们先多插入几条数据到数据库；

**2、** 获取数据库数据的第一种方法：；

**3、** 获取数据库数据的第二种方法：；

**4、** 获取数据库数据的第三种方法：；

**5、** 获取数据库数据的第四种方法：；

**6、** 获取数据库数据的第四种方法：；

### 源码

```java
package com.wyx;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
public class JDBCQuery
{
	public static void main(String[] args)
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
		Statement stmt = null;
		// 定义查询结果的ResultSet对象
		ResultSet rs = null;
		//定义sql插入语句
		//String addsql = "insert into person(id,name,gender,birthday)values(personid.nextval,'李四','1',to_date('1996-09-23','yyyy-mm-dd'))";
		//定义sql 查询语句
		String querysql = "select * from person";
		try
		{
			// 注册数据库的驱动程序
			Class.forName(driverClass);
			// 获得数据库的连接
			conn = DriverManager.getConnection(url, username, password);
			// 创建sql执行对象
			stmt = conn.createStatement();		
			// 执行查询
			rs = stmt.executeQuery(querysql);
			//通过列名来获取数据
			/*
			while (rs.next())
			{
				String id = rs.getString("id");
				String name = rs.getString("name");
				String gender = rs.getString("gender");
				String birthday = rs.getString("birthday");
				System.out.println("人员编号：" + id + "     姓名：" + name+ "       性别：" + gender + "       生日：" + birthday); 
			}
			*/
			//通过列名序号来获取数据
			/*
			while (rs.next())
			{
				String id = rs.getString(1);
				String name = rs.getString(2);
				String gender = rs.getString(3);
				String birthday = rs.getString(4);
				System.out.println("人员编号：" + id + "     姓名：" + name+ "       性别：" + gender + "       生日：" + birthday);
			}
			*/
			//通过列名来获取数据（数据类型转换）
			/*
			while (rs.next())
			{
				Integer id = rs.getInt("id");
				String name = rs.getString("name");
				String gender = rs.getString("gender");
				Date birthday = rs.getDate("birthday");
				System.out.println("人员编号：" + id + "     姓名：" + name + "       地址：" + gender + "       生日：" + birthday);
			}
			*/
			//通过列名来获取数据（使用 父类 object）
			/*
			while (rs.next())
			{
				Object id = rs.getObject("id");
				Object name = rs.getObject("name");
				Object gender = rs.getObject("gender");
				Object birthday = rs.getObject("birthday");
				System.out.println("人员编号：" + id + "     姓名：" + name+ "       地址：" + gender + "       生日：" + birthday);			
			}	
			*/
			// 获得当前表的元数据：表名，列名，列的数量
			ResultSetMetaData rsmd = rs.getMetaData();
			// 获得列的数量
			Integer cols = rsmd.getColumnCount();
			System.out.println("列数：" + cols);
			List<String> listColum = new ArrayList<String>();
			for (int i = 1; i <= 4; i++)
			{
				// 获得列名
				String columnName = rsmd.getColumnName(i);
				listColum.add(columnName);
			}
			// 根据获得的列名的元数据来获得该列名下的值
			while (rs.next())
			{
				for (String cname : listColum)
				{
					String val = rs.getString(cname);
					System.out.print(cname + ":  " + val + "    ");
				}
				System.out.println();
			}
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
	}
}
```
