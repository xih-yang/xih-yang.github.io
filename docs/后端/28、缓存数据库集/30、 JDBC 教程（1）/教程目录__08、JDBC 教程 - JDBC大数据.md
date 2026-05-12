# 08、JDBC 教程 - JDBC大数据
- 来源：https://ddkk.com/zhuanlan/db/jdbc/1/8.html
- 分类：缓存数据库
- 分组：教程目录
## JDBC 对大数据的处理

### 什么是大数据

**1、** 所谓大数据，就是大的字节数据，或大的字符数据标准SQL中提供了如下类型来保存大数据类型：；

**2、** 在mysql中没有提供tinyclob、clob、mediumclob、longclob四种类型，而是使用如下四种类型来处理文本大数据：；

**3、** 首先我们需要创建一张表；

**4、** 同样我们生成脚本文件后再PL_SQL当中执行；

**5、** 向数据库插入二进制数据需要使用PreparedStatement为原setBinaryStream(int,InputSteam)方法来完成（完整代码见文末）；

**6、** 结果图；

**7、** 读取二进制数据，需要在查询后使用ResultSet类的getBinaryStream()方法来获取输入流对象也就是说，PreparedStatement有setXXX()，那么ResultSet就有getXXX()（完整代码见文末）；

**8、** 还有一种方法，就是把要存储的数据包装成Blob类型，然后调用PreparedStatement的setBlob()方法来设置数据，此处不再介绍；

### 源码

```java
package com.wyx;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.Reader;
import java.io.Writer;
import java.sql.Clob;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
public class JDBCUpdate2
{
	public static void main(String[] args)
	{
		// saveLob();
		getLob();
	}
	public static void saveLob()
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
		String addSql = "insert into  lob_test values(?,?)";
		try
		{
			// 注册数据库的驱动程序
			Class.forName(driverClass);
			// 获得数据库的连接
			conn = DriverManager.getConnection(url, username, password);
			// 创建sql执行对象
			ps = conn.prepareStatement(addSql);
			// 定义二进制文件输入流
			InputStream in = new FileInputStream("F:/administrator/Desktop/wyx.jpg");
			// 定义大文本的文件的输入流
			Reader reader = new FileReader("F:/administrator/Desktop/wyx.txt");
			// 设置二进制参数
			ps.setBinaryStream(1, in);
			// 设置大文本的参数
			ps.setClob(2, reader);
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
	public static void getLob()
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
		String sql = "select * from lob_test";
		InputStream in = null;
		Reader reader = null;
		OutputStream out = null;
		Writer writer = null;
		try
		{
			// 注册数据库的驱动程序
			Class.forName(driverClass);
			// 获得数据库的连接
			conn = DriverManager.getConnection(url, username, password);
			// 创建sql执行对象
			ps = conn.prepareStatement(sql);
			// 查询
			rs = ps.executeQuery();
			// 让游标向下移动
			rs.next();
			// 获得二进制的输入流
			in = rs.getBinaryStream(1);
			// 获得大文本对象
			Clob clob = rs.getClob(2);
			// 获得reader对象
			reader = clob.getCharacterStream();
			// 把图片写入到硬盘上
			out = new FileOutputStream("F:/administrator/Desktop/wyx[副本].jpg");
			byte[] bytes = new byte[1024];
			int length = 0;			
			while ((length = in.read(bytes)) != -1)
			{
				out.write(bytes, 0, length);
			}
			out.flush();
			writer = new FileWriter("F:/administrator/Desktop/wyx[副本].txt");
			char[] cs = new char[1024];
			int length1 = 0;
			while ((length1 = reader.read(cs)) != -1)
			{
				writer.write(cs, 0, length1);
			}
			writer.flush();
		} catch (Exception e)
		{
			e.printStackTrace();
		} finally
		{
			try
			{
				if (writer != null)
				{
					writer.close();
				}
				if (out != null)
				{
					out.close();
				}
				if (reader != null)
				{
					reader.close();
				}
				if (in != null)
				{
					in.close();
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
	}
}
```
