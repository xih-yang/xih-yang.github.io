# 05、MyBatis 实战 - 之手写MyBatis框架简单探索版(含源代码)
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/6/5.html
- 分类：ORM框架
- 分组：教程目录
## 1、准备工作

### 引入dom4j依赖，引入mysql驱动依赖

```java
注意：因为是手写mybatis框架，所以并没有引入mybatis的相关依赖
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.powernode</groupId>
    <artifactId>parse-xml-by-dom4j</artifactId>
    <version>1.0-SNAPSHOT</version>
    <packaging>jar</packaging>
    <properties>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <maven.compiler.source>1.8</maven.compiler.source>
        <maven.compiler.target>1.8</maven.compiler.target>
    </properties>
    <dependencies>
        <!--dom4j依赖-->
        <dependency>
            <groupId>org.dom4j</groupId>
            <artifactId>dom4j</artifactId>
            <version>2.1.3</version>
        </dependency>
        <dependency>
            <groupId>jaxen</groupId>
            <artifactId>jaxen</artifactId>
            <version>1.2.0</version>
        </dependency>
        <!--junit测试类-->
        <dependency>
            <groupId>junit</groupId>
            <artifactId>junit</artifactId>
            <version>4.11</version>
            <scope>test</scope>
        </dependency>
        <!--数据库驱动-->
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <version>8.0.30</version>
        </dependency>
    </dependencies>
</project>
```

## 二、手写Mybatis思路

```java
完全是按照mybatis查询数据库时，所需要的步骤，来创建对象，以及解析。
这是原生的mybatis查询代码：
```

```java
SqlSessionFactoryBuilder sqlSessionFactoryBuilder = new SqlSessionFactoryBuilder();
InputStream ins = Resources.getResourceAsStream("mybatis-config.xml");
SqlSessionFactory sqlSessionFactory = sqlSessionFactoryBuilder.build(ins);
SqlSession sqlSession = sqlSessionFactory.openSession();
int insertCar = sqlSession.insert("insertCar");
System.out.println(insertCar);
```

```java
接下来我们会手动去创建这些对象，来实现查询的过程
```

## 三、正式开始

### 1、创建工具类 Resources

```java
作用：从类路径下加载配置文件
```

```java
public class Resources {
    private Resources(){
     }
    public static InputStream getResourceAsStream(String resource){
        return ClassLoader.getSystemClassLoader().getResourceAsStream(resource);
    }
}
```

```java
关于工具类的几点说明：
1、工具类的构造方法 都是建议私有化
2、因为工具类中的方法都是静态的，不需要创建对象来调用
3、为了避免调用，所有的构造方法都是私有化
```

### 2、创建SqlSessionFactoryBuilder类

```java
作用：
通过SqlSessionFactoryBuilder的build方法来解析 mybatis-config.xml文件，
从而获取SqlSessionFactory对象，以及数据源对象DataSource，
事务管理器对象Transaction，MappedStatement对象，即sql标签信息
```

```java
package org.ibatis.core;
import org.dom4j.Document;
import org.dom4j.DocumentException;
import org.dom4j.Element;
import org.dom4j.Node;
import org.dom4j.io.SAXReader;
import org.ibatis.utils.Resources;
import javax.sql.DataSource;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
/**
 * SqlSessionFactory构造器对象
 * 通过SqlSessionFactoryBuilder的build方法来解析 mybatis-config.xml文件，
 * 然后 构建SqlSessionFactory对象
 */
public class SqlSessionFactoryBuilder {
    public SqlSessionFactoryBuilder(){
     }
    //通过SqlSessionFactoryBuilder的build方法来解析 mybatis-config.xml文件
    // 然后 创建SqlSessionFactory对象
    public SqlSessionFactory build(InputStream inputStream){
        SqlSessionFactory factory = null;
        //解析mybatis-config.xml文件
        SAXReader saxReader = new SAXReader();
        Document document = null;
        try {
            document = saxReader.read(inputStream);
        } catch (DocumentException e) {
            e.printStackTrace();
        }
        String xPath = "/configuration/environments";
        Element environments = (Element) document.selectSingleNode(xPath);
        String defaultId = environments.attributeValue("default");
        xPath = "/configuration/environments/environment[@id='"+defaultId+"']";
        Element environment = (Element) document.selectSingleNode(xPath);
        Element transactionManagerElement= environment.element("transactionManager");
        Element dataSourceElement = environment.element("dataSource");
        List<String> sqlMapperXmlPaths  = new ArrayList<>();
        List<Node> nodes = document.selectNodes("//mapper");
        nodes.forEach(n -> {
            Element e = (Element) n;
            String resource = e.attributeValue("resource");
            sqlMapperXmlPaths.add(resource);
        });
        //获取数据源对象
        DataSource dataSource = getDataSource(dataSourceElement);
        //获取事务管理器对象，事务管理器需要数据源对象
        Transaction transaction = getTransaction(transactionManagerElement,dataSource);
        //获取MappedStatement对象，即sql标签信息
        Map<String, MappedStatement> mappedStatement = getMappedStatement(sqlMapperXmlPaths);
        //解析完成之后，构建SqlSessionFactory对象
        factory = new SqlSessionFactory(transaction, mappedStatement);
        return factory;
    }
    /**
     * 解析所有的sqlMapper.xml文件，然后构建map集合
     *
     * @param sqlMapperXmlPaths
     * @return
     */
    private Map<String, MappedStatement> getMappedStatement(List<String> sqlMapperXmlPaths) {
        Map<String, MappedStatement> mappedStatementMap = new HashMap<>();
        sqlMapperXmlPaths.forEach(sqlMapperXmlPath ->{
            //根据文件路径，去解析xml文件
            try {
                SAXReader saxReader = new SAXReader();
                InputStream ins = Resources.getResourceAsStream(sqlMapperXmlPath);
                Document document = saxReader.read(ins);
                Element mapper = (Element) document.selectSingleNode("mapper");
                String namespace = mapper.attributeValue("namespace");
                List<Element> elements = mapper.elements();
                elements.forEach(e ->{
                    String id = e.attributeValue("id");
                    String sqlId = namespace + "." + id;//生成唯一的sqlId，因为namespace是不重复的
                    String resultType = e.attributeValue("resultType");
                    String sql = e.getTextTrim();
                    MappedStatement statement = new MappedStatement(sql,resultType);
                    mappedStatementMap.put(sqlId,statement);
                });
            } catch (DocumentException e) {
                e.printStackTrace();
            }
        });
        return mappedStatementMap;
    }
    /**
     * 获取数据源对象
     * @param dataSourceElement
     * @return
     */
    private DataSource getDataSource(Element dataSourceElement) {
        Map<String,String> map = new HashMap<>();
        DataSource dataSource = null;
        List<Element> propertyElements = dataSourceElement.elements("property");
        propertyElements.forEach(p ->{
            String name = p.attributeValue("name");
            String value = p.attributeValue("value");
            map.put(name,value);
        });
        //UNPOOLED POOLED JNDI
        String type = dataSourceElement.attributeValue("type").trim().toUpperCase();
        if(Const.UNPOOLED_DATASOURCE.equals(type)){
            dataSource = new UnPooledDataSource(map.get("driver"),map.get("url"),map.get("username"),map.get("password"));
        }
        if (Const.POOLED_DATASOURCE.equals(type)) {
            dataSource = new PooledDataSource();
        }
        if (Const.JNDI_DATASOURCE.equals(type)) {
            dataSource = new JNDIDataSource();
        }
        return dataSource;
    }
    /**
     * 获取事务管理器对象
     * @param transactionManagerElement
     * @param dataSource
     * @return
     */
    private Transaction getTransaction(Element transactionManagerElement,DataSource dataSource) {
        Transaction transaction = null;
        String type = transactionManagerElement.attributeValue("type").trim().toUpperCase();
        if(Const.JDBC_TRANSACTION.equals(type)){
            transaction = new JdbcTransaction(dataSource,false);//默认开启事务，手动提交
        }
        if(Const.MANAGED_TRANSACTION.equals(type)){
            transaction = new ManagedTransaction();
        }
        return transaction;
    }
}
```

### 3、创建SqlSessionFactory类

```java
一个数据库，对应一个SqlSessionFactory对象
通过SqlSessionFactory对象获取SqlSession对象，开启会话
一个SqlSessionFactory 对象可以开启多个SqlSession会话
```

```java
package org.ibatis.core;
import java.util.Map;
/**
 * 一个数据库，对应一个SqlSessionFactory对象
 * 通过SqlSessionFactory对象获取SqlSession对象，开启会话
 * 一个SqlSessionFactory 对象可以开启多个SqlSession会话
 */
public class SqlSessionFactory {
    /**
     * 属性：
     * 1、事务管理器:因为事务管理器是可以灵活切换的，所以应该是面向接口编程
     * 2、存放SQL语句的map集合，key为 sqlId，value为sql标签信息对象
     */
    //事务管理器
    private Transaction transaction;
    // 存放SQL标签信息的map集合
    private Map<String,MappedStatement> mappedStatements;
    public SqlSessionFactory(Transaction transaction, Map<String, MappedStatement> mappedStatements) {
        this.transaction = transaction;
        this.mappedStatements = mappedStatements;
    }
    public Transaction getTransaction() {
        return transaction;
    }
    public void setTransaction(Transaction transaction) {
        this.transaction = transaction;
    }
    public Map<String, MappedStatement> getMappedStatements() {
        return mappedStatements;
    }
    public void setMappedStatements(Map<String, MappedStatement> mappedStatements) {
        this.mappedStatements = mappedStatements;
    }
    /**
     * 获取sql会话对象
     * @return
     */
    public SqlSession OpenSession(){
        //开启会话前，先开启连接
        transaction.openConnection();
        //创建sqlSession对象
        SqlSession sqlSession = new SqlSession(this);
        return sqlSession;
    }
}
```

### 4、创建事务管理器接口：Transaction

```java
事务管理器接口：
所有的事务管理器都应该实现该接口
JDBC事务管理器，MANAGED事务管理器 都要实现这个接口
事务管理器，提供管理事务的方法
```

```java
package org.ibatis.core;
import java.sql.Connection;
import java.sql.SQLException;
/**
 * 事务管理器接口：
 * 所有的事务管理器都应该实现该接口
 * JDBC事务管理器，MANAGED事务管理器 都要实现这个接口
 * 事务管理器，提供管理事务的方法
 */
public interface Transaction {
    void commit() throws SQLException;
    void rollback();
    void close();
    void openConnection();//开启数据库连接对象
    Connection getConnection();//获取数据库连接对象
}
```

### 5、创建事务管理器接口实现类：JdbcTransaction

```java
package org.ibatis.core;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
/**
 * JDBC 事务管理器
 */
public class JdbcTransaction implements Transaction {
    private DataSource dataSource;
    private boolean autoCommit;//自动提交标志：（true 自动提交 ， false 不采用自动提交,也就是使用事务管理）
    private Connection connection;
    public JdbcTransaction(DataSource dataSource, boolean autoCommit) {
        this.dataSource = dataSource;
        this.autoCommit = autoCommit;
    }
    @Override
    public void commit() {
        try {
            connection.commit();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
    @Override
    public void rollback() {
        try {
            connection.rollback();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
    @Override
    public void close() {
    }
    @Override
    public void openConnection() {
        if (connection == null) {
            try {
                connection = dataSource.getConnection();
                connection.setAutoCommit(autoCommit);
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }
    @Override
    public Connection getConnection() {
        return connection;
    }
}
```

### 6、创建事务管理器接口实现类：ManagedTransaction

```java
package org.ibatis.core;
import java.sql.Connection;
/**
 * MANAGED 事务管理器
 */
public class ManagedTransaction implements Transaction {
    @Override
    public void commit() {
    }
    @Override
    public void rollback() {
    }
    @Override
    public void close() {
    }
    @Override
    public void openConnection() {
    }
    @Override
    public Connection getConnection() {
        return null;
    }
}
```

### 7、三种实现数据源DataSource接口的实现类

```java
数据源实现类：PooledDataSource
```

```java
package org.ibatis.core;
import javax.sql.DataSource;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.SQLFeatureNotSupportedException;
import java.util.logging.Logger;
/**
 * 数据源实现类：PooledDataSource
 * 使用连接池对象
 */
public class PooledDataSource implements DataSource {
    @Override
    public Connection getConnection() throws SQLException {
        return null;
    }
    @Override
    public Connection getConnection(String username, String password) throws SQLException {
        return null;
    }
    @Override
    public <T> T unwrap(Class<T> iface) throws SQLException {
        return null;
    }
    @Override
    public boolean isWrapperFor(Class<?> iface) throws SQLException {
        return false;
    }
    @Override
    public PrintWriter getLogWriter() throws SQLException {
        return null;
    }
    @Override
    public void setLogWriter(PrintWriter out) throws SQLException {
    }
    @Override
    public void setLoginTimeout(int seconds) throws SQLException {
    }
    @Override
    public int getLoginTimeout() throws SQLException {
        return 0;
    }
    @Override
    public Logger getParentLogger() throws SQLFeatureNotSupportedException {
        return null;
    }
}
```

```java
数据源实现类：UnPooledDataSource
```

```java
package org.ibatis.core;
import javax.sql.DataSource;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.SQLFeatureNotSupportedException;
import java.util.logging.Logger;
/**
 * 数据源实现类：UnPooled
 * 不使用连接池对象，每次都创建一个新的Connection连接对象
 */
public class UnPooledDataSource implements DataSource {
    private String url;
    private String username;
    private String password;
    public UnPooledDataSource(String driver, String url, String username, String password) {
        try {
            //注册驱动
            Class.forName(driver);
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }
        this.url = url;
        this.username = username;
        this.password = password;
    }
    @Override
    public Connection getConnection() throws SQLException {
        return DriverManager.getConnection(url,username,password);
    }
    @Override
    public Connection getConnection(String username, String password) throws SQLException {
        return null;
    }
    @Override
    public <T> T unwrap(Class<T> iface) throws SQLException {
        return null;
    }
    @Override
    public boolean isWrapperFor(Class<?> iface) throws SQLException {
        return false;
    }
    @Override
    public PrintWriter getLogWriter() throws SQLException {
        return null;
    }
    @Override
    public void setLogWriter(PrintWriter out) throws SQLException {
    }
    @Override
    public void setLoginTimeout(int seconds) throws SQLException {
    }
    @Override
    public int getLoginTimeout() throws SQLException {
        return 0;
    }
    @Override
    public Logger getParentLogger() throws SQLFeatureNotSupportedException {
        return null;
    }
}
```

```java
数据源实现类：JNDIDataSource
```

```java
package org.ibatis.core;
import javax.sql.DataSource;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.SQLFeatureNotSupportedException;
import java.util.logging.Logger;
/**
 * 数据源实现类：JNDI
 * 使用第三方的数据库连接池，获取Connection对象
 */
public class JNDIDataSource implements DataSource {
    @Override
    public Connection getConnection() throws SQLException {
        return null;
    }
    @Override
    public Connection getConnection(String username, String password) throws SQLException {
        return null;
    }
    @Override
    public <T> T unwrap(Class<T> iface) throws SQLException {
        return null;
    }
    @Override
    public boolean isWrapperFor(Class<?> iface) throws SQLException {
        return false;
    }
    @Override
    public PrintWriter getLogWriter() throws SQLException {
        return null;
    }
    @Override
    public void setLogWriter(PrintWriter out) throws SQLException {
    }
    @Override
    public void setLoginTimeout(int seconds) throws SQLException {
    }
    @Override
    public int getLoginTimeout() throws SQLException {
        return 0;
    }
    @Override
    public Logger getParentLogger() throws SQLFeatureNotSupportedException {
        return null;
    }
}
```

### 8、创建MappedStatement类，存放sql标签中的所有信息

```java
package org.ibatis.core;
/**
 * 一个SQL标签中的所有信息封装到MappedStatement对象中
 */
public class MappedStatement {
    private String sql;//sql语句
    private String resultType;//结果集类型，insert语句没有该值，select语句才有值
    public MappedStatement() {
    }
    public MappedStatement(String sql, String resultType) {
        this.sql = sql;
        this.resultType = resultType;
    }
    public String getSql() {
        return sql;
    }
    public void setSql(String sql) {
        this.sql = sql;
    }
    public String getResultType() {
        return resultType;
    }
    public void setResultType(String resultType) {
        this.resultType = resultType;
    }
}
```

### 9、创建执行sql的会话对象（核心类）

```java
package org.ibatis.core;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.sql.*;
import java.util.Map;
/**
 * 执行sql语句的会话对象
 */
public class SqlSession {
    private SqlSessionFactory factory;
    public SqlSession(SqlSessionFactory factory) {
        this.factory = factory;
    }
    //insert、
    public int insert(String sqlId,Object object) throws NoSuchMethodException, InvocationTargetException, IllegalAccessException {
        Map<String, MappedStatement> mappedStatements = factory.getMappedStatements();
        MappedStatement mappedStatement = mappedStatements.get(sqlId);
        Connection connection = factory.getTransaction().getConnection();
        try {
            String originSql = mappedStatement.getSql();
            String sql = originSql.replaceAll("#\\{[0-9A-Za-z_$]*}", "?");//转换为？
            PreparedStatement preparedStatement = connection.prepareStatement(sql);
            //给sql语句的? 占位符传值
            int fromIndex = 0;
            int index = 1;
            while (true){
                int i = originSql.indexOf("#",fromIndex);
                if(i<0){
                    break;
                }
                int rightIndex = originSql.indexOf("}",fromIndex);
                String propertyName = originSql.substring(i + 2, rightIndex).trim();
                fromIndex = rightIndex + 1;
                String getMethodName = "get"+propertyName.toUpperCase().charAt(0)+propertyName.substring(1);
                Method declaredMethod = object.getClass().getDeclaredMethod(getMethodName);
                Object propertyValue = declaredMethod.invoke(object);
                preparedStatement.setString(index,propertyValue.toString());
                index ++;
            }
            return preparedStatement.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return 0;
    }
    // selectOne方法,返回单个对象
    public Object selectOne(String sqlId,Object param){
        Object object = null;
        try {
            Connection connection = factory.getTransaction().getConnection();
            MappedStatement mappedStatement = factory.getMappedStatements().get(sqlId);
            //dql查询语句
            //select * from t_user where id ={id}
            String originSql = mappedStatement.getSql();
            String sql = originSql.replaceAll("#\\{[0-9A-Za-z_$]*}", "?");//# 转换为 ？
            PreparedStatement preparedStatement = connection.prepareStatement(sql);
            //给占位符传值（暂时不做复杂的，就只有一个占位符）
            preparedStatement.setString(1,param.toString());
            ResultSet rs = preparedStatement.executeQuery();
            String resultType = mappedStatement.getResultType();
            //从结果集中封装java对象
            if (rs.next()) {
                Class<?> resultTypeClass = Class.forName(resultType);
                object = resultTypeClass.newInstance();//相当于 Object object = new User();
                //如何给Object的属性赋值
                ResultSetMetaData metaData = rs.getMetaData();
                int columnCount = metaData.getColumnCount();//多少列
                for (int i = 0; i < columnCount; i++) {
                    //column the first column is 1, the second is 2, ...
                    String columnName = metaData.getColumnName(i+1);
                    String setMethodName =  "set"+columnName.toUpperCase().charAt(0)+columnName.substring(1);
                    Method method = resultTypeClass.getDeclaredMethod(setMethodName, String.class);
                    //调用set方法给对象object属性赋值
                    method.invoke(object,rs.getString(columnName));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return object;
    }
    public void commit(){
        try {
            factory.getTransaction().commit();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
    public void rollback(){
        factory.getTransaction().rollback();
    }
    public void close(){
        factory.getTransaction().close();
    }
    public static void main(String[] args) {
        String sql = "insert into t_car values(null,#{carNum},#{brand},#{guidePrice},#{produceTime},#{carType})";
        int fromIndex = 0;
        int index = 1;
        while (true){
            int i = sql.indexOf("#",fromIndex);
            if(i<0){
                break;
            }
            int rightIndex = sql.indexOf("}",fromIndex);
            String propertyName = sql.substring(i + 2, rightIndex).trim();
            fromIndex = rightIndex + 1;
            index ++;
        }
    }
}
```

### 10、常量类Const

```java
package org.ibatis.core;
public class Const {
    /**
     * 数据源连接池类型
     */
    public static final String UNPOOLED_DATASOURCE = "UNPOOLED";
    public static final String POOLED_DATASOURCE = "POOLED";
    public static final String JNDI_DATASOURCE = "NDI";
    /**
     * 事务管理器类型
     */
    public static final String JDBC_TRANSACTION = "JDBC";
    public static final String MANAGED_TRANSACTION = "MANAGED";
}
```

## 四、测试工作

### 1、准备 pojo实体类User

```java
package org.ibatis.pojo;
public class User {
    private String id;
    private String name;
    private String age;
    public User(){
     }
    public User(String id, String name, String age) {
        this.id = id;
        this.name = name;
        this.age = age;
    }
    public String getId() {
        return id;
    }
    public void setId(String id) {
        this.id = id;
    }
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public String getAge() {
        return age;
    }
    public void setAge(String age) {
        this.age = age;
    }
    @Override
    public String toString() {
        return "User{" +
                "id='" + id + '\'' +
                ", name='" + name + '\'' +
                ", age='" + age + '\'' +
                '}';
    }
}
```

### 2、准备 mybatis-config.xml文件

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
        PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
    <environments default="development">
        <environment id="development">
            <transactionManager type="JDBC"/>
            <dataSource type="UNPOOLED">
                <property name="driver" value="com.mysql.cj.jdbc.Driver"/>
                <property name="url" value="jdbc:mysql://localhost:3306/powernode?useUnicode=true&characterEncoding=utf-8"/>
                <property name="username" value="root"/>
                <property name="password" value="root"/>
            </dataSource>
        </environment>
        <environment id="mybatisDB">
            <transactionManager type="JDBC"/>
            <dataSource type="POOLED">
                <property name="driver" value="com.mysql.cj.jdbc.Driver"/>
                <property name="url" value="jdbc:mysql://localhost:3306/mybatisDB?useUnicode=true&characterEncoding=utf-8"/>
                <property name="username" value="root"/>
                <property name="password" value="root"/>
            </dataSource>
        </environment>
    </environments>
    <mappers>
        <mapper resource="UserMapper.xml"/>
    </mappers>
</configuration>
```

### 3、准备 UserMapper.xml文件

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="user">
    <insert id="insertUser">
            insert into t_user values(#{id},#{name},#{age})
    </insert>
    <select id="selectById" resultType="org.ibatis.pojo.User">
        select * from t_user where id ={id}
    </select>
</mapper>
```

### 4、记得在mysql中创建表t_user

```java
/*
 Navicat Premium Data Transfer
 Source Server         : localhost
 Source Server Type    : MySQL
 Source Server Version : 80030
 Source Host           : localhost:3306
 Source Schema         : powernode
 Target Server Type    : MySQL
 Target Server Version : 80030
 File Encoding         : 65001
 Date: 06/10/2022 21:50:02
*/
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
-- ----------------------------
-- Table structure for t_user
-- ----------------------------
DROP TABLE IF EXISTS t_user;
CREATE TABLE t_user  (
  id varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  name varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  age varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;
SET FOREIGN_KEY_CHECKS = 1;
```

### 5、写一个junit测试类

```java
import org.ibatis.core.SqlSession;
import org.ibatis.core.SqlSessionFactory;
import org.ibatis.core.SqlSessionFactoryBuilder;
import org.ibatis.pojo.User;
import org.ibatis.utils.Resources;
import org.junit.Test;
import java.io.InputStream;
import java.lang.reflect.InvocationTargetException;
public class TestMabtis {
    @Test
    public void testInsert() throws NoSuchMethodException, IllegalAccessException, InvocationTargetException {
        SqlSessionFactoryBuilder sqlSessionFactoryBuilder = new SqlSessionFactoryBuilder();
        InputStream ins = Resources.getResourceAsStream("mybatis-config.xml");
        SqlSessionFactory factory = sqlSessionFactoryBuilder.build(ins);
        SqlSession sqlSession = factory.OpenSession();
        User user = new User("222","jack","12");
        int count = sqlSession.insert("user.insertUser", user);
        System.out.println(count);
        sqlSession.commit();
        sqlSession.close();
    }
    @Test
    public void testSelecOne() {
        SqlSessionFactoryBuilder sqlSessionFactoryBuilder = new SqlSessionFactoryBuilder();
        InputStream ins = Resources.getResourceAsStream("mybatis-config.xml");
        SqlSessionFactory factory = sqlSessionFactoryBuilder.build(ins);
        SqlSession sqlSession = factory.OpenSession();
        Object object = sqlSession.selectOne("user.selectById", "222");
        System.out.println(object.toString());
        sqlSession.commit();
        sqlSession.close();
    }
}
```

## 四、总结

**手写mybatis框架，主要就是与那几个重要对象相关：**

```java
SqlSessionFactoryBuilder  >>> SqlSessionFactory  >>>  SqlSession 
1、SqlSessionFactoryBuilder  对象 负责  解析 核心配置文件mybatis-config.xml，
获取到数据源信息，事务管理器信息，sql标签信息，最终返回SqlSessionFactory 对象
2、通过SqlSessionFactory对象获取SqlSession对象，开启会话
3、一个SqlSessionFactory 对象可以开启多个SqlSession会话
4、一个数据库，对应一个SqlSessionFactory对象
```

## 五、源码地址

[https://download.csdn.net/download/weixin_43860634/87360297](https://download.csdn.net/download/weixin_43860634/87360297)
