# 01、JDBC 教程 - 读取配置文件连接多种数据库的JDBC通用连接程序
- 来源：https://ddkk.com/zhuanlan/db/jdbc/4/1.html
- 分类：缓存数据库
- 分组：教程目录
## JDBC基础

### 读取配置文件连接多种数据库的JDBC通用连接程序

持久化就是将数据从"掉电丢失"的内存保存到"掉电不丢失"的数据库的过程

数据库存取技术分为：

**1、** JDBC直接访问数据库；

**2、** JDO技术；

**3、** 第三方O/R工具，如：Hibernate，mybatis；

JDBC是其他技术的实现基石

JDBC是一个独立于特定数据库管理系统、通用的SQL数据库存取和操作的公共接口(一组API)

JDBC只是一种接口，各大数据库厂商提供该数据库的JDBC接口的实现，这就是该数据库的JDBC驱动

Driver是一个接口：数据库厂商必须实现的接口，能从其中获取数据库连接(Connection)

jdbc的连接url组成

**1、** 协议:子协议:子名称；

**2、** jdbc:mysql://localhost:3306/test_database；

**3、** jdbc:oracle:thin:@localhost:1521:orcl；

**4、** jdbc就是协议，mysql/oracle就是子协议，其它的就是子名称；

从Driver实现类中获取数据库的连接

```java
1. 导入mysql驱动之后
2. 代码
@Test
public void testDriver() throws SQLException{
    // 1. 创建一个Driver实现类的对象
    Driver driver = new com.mysql.jdbc.Driver();
    // 2. 准备连接数据库的基本信息:url、user、password
    String url = "jdbc:mysql://localhost:3306/test";
    Properties info = new Properties();
    info.put("user", "root");
    info.put("password", "123");
    // 3. 调用Driver接口的connect(url,info)获取数据库连接
    Connection connection = driver.connect(url, info);
    System.out.println(connection);
}
输出：com.mysql.jdbc.JDBC4Connection@763d9750
```

在获取连接之后就可以操作数据库中的数据了

但是以上代码和数据库实现类的耦合度太大

编写一个通用的方法，在不修改源代码的情况下，适配任何数据库的连接

需要把以上代码的Driver、url、user、password放入配置文件中

代码如下：

```java
jdbc.properties文件内容：
driver=com.mysql.jdbc.Driver
jdbcUrl=jdbc:mysql://localhost:3306/test
user=root
password=123
@Test
public void testDriver() throws Exception {
    String driverClass = null;
    String jdbcUrl = null;
    String user = null;
    String password = null;
    // 读取类路径下的jdbc.properties文件
    // 先将properties文件以数据流的形式读出来
    InputStream in = getClass().getClassLoader().getResourceAsStream("jdbc.properties");
    // 新建Properties对象实例
    Properties properties = new Properties();
    // 再将读取出来的数据流灌入实例中。注意，此处会抛出IO异常
    properties.load(in);
    // 再将对应的数据取出来
    driverClass = properties.getProperty("driverClass");
    jdbcUrl = properties.getProperty("jdbcUrl");
    user = properties.getProperty("username");
    password = properties.getProperty("password");
    // 通过反射的方式创建Driver的实现类
    Driver driver = (Driver) Class.forName(driverClass).newInstance();
    Properties info = new Properties();
    info.put("user", user);
    info.put("password",password);
    Connection connection = driver.connect(jdbcUrl, info);
    System.out.println(connection);
}
输出：com.mysql.jdbc.JDBC4Connection@5c0369c4
输出了MySQL的连接了
```

连接Oracle数据库怎么办呢？

只需要修改配置文件的配置就好了：

```java
jdbc.properties文件内容：
driver=oracle.jdbc.driver.OracleDriver
jdbcUrl=jdbc:oracle:thin:@localhost:1521:orcl
user=scott
password=123
就能输出Oracle的连接了
```

本章结束

如果本文有错误或对本文有不理解的地方欢迎评论 _

如果本文有帮助到您，可以点一下右上角的赞哦，谢谢啦
