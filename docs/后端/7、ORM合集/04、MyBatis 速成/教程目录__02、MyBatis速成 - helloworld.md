# 02、MyBatis速成 - helloworld
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/9/2.html
- 分类：ORM框架
- 分组：教程目录
本系列都是通过maven构建项目，如果不清楚maven的请先看我的maven系列

本次选用mybatis-3.2.1版本作为演示版本，log4j作为日志的实现，mysql作为数据库。

## 1.pom.xml配置mybatis包

```xml
<dependency>
        <groupId>mysql</groupId>
        <artifactId>mysql-connector-java</artifactId>
        <version>5.1.35</version>
    </dependency>
    <dependency>
        <groupId>org.mybatis</groupId>
        <artifactId>mybatis</artifactId>
        <version>3.2.1</version>
    </dependency>
    <dependency>
        <groupId>org.slf4j</groupId>
        <artifactId>slf4j-api</artifactId>
        <version>1.7.12</version>
    </dependency>
    <dependency>
        <groupId>org.slf4j</groupId>
        <artifactId>slf4j-log4j12</artifactId>
        <version>1.7.6</version>
    </dependency>
    <dependency>
        <groupId>log4j</groupId>
        <artifactId>log4j</artifactId>
        <version>1.2.17</version>
    </dependency>
```

## 2.引入log4j

maven工程resources文件夹创建log4j.xml文件，配置如下内容（该内容从log4j官方网站下载，未做任何修改）

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE log4j:configuration PUBLIC "-//APACHE//DTD LOG4J 1.2//EN" "log4j.dtd">
<log4j:configuration xmlns:log4j="http://jakarta.apache.org/log4j/">
  <appender name="A1" class="org.apache.log4j.FileAppender">
    <param name="File"   value="A1.log" />
    <param name="Append" value="false" />
    <layout class="org.apache.log4j.xml.XMLLayout" />
  </appender>
  <appender name="STDOUT" class="org.apache.log4j.ConsoleAppender">
    <layout class="org.apache.log4j.SimpleLayout" />
  </appender>
  <category name="org.apache.log4j.xml">
    <priority value="debug" />
    <appender-ref ref="A1" />
  </category>
  <root>
    <priority value ="debug" />
    <appender-ref ref="STDOUT" />
  </root>
</log4j:configuration>
```

## 3.添加mapper配置文件

新建helloworldmapper.xml，添加如下信息（这里的数据库表mybatis_employee创建就不在演示）

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
  PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<!-- 
    namespace:命名空间-可随便写
    id:唯一标识
    resultType:返回值类型，想要封装成什么对象
   {id}:从传递的参数取得的值
 -->
<mapper namespace="org.mybatis.helloworld.EmployeeMapper">
    <select id="selectEmployee" resultType="org.mybatis.helloworld.Employee">
        select id,last_name lastName,email,gender from mybatis_employee where id ={id}
    </select>
</mapper>
```

## 4.添加主配置文件

新建mybatis-config.xml文件，添加如下信息

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
  PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
    <!-- mybatis官方说明，可以不使用该配置文件完成操作，但是通过该配置文件可以简化很多操作 -->
    <environments default="development">
        <environment id="development">
            <transactionManager type="JDBC" />
            <dataSource type="POOLED">
                <property name="driver" value="com.mysql.jdbc.Driver" />
                <property name="url" value="jdbc:mysql://localhost:3306/td_xkd" />
                <property name="username" value="root" />
                <property name="password" value="1234" />
            </dataSource>
        </environment>
    </environments>
    <mappers>
        <mapper resource="helloworldmapper.xml" /><!-- 添加的配置文件 -->
    </mappers>
</configuration>
```

## 5.创建实体类

新建employee.java

```java
package org.mybatis.helloworld;
public class Employee {
    private Integer id;
    private String lastName;
    private String email;
    private String gender;
    public Integer getId() {
        return id;
    }
    public void setId(Integer id) {
        this.id = id;
    }
    public String getLastName() {
        return lastName;
    }
    public void setLastName(String lastName) {
        this.lastName = lastName;
    }
    public String getEmail() {
        return email;
    }
    public void setEmail(String email) {
        this.email = email;
    }
    public String getGender() {
        return gender;
    }
    public void setGender(String gender) {
        this.gender = gender;
    }
    @Override
    public String toString() {
        return "Employee [id=" + id + ", lastName=" + lastName + ", email=" + email
                + ", gender=" + gender + "]";
    }
}
```

创建测试类

```java
package org.mybatis.helloworld;
import java.io.IOException;
import java.io.InputStream;
import org.apache.ibatis.io.Resources;
import org.apache.ibatis.session.SqlSession;
import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.ibatis.session.SqlSessionFactoryBuilder;
import org.junit.Test;
public class MybatisTest {
    @Test
    public void test1(){
        //全局配置文件
        String resource = "mybatis-config.xml";
        InputStream inputStream = null;
        SqlSessionFactory sqlSessionFactory = null;
        SqlSession sqlSession = null;
        try {
            inputStream = Resources.getResourceAsStream(resource);
            sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
            sqlSession = sqlSessionFactory.openSession();
//第一個参数org.mybatis.helloworld.EmployeeMapper为映射文件helloworldmapper.xml中的namespace，selectEmployee为映射文件helloworldmapper.xml中的select标签中的id。在这里拼接为一个字符串，第二個参数为传递的参数对应数据库中的id
            Employee employee = sqlSession.selectOne("org.mybatis.helloworld.EmployeeMapper.selectEmployee", 1);
            System.out.println(employee);
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            sqlSession.close();
        }
    }
}
```

> DEBUG - Logging initialized using ‘class org.apache.ibatis.logging.slf4j.Slf4jImpl’ adapter.
>
> DEBUG - PooledDataSource forcefully closed/removed all connections.
>
> DEBUG - PooledDataSource forcefully closed/removed all connections.
>
> DEBUG - PooledDataSource forcefully closed/removed all connections.
>
> DEBUG - PooledDataSource forcefully closed/removed all connections.
>
> DEBUG - Openning JDBC Connection
>
> DEBUG - Created connection 503195940.
>
> DEBUG - ooo Using Connection [com.mysql.jdbc.JDBC4Connection@1dfe2924]
>
> **DEBUG - ==> Preparing: select id,last_name lastName,email,gender from mybatis_employee where id = ?
>
> DEBUG - ==> Parameters: 1(Integer)
>
> Employee [id=1, lastName=zhangsan, email=bestjinyi@163.com, gender=1]**
>
> DEBUG - Resetting autocommit to true on JDBC Connection [com.mysql.jdbc.JDBC4Connection@1dfe2924]
>
> DEBUG - Closing JDBC Connection [com.mysql.jdbc.JDBC4Connection@1dfe2924]
>
> DEBUG - Returned connection 503195940 to pool.

这里lastName使用的是别名：select id,last_name lastName,email,gender from mybatis_employee where id = ?

如果没有别名lastName，那么获取到的数据是null，因为mybatis暂时还没法那么智能的判别数据库使用的到底是什么名。这个会在以后的文章中指出驼峰命名来解决问题。
