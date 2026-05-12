# 10、JDBC 教程 - JDBC 封装 Util 和 DAO 模式
- 来源：https://ddkk.com/zhuanlan/db/jdbc/1/10.html
- 分类：缓存数据库
- 分组：教程目录
## JDBC 封装 Util 和 DAO 模式

### 封装 Util

**1、** 新建工程；

**2、** 引入驱动包；

**3、** 建立属性文件，用于封装；

**4、** 设置属性文件；

**5、** 封装（代码见文末）；

**6、** 创建person类；

**7、** 编写person类（代码见文末）；

### DAO 模式

**1、** DAO（DataAccessObject）模式就是写一个类，把访问数据库的代码封装起来DAO在数据库与业务逻辑（Service）之间；

① 实体域（JavaBean），即操作的对象，例如我们操作的表是 user 表，那么就需要先写一个User类；

② DAO 模式需要先提供一个 DAO 接口；

③ 然后再提供一个 DAO 接口的实现类；

④ 再编写一个 DAO 工厂，Service通过工厂来获取 DAO 实现。

**2、** 再新建一个包，新建接口；

**3、** 编写接口PersonDao（代码见文末）；

**4、** 再新建一个包，新建类PersonDaoImpl，并实现接口PersonDao；

**5、** 编写PersonDaoImpl类（代码见文末）；

**6、** 再次建立一个包，建立测试类；

**7、** 编写测试类（代码见文末）；

**8、** 程序运行结果；

### 源码

- DBUtils 类

```java
package cn.wyx;
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
	/*
	 * 获得连接
	 */
	public static Connection getConn()
	{
		// 从类加载器获得资源，以流的形式将资源引过来
		InputStream in = DBUtils.class.getClassLoader().getResourceAsStream("db.properties");
		// 实例化类 Properties
		Properties prop = new Properties();
		// 定义连接
		Connection conn = null;
		try
		{
			// 加载
			prop.load(in);
			// 从属性文件当中读取值
			String driverClass = prop.getProperty("driverClass");
			String url = prop.getProperty("url");
			String username = prop.getProperty("username");
			String password = prop.getProperty("password");
			// 注册驱动
			Class.forName(driverClass);
			// 获得连接
			conn = DriverManager.getConnection(url, username, password);
		} catch (Exception e)
		{
			e.printStackTrace();
		}
		// 返回连接
		return conn;
	}
	/*
	 * 获得SQL的执行对象
	 */
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
	/*
	 * 资源的关闭
	 */
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
	/*
	 * 资源的关闭
	 */
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

- person 类

```java
package cn.wyx;
import java.util.Date;
public class Person
{
	private Integer id;
	private String name;
	private String gender;
	private Date birthday;
	public Integer getId()
	{
		return id;
	}
	public void setId(Integer id)
	{
		this.id = id;
	}
	public String getName()
	{
		return name;
	}
	public void setName(String name)
	{
		this.name = name;
	}
	public String getGender()
	{
		return gender;
	}
	public void setGender(String gender)
	{
		this.gender = gender;
	}
	public Date getBirthday()
	{
		return birthday;
	}
	public void setBirthday(Date birthday)
	{
		this.birthday = birthday;
	}
	@Override
	public String toString()
	{
		return "Person [id=" + id + ", name=" + name + ", gender=" + gender
				+ ", birthday=" + birthday + "]";
	}	
}
```

- 接口 PersonDao

```java
package cn.wyx.dao;
import java.util.List;
import cn.wyx.Person;
public interface PersonDao
{
	public void savePerson(Person p);
	public void updatePerson(Person p);
	public Person getPersonById(Integer id);
	public List<Person> listPerson();
}
```

- 类 PersonDaoImpl

```java
package cn.wyx.dao.impl;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import cn.wyx.dao.PersonDao;
import cn.wyx.DBUtils;
import cn.wyx.Person;
public class PersonDaoImpl implements PersonDao
{
	@Override
	public Person getPersonById(Integer id)
	{
		String sql = "select * from person t where t.id = ?";
		PreparedStatement pstmt = DBUtils.getPstmt(sql);
		Person p = null;
		ResultSet rs = null;
		try
		{
			pstmt.setInt(1, id);
			rs = pstmt.executeQuery();
			// 游标向下移动
			rs.next();
			// 获得查询出来的数据
			Integer personid = rs.getInt("id");
			String name = rs.getString("name");
			String gender = rs.getString("gender");
			java.util.Date birthday = rs.getDate("birthday");
			// 创建person对象并且赋值
			p = new Person();
			p.setId(personid);
			p.setName(name);
			p.setGender(gender);
			p.setBirthday(birthday);
		} catch (SQLException e)
		{
			e.printStackTrace();
		} finally
		{
			DBUtils.closeQueryRes(rs);
		}
		return p;
	}
	@Override
	public List<Person> listPerson()
	{
		String sql = "select * from person ";
		PreparedStatement pstmt = DBUtils.getPstmt(sql);
		List<Person> pList = new ArrayList<Person>();
		ResultSet rs = null;
		try
		{
			rs = pstmt.executeQuery();
			// 游标向下移动
			while (rs.next())
			{
				// 获得查询出来的数据
				Integer personid = rs.getInt("id");
				String name = rs.getString("name");
				String gender = rs.getString("gender");
				java.util.Date birthday = rs.getDate("birthday");
				// 创建person对象并且赋值
				Person p = new Person();
				p.setId(personid);
				p.setName(name);
				p.setGender(gender);
				p.setBirthday(birthday);
				pList.add(p);
			}
		} catch (SQLException e)
		{
			e.printStackTrace();
		} finally
		{
			DBUtils.closeQueryRes(rs);
		}
		return pList;
	}
	@Override
	public void savePerson(Person p)
	{
		String sql = "insert into person values(personid.nextval, ?,?,?)";
		PreparedStatement pstmt = DBUtils.getPstmt(sql);
		try
		{
			pstmt.setString(1, p.getName());
			pstmt.setString(2, p.getGender());
			pstmt.setDate(3, new Date(p.getBirthday().getTime()));
			pstmt.executeUpdate();
		} catch (Exception e)
		{
			e.printStackTrace();
		} finally
		{
			DBUtils.closeUpdateRes(pstmt);
		}
	}
	@Override
	public void updatePerson(Person p)
	{
		String sql = "update person t set t.name = ?, t.gender = ?, t.birthday = ? where t.id = ?";
		PreparedStatement pstmt = DBUtils.getPstmt(sql);
		try
		{
			pstmt.setString(1, p.getName());
			pstmt.setString(2, p.getGender());
			pstmt.setDate(3, new Date(p.getBirthday().getTime()));
			pstmt.setInt(4, p.getId());
			pstmt.executeUpdate();
		} catch (Exception e)
		{
			e.printStackTrace();
		} finally
		{
			DBUtils.closeUpdateRes(pstmt);
		}
	}
}
```

- 测试类 PersonTest

```java
package cn.wyx.test;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import cn.wyx.dao.PersonDao;
import cn.wyx.dao.impl.PersonDaoImpl;
import cn.wyx.Person;
public class PersonTest
{
	public static void main(String[] args)
	{
		//insert();
		//update();
		//query();
		querys();	
	}
	/**
	 * 向数据库当中插入数据
	 */
	public static void insert()
	{
		PersonDao personDao = new PersonDaoImpl();
		Person p = new Person(); 
		p.setName("weiyuxuan"); 
		p.setGender("2");
		p.setBirthday(new Date()); 
		personDao.savePerson(p);
	}
	/**
	 * 更新数据库数据
	 * @throws ParseException
	 */
	public static void update() 
	{
		PersonDao personDao = new PersonDaoImpl();
		Person p = new Person(); 
		p.setId(108); // 需要与数据库保持一致
		p.setName("wyx");
		p.setGender("1"); 
		try
		{
			p.setBirthday(new SimpleDateFormat("yyyy-MM-dd").parse("1985-04-22"));
		} catch (ParseException e)
		{
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		personDao.updatePerson(p);
	}
	/**
	 * 单条数据的查询
	 */
	public static void query()
	{
		PersonDao personDao = new PersonDaoImpl();
		Person p = personDao.getPersonById(108); 
		System.out.println(p);
	}
	/**
	 * 查询数据库多条数据
	 */
	public static void querys()
	{
		PersonDao personDao = new PersonDaoImpl();
		List<Person> pList = personDao.listPerson();
		for (Person person : pList)
		{
			System.out.println(person);
		}
	}
}
```
