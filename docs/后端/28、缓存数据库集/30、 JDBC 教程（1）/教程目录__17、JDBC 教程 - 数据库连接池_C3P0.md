# 17、JDBC 教程 - 数据库连接池_C3P0
- 来源：https://ddkk.com/zhuanlan/db/jdbc/1/17.html
- 分类：缓存数据库
- 分组：教程目录
## C3P0 简介

- C3P0 也是开源免费的连接池！C3P0 被很多人看好！
-
- C3P0 中池类是：ComboPooledDataSource。

## C3P0 的使用

点我下载，提取码：o3fh 。

### 示例

**1、** 资源包导入；

**2、** 新建xml文件；

说明：

```java
<!--连接池中保留的最大连接数。默认值: 15 -->   
<property name="maxPoolSize" value="20"/>  
<!-- 连接池中保留的最小连接数，默认为：3-->  
<property name="minPoolSize" value="2"/>  
<!-- 初始化连接池中的连接数，取值应在minPoolSize与maxPoolSize之间，默认为3-->  
<property name="initialPoolSize" value="2"/>  
<!--最大空闲时间，60秒内未使用则连接被丢弃。若为0则永不丢弃。默认值: 0 -->   
 <property name="maxIdleTime">60</property>  
<!-- 当连接池连接耗尽时，客户端调用getConnection()后等待获取新连接的时间，超时后将抛出SQLException，如设为0则无限期等待。单位毫秒。默认: 0 -->   
<property name="checkoutTimeout" value="3000"/>  
<!--当连接池中的连接耗尽的时候c3p0一次同时获取的连接数。默认值: 3 -->   
<property name="acquireIncrement" value="2"/>  
<!--定义在从数据库获取新连接失败后重复尝试的次数。默认值: 30 ；小于等于0表示无限次-->   
<property name="acquireRetryAttempts" value="0"/>  
<!--重新尝试的时间间隔，默认为：1000毫秒-->   
<property name="acquireRetryDelay" value="1000" />  
<!--关闭连接时，是否提交未提交的事务，默认为false，即关闭连接，回滚未提交的事务 -->   
<property name="autoCommitOnClose">false</property>  
<!--c3p0将建一张名为Test的空表，并使用其自带的查询语句进行测试。如果定义了这个参数那么属性preferredTestQuery将被忽略。你不能在这张Test表上进行任何操作，它将只供c3p0测试使用。默认值: null -->   
<property name="automaticTestTable">Test</property>  
<!--如果为false，则获取连接失败将会引起所有等待连接池来获取连接的线程抛出异常，但是数据源仍有效保留，并在下次调用getConnection()的时候继续尝试获取连接。如果设为true，那么在尝试获取连接失败后该数据源将申明已断开并永久关闭。默认: false-->   
<property name="breakAfterAcquireFailure">false</property>  
<!--每60秒检查所有连接池中的空闲连接。默认值: 0，不检查 -->   
<property name="idleConnectionTestPeriod">60</property>  
<!--c3p0全局的PreparedStatements缓存的大小。如果maxStatements与maxStatementsPerConnection均为0，则缓存不生效，只要有一个不为0，则语句的缓存就能生效。如果默认值: 0-->   
<property name="maxStatements">100</property>  
<!--maxStatementsPerConnection定义了连接池内单个连接所拥有的最大缓存statements数。默认值: 0 -->   
<property name="maxStatementsPerConnection"></property>  
```

**3、** 编码；

**4、** 结果图；

## 源码

```java
package com.wyx;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import javax.sql.DataSource;
import com.mchange.v2.c3p0.DataSources;
public class jdbc_pool
{
	public static void main(String[] args)
	{
		PreparedStatement ps = null;
		ResultSet rs = null;
		try
		{
			// 注册驱动
			Class.forName("oracle.jdbc.OracleDriver");
			// 获得非池化的数据源
			DataSource unpoolds = DataSources.unpooledDataSource("jdbc:oracle:thin:@127.0.0.1:1521:orcl", "scott", "tiger");
			// 把非池的数据源转换成池的数据源
			DataSource poolds = DataSources.pooledDataSource(unpoolds);
			// 第一次获得连接的时候来初始化连接池（速度稍慢，后面将会很快）
			Connection conn = poolds.getConnection();
			Connection conn1 = poolds.getConnection();
			System.out.println(conn);
			System.out.println(conn1);
			ps = conn.prepareStatement("select * from person");
			rs = ps.executeQuery();
			while (rs.next())
			{
				System.out.println("ID: " + rs.getString(1) + "    姓名："
						+ rs.getString(2));
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

[源码工程文件下载](https://download.csdn.net/download/qq_36260974/11158876)

如有错误，欢饮指正！
