# 04、JDBC 教程 - JDBC 操纵 Oracle 数据库的增、删、改
- 来源：https://ddkk.com/zhuanlan/db/jdbc/1/4.html
- 分类：缓存数据库
- 分组：教程目录
## 应用示例

### 编写第一个 JDBC 程序

**1、** 建立一个JavaProject工程项目；

**2、** 加载数据库驱动包（连接那种数据库就要加载那种数据库的驱动包），驱动包上讲已提供；

**3、** 建包建类；

**4、** 我们现在需要使用一张数据库表，可根据Oracle讲里面的方法，使用powerdesigner来设计数据库表；

**5、** 建立一张人员表；

注：详细操作我在 Oracle 讲里已经叙述了，此处不再详细叙述

**6、** 生成数据库脚本文件；

**7、** 选好你的文件导出路径，点击确定即可；

**8、** 打开Oracle，对脚本文件做执行；

**9、** 至此数据库表就建立好了，现在我们通过MyEclipse向这张表添加数据；

使用序列号来做 personid 编号：

### 源码

```java
package com.wyx;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
public class JDBCAdd
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
		//定义sql插入语句
		String addsql = "insert into person(id,name,gender,birthday)values(personid.nextval,'魏宇轩','1',to_date('1997-09-23','yyyy-mm-dd'))";
		//定义sql更新语句
		String updatesql = "update person t set t.gender = '2',t.birthday=to_date('2000-09-23','yyyy-mm-dd') where t.id=2";
		//定义sql删除语句
		String deletesql = "delete person t where t.id=2";
		try
		{
			// 注册数据库的驱动程序
			Class.forName(driverClass);
			// 获得数据库的连接
			conn = DriverManager.getConnection(url, username, password);
			// 创建sql执行对象
			stmt = conn.createStatement();			
			// 执行查询sql并返回更新条数
			int count = stmt.executeUpdate(addsql);	
			System.out.println("当前sql更新条数：" + count);
		} catch (Exception e)
		{
			e.printStackTrace();
		} finally
		{
			try
			{
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
