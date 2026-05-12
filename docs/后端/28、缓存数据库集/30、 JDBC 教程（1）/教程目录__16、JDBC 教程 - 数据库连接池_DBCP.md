# 16、JDBC 教程 - 数据库连接池_DBCP
- 来源：https://ddkk.com/zhuanlan/db/jdbc/1/16.html
- 分类：缓存数据库
- 分组：教程目录
## DBCP 的概念

- DBCP 是 Apache 提供的一款开源免费的数据库连接池！
- Hibernate3.0 之后不再对 DBCP 提供支持！因为 Hibernate 声明 DBCP 有致命的缺欠！DBCP 因为 Hibernate 的这一毁谤很是生气，并且说自己没有缺欠。

## DBCP 的基本配置

> driverClassName=oraclel.jdbc.OracleDriver
> url=jdbc:oracle:thin:@127.0.0.1:1521:orcl
> username=scott
> password=tiger
> initialSize ：连接池启动时创建的初始化连接数量（默认值为0）
> maxActive ：连接池中可同时连接的最大的连接数（默认值为8）
> maxIdle：连接池中最大的空闲的连接数，超过的空闲连接将被释放，如果设置为负数表示不限制（默认为8个)
> minIdle：连接池中最小的空闲的连接数
> maxWait ：最大等待时间，当没有可用连接时，连接池等待连接释放的最大时间，超过该时间限制会抛出异常，如果设置-1表示无限等待（默认为无限，调整为60000ms，避免因线程池不够用，而导致请求被无限制挂起）

## DBCP 的使用

[点我下载](https://pan.baidu.com/s/1LhYzVEjdCgLJUJOa61WUlQ)，提取码：oplo 。

### 示例

**1、** 新建工程；

**2、** 新建配置文件；

**3、** 新建包，建类；

**4、** 结果图；

## 源码

```java
package com.wyx;
import java.io.InputStream;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Properties;
import javax.sql.DataSource;
import org.apache.commons.dbcp.BasicDataSourceFactory;
public class jdbc_pool
{
	public static void main(String[] args)
	{
		// 读取连接池的配置文件
		InputStream in = jdbc_pool.class.getClassLoader().getResourceAsStream("dbcp.properties");
		Properties prop = new Properties();
		PreparedStatement ps = null;
		ResultSet rs = null;
		try
		{
			// 加载配置文件
			prop.load(in);
			// 创建数据库的连接池
			DataSource ds = BasicDataSourceFactory.createDataSource(prop);
			// 拿到连接
			Connection conn = ds.getConnection();
			//System.out.println(conn);
			ps = conn.prepareStatement("select * from person");
			rs = ps.executeQuery();
			while (rs.next())
			{
				System.out.println("ID: " + rs.getString(1) + "    姓名："+ rs.getString(2));
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
				if (ps != null)
				{
					ps.close();
				}
			} catch (SQLException e)
			{
				e.printStackTrace();
			}
		}
	}
}
```

[源码工程文件下载](https://download.csdn.net/download/qq_36260974/11158845)
