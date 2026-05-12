# 21、MyBatis源码 - MyBatis-Spring入门案例
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/5/21.html
- 分类：ORM框架
- 分组：教程目录
来自于[官方文档](http://mybatis.org/spring/zh/index.html)

### 简介

MyBatis-Spring 会帮助你将 MyBatis 无缝地整合到 Spring 中。它允许 MyBatis 参与到 Spring 的事务管理之中，创建映射器 mapper 和 SqlSession 并注入到 bean 中，以及将 Mybatis 的异常转换为 Spring 的 DataAccessException。 最终，可以做到应用代码不依赖于 MyBatis，Spring 或 MyBatis-Spring。

### 版本匹配

MyBatis-Spring 需要以下版本：

### 入门案例

#### 注意事项

要和Spring 一起使用 MyBatis，需要在 Spring 应用上下文中定义至少两样东西：一个 SqlSessionFactory 和至少一个数据映射器类（Mapper接口）。所指定的映射器类必须是一个接口，而不是具体的实现类。

在MyBatis-Spring 中，可使用 SqlSessionFactoryBean来创建 SqlSessionFactory，SqlSessionFactory 需要一个 DataSource（数据源）。

配置好之后，你就可以像 Spring 中普通的 bean 注入方法那样，将映射器注入到你的业务或服务对象中。MapperFactoryBean 将会负责 SqlSession 的创建和关闭。 如果使用了 Spring 的事务功能，那么当事务完成时，session 将会被提交或回滚。最终任何异常都会被转换成 Spring 的 DataAccessException 异常。

#### 1. 环境搭建

创建一个普通的Maven工程，引入Spring、Mybatis、日志等相关依赖：

```java
    <dependencies>
        <!--mybatis核心-->
        <dependency>
            <groupId>org.mybatis</groupId>
            <artifactId>mybatis</artifactId>
            <version>3.5.7</version>
        </dependency>
        <!--Mysql 驱动-->
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <version>8.0.25</version>
        </dependency>
        <!--lombok-->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <version>1.18.20</version>
        </dependency>
        <!--logback日志-->
        <dependency>
            <groupId>org.slf4j</groupId>
            <artifactId>slf4j-api</artifactId>
            <version>1.7.7</version>
        </dependency>
        <dependency>
            <groupId>ch.qos.logback</groupId>
            <artifactId>logback-core</artifactId>
            <version>1.1.7</version>
        </dependency>
        <dependency>
            <groupId>ch.qos.logback</groupId>
            <artifactId>logback-access</artifactId>
            <version>1.1.7</version>
        </dependency>
        <dependency>
            <groupId>ch.qos.logback</groupId>
            <artifactId>logback-classic</artifactId>
            <version>1.1.7</version>
        </dependency>
        <!--Mysql 驱动-->
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <version>8.0.25</version>
        </dependency>
        <!--spring 整合mybatis-->
        <dependency>
            <groupId>org.mybatis</groupId>
            <artifactId>mybatis-spring</artifactId>
            <version>2.0.6</version>
        </dependency>
        <!--数据库连接池-->
        <dependency>
            <groupId>com.alibaba</groupId>
            <artifactId>druid</artifactId>
            <version>1.2.8</version>
        </dependency>
        <!-- spring  context-->
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-context</artifactId>
            <version>5.3.10</version>
        </dependency>
        <!--Spring  事务-->
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-jdbc</artifactId>
            <version>5.3.10 </version>
        </dependency>
    </dependencies>
        <build>
        <resources>
            <resource>
                <directory>src/main/java</directory>
                <!--idea默认不会编译src的java目录的xml文件-->
                <includes>
                    <!--配置将src源代码下的xml等资源文件编译进classes文件夹-->
                    <include>**/*.xml</include>
                </includes>
            </resource>
        </resources>
    </build>
```

执行Sql脚本（创建一个简单的用户表即可），并创建响应的实体类、Mapper接口及XML文件。

在UserMapper，添加一个查询接口

```java
public interface UserMapper {
    @Select("SELECT * FROM base_user WHERE user_id ={userId}")
    User getUser(@Param("userId") Long userId);
}
```

#### 2. 基于XML 方式注入Bean

resources目录下创建mysql.properties文件，配置自己的数据库连接及用户信息：

```java
db.url=jdbc:mysql://127.0.0.1:3306/demo_user?serverTimezone=Asia/Shanghai
db.driver=com.mysql.cj.jdbc.Driver
db.username=root
db.password=123456
```

接着创建spring-mybatis.xml文件，注入数据库连接池、SqlSessionFactoryBean对象、以及userMapper，交给Spring容器管理：

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:context="http://www.springframework.org/schema/context"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
 http://www.springframework.org/schema/beans/spring-beans.xsd
 http://www.springframework.org/schema/context
 http://www.springframework.org/schema/context/spring-context.xsd">
    <!--配置读取mysql.properties数据库配置文件-->
    <context:property-placeholder location="classpath:mysql.properties"/>
    <!-- 数据库连接池 -->
    <bean id="dataSource" class="com.alibaba.druid.pool.DruidDataSource">
        <!-- 连接数据库的驱动，连接字符串，用户名和登录密码-->
        <property name="driverClassName" value="${db.driver}"/>
        <property name="url" value="${db.url}"/>
        <property name="username" value="${db.username}"/>
        <property name="password" value="${db.password}"/>
        <!-- 数据池中最大连接数和最小连接数-->
        <property name="maxActive" value="10"/>
        <property name="minIdle" value="5"/>
    </bean>
    <!--SqlSessionFactoryBean对象-->
    <bean id="sqlSessionFactory" class="org.mybatis.spring.SqlSessionFactoryBean">
        <!-- 注入连接池-->
        <property name="dataSource" ref="dataSource"/>
        <!-- 注入 映射文件 mapper-->
        <property name="mapperLocations" value="classpath:org/pearl/spring/mybatis/demo/dao/*.xml"/>
    </bean>
    <!--注入userMapper-->
    <bean id="userMapper" class="org.mybatis.spring.mapper.MapperFactoryBean">
        <property name="mapperInterface" value="org.pearl.spring.mybatis.demo.dao.UserMapper"/>
        <property name="sqlSessionFactory" ref="sqlSessionFactory"/>
    </bean>
</beans>
```

测试，从xml文件中创建IOC容器，并在IOC中获取UserMapper Bean对象，进行查询操作。

```java
public class SpringTest {
    public static void main(String[] args) {
        ClassPathXmlApplicationContext context = new ClassPathXmlApplicationContext("classpath:spring-mybatis.xml");
        UserMapper userMapper = context.getBean("userMapper", UserMapper.class);
        User user = userMapper.getUser(12L);
        System.out.println(user);
    }
}
```

执行结果如下图所示：

### 3. 基于注解的方式注入Bean

添加MyBatisConfig ，使用@Bean注解注入数据源、SqlSessionFactoryBean，配置@MapperScan扫描Mapper接口，生成代理对象。

```java
@Configuration
@MapperScan(basePackages = {
     "org.pearl.spring.mybatis.demo.dao"})
public class MyBatisConfig {
    /**
     * 注入SqlSessionFactoryBean
     */
    @Bean
    public SqlSessionFactory sqlSessionFactory() throws Exception {
        SqlSessionFactoryBean factoryBean = new SqlSessionFactoryBean();
        factoryBean.setDataSource(dataSource());
        return factoryBean.getObject();
    }
    /**
     * 设置Druid数据源，配置相关属性
     */
    @Bean
    public DataSource dataSource() {
        DruidDataSource druidDataSource = new DruidDataSource();
        druidDataSource.setUrl("jdbc:mysql://127.0.0.1:3306/demo_user?serverTimezone=Asia/Shanghai");
        druidDataSource.setDriverClassName("com.mysql.cj.jdbc.Driver");
        druidDataSource.setUsername("root");
        druidDataSource.setPassword("123456");
        return druidDataSource;
    }
}
```

在IOC中获取Mapper生成的代理Bean 对象，就可以进行DAO操作了：

```java
        AnnotationConfigApplicationContext annotationConfigApplicationContext = new AnnotationConfigApplicationContext(MyBatisConfig.class);
        UserMapper userMapper11 = annotationConfigApplicationContext.getBean("userMapper", UserMapper.class);
        User user = userMapper11.getUser(12L);
        System.out.println(user);
```
