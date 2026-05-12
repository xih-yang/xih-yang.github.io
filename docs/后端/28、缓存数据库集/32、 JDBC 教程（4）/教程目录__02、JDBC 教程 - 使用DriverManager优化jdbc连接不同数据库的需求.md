# 02、JDBC 教程 - 使用DriverManager优化jdbc连接不同数据库的需求
- 来源：https://ddkk.com/zhuanlan/db/jdbc/4/2.html
- 分类：缓存数据库
- 分组：教程目录
## JDBC基础

### 使用DriverManager优化jdbc连接不同数据库的需求

优化上一个程序，不直接使用Driver，而使用SQL给我们提供的DriverManager类

DriverManager是数据库驱动的管理类

好处：

**1、** 可以通过DriverManager中重载的getConnection()方法直接获取数据库连接，比较方便；

**2、** 可以同时管理多个不同的驱动程序，即同时管理不同类型的数据库的驱动，需要哪个时自动判断使用；

好处1体现：

比上一个笔记的需要new 一个Properties的实例存放user、password来得方便

```java
@Test
public void testDriverManager() throws Exception {
    // 1.准备连接数据库的4个基本信息：驱动的全类名、URL、登陆用户名、密码
    String driverClass = null;
    String jdbcUrl = null;
    String user = null;
    String password = null;
    // 读取类路径下的jdbc.properties文件
    InputStream in = getClass().getClassLoader().getResourceAsStream("jdbc/jdbc.properties");
    Properties properties = new Properties();
    properties.load(in);
    driverClass = properties.getProperty("driverClass");
    jdbcUrl = properties.getProperty("jdbcUrl");
    user = properties.getProperty("username");
    password = properties.getProperty("password");
    // 2.加载数据库驱动程序(对应的Driver实现类中有注册驱动的静态代码块)
    // DriverManager.registerDriver((Driver) Class.forName(driverClass).newInstance()); // 这一行等效于下面那一行
    Class.forName(driverClass);
    // 3.通过DriverManager的getConnection() 方法带入参数：url、user、password获取连接Connection
    Connection connection = DriverManager.getConnection(jdbcUrl, user, password);
    // 打印连接以便验证
    System.out.println(connection);
}
输出：com.mysql.jdbc.JDBC4Connection@5c0369c4    
```

好处2体现：

同时准备了MySQL和Oracle两个数据库，我们只需要选择使用MySQL连接还是Oracle连接，就可以连接不同的数据库，也就是说，我们只需要给DriverManager的getConnection()方法相应数据库的连接信息，那么DriverManager就会选择连接对应的数据库，而不需要去改动源代码。

```java
@Test
public void testMoreDriverManager() throws Exception {
    // 1.MySQL的数据库连接信息
    String driverClass = "com.mysql.jdbc.Driver";
    String jdbcUrl = "jdbc:mysql://localhost:3306/test?useUnicode=true&characterEncoding=utf-8&zeroDateTimeBehavior=convertToNull";
    String user = "mysqlroot";
    String password = "mysqladmin123";
    // Oracle的数据库连接信息
    String driverClass2 = "oracle.jdbc.driver.OracleDriver";
    String jdbcUrl2 = "jdbc:oracle:thin:@localhost:1521:orcl";
    String user2 = "oracleroot";
    String password2 = "oracleadmin123";
    // 2.加载数据库驱动程序(对应的Driver实现类中有注册驱动的静态代码块)
    Class.forName(driverClass);
    Class.forName(driverClass2);
    // 3.通过DriverManager的getConnection() 方法带入参数：url、user、password获取连接Connection
    // 代码1：MySQL连接
    Connection connection = DriverManager.getConnection(jdbcUrl, user, password);
    // 代码2：Oracle连接
    // Connection connection = DriverManager.getConnection(jdbcUrl2, user2, password2);
    // 打印连接以便验证
    System.out.println(connection);
}
选择代码1生效时，输出：com.mysql.jdbc.JDBC4Connection@3d8c7aca
选择代码2生效时，输出：oracle.jdbc.driver.T4CConnection@3f0ee7cb
其实也就是调用同一个方法，输入的参数是哪个数据库的，那么程序就会自动去连接相应的数据库
```
