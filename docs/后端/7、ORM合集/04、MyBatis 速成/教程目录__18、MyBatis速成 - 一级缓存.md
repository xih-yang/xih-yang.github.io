# 18、MyBatis速成 - 一级缓存
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/9/18.html
- 分类：ORM框架
- 分组：教程目录
MyBatis 包含一个非常强大的查询缓存特性,它可以非常方便地配置和定制。MyBatis 3 中的缓存实现的很多改进都已经实现了,使得它更加强大而且易于配置。

默认情况下是没有开启缓存（二级缓存-全局缓存）的,除了局部的 session 缓存,可以增强变现而且处理循环依赖也是必须的。

局部session也就是说的一级缓存（本地缓存），本篇内容将对一级缓存做一下展示和介绍

## 1.一级缓存效果

下面先看一下一级缓存的效果：

**创建实体类**

Employee

```java
package org.mybatis.cache;
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
    public String toString() {
        return "Employee [id=" + id + ", lastName=" + lastName + ", email="
                + email + ", gender=" + gender + "]";
    }
}
```

**创建接口**

EmployeeMapper

```java
package org.mybatis.cache;
public interface EmployeeMapper {
    public Employee getEmpById(Integer id);
}
```

**创建映射配置文件**

cachemapper.xml

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
  PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.mybatis.cache.EmployeeMapper">
    <select id="getEmpById" resultType="org.mybatis.cache.Employee">
        select * from mybatis_employee me where me.id ={id}
    </select>
</mapper>
```

**创建主配置文件**

mybatis-config-cache.xml

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
  PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
    <properties resource="db.properties"></properties>
    <settings>
        <setting name="mapUnderscoreToCamelCase" value="true"/>
        <setting name="lazyLoadingEnabled" value="true" />
        <setting name="aggressiveLazyLoading" value="false"/>
    </settings>
    <typeAliases>
        <!-- 为包下的所有类起别名，默认为类名大小写（不区分大小写） -->
        <package name="org.mybatis.cache"/>
    </typeAliases>
    <!-- 默认development是开发环境，如果改成test则表示使用测试环境 -->
    <environments default="dev_mysql">
        <environment id="dev_mysql">
            <transactionManager type="JDBC" />
            <dataSource type="POOLED">
                <property name="driver" value="${mysql.driver}" />
                <property name="url" value="${mysql.url}" />
                <property name="username" value="${mysql.username}" />
                <property name="password" value="${mysql.password}" />
            </dataSource>
        </environment>
        <environment id="test_mysql">
            <transactionManager type="JDBC"></transactionManager>
            <dataSource type="POOLED">
                <property name="driver" value="${mysql.drivertest}" />
                <property name="url" value="${mysql.urltest}" />
                <property name="username" value="${mysql.usernametest}" />
                <property name="password" value="${mysql.passwordtest}" />
            </dataSource>
        </environment>
    </environments>
    <mappers>
        <mapper resource="mapper/cachemapper.xml"/>
    </mappers>
</configuration>
```

**创建测试类**

```java
package org.mybatis.cache;
import java.io.IOException;
import java.io.InputStream;
import org.apache.ibatis.io.Resources;
import org.apache.ibatis.session.SqlSession;
import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.ibatis.session.SqlSessionFactoryBuilder;
import org.junit.Test;
public class MybatisTest {
    @Test
    public void testMybatis() {
        String resource = "mybatis-config-cache.xml";//全局配置文件
        InputStream inputStream = null;
        SqlSessionFactory sqlSessionFactory = null;
        SqlSession sqlSession = null;
        try {
            inputStream = Resources.getResourceAsStream(resource);
            sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
            sqlSession = sqlSessionFactory.openSession();
            EmployeeMapper mapper = sqlSession.getMapper(EmployeeMapper.class);
            Employee emp1 = mapper.getEmpById(2);
            System.out.println(emp1);
            System.out.println("######");
            Employee emp2 = mapper.getEmpById(2);
            System.out.println(emp2);
            sqlSession.close();
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
        }
    }
}
```

查询id=2的Employee在测试类中操作了两次，测试结果：

> DEBUG - ooo Using Connection [com.mysql.jdbc.JDBC4Connection@47db50c5]
>
> DEBUG - ==> Preparing: select * from mybatis_employee me where me.id = ?
>
> DEBUG - ==> Parameters: 2(Integer)
>
> Employee [id=2, lastName=lisi, email=tang_greatman@qq.com, gender=2]
>
> \######
>
> Employee [id=2, lastName=lisi, email=tang_greatman@qq.com, gender=2]
>
> true
>
> DEBUG - Resetting autocommit to true on JDBC Connection [com.mysql.jdbc.JDBC4Connection@47db50c5]
>
> DEBUG - Closing JDBC Connection [com.mysql.jdbc.JDBC4Connection@47db50c5]
>
> DEBUG - Returned connection 1205555397 to pool.

结果中只执行了一次sql查询，剩下的一次查询实际上就是从mybatis缓存中获取到的数据。

## 2.一级缓存失效情况

**1）sqlSession不同**

```java
@Test
public void testMybatis() {
    String resource = "mybatis-config-cache.xml";//全局配置文件
    InputStream inputStream = null;
    SqlSessionFactory sqlSessionFactory = null;
    try {
        inputStream = Resources.getResourceAsStream(resource);
        sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
        SqlSession sqlSession1 = sqlSessionFactory.openSession();
        EmployeeMapper mapper1 = sqlSession1.getMapper(EmployeeMapper.class);
        Employee emp1 = mapper1.getEmpById(2);
        System.out.println(emp1);
        System.out.println("######");
        SqlSession sqlSession2 = sqlSessionFactory.openSession();
        EmployeeMapper mapper2 = sqlSession2.getMapper(EmployeeMapper.class);
        Employee emp2 = mapper2.getEmpById(2);
        System.out.println(emp2);
        sqlSession1.close();
        sqlSession2.close();
    } catch (IOException e) {
        e.printStackTrace();
    } finally {
    }
}
```

**2）sqlSession相同，查询条件不同（一级缓存中还没有缓存该数据）**

```java
@Test
public void testMybatis() {
    String resource = "mybatis-config-cache.xml";//全局配置文件
    InputStream inputStream = null;
    SqlSessionFactory sqlSessionFactory = null;
    try {
        inputStream = Resources.getResourceAsStream(resource);
        sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
        SqlSession sqlSession1 = sqlSessionFactory.openSession();
        EmployeeMapper mapper1 = sqlSession1.getMapper(EmployeeMapper.class);
        Employee emp1 = mapper1.getEmpById(2);
        System.out.println(emp1);
        System.out.println("######");
        Employee emp2 = mapper1.getEmpById(3);
        System.out.println(emp2);
        System.out.println(emp1 == emp2);
        sqlSession1.close();
    } catch (IOException e) {
        e.printStackTrace();
    } finally {
    }
}
```

**3）sqlSession相同，两次查询之间做了增删改操作**

EmployeeMapper接口添加新增方法

```java
public void addEmp(Employee emp);
```

cachemapper.xml配置文件中添加新增方法配置

```xml
<insert id="addEmp" parameterType="org.mybatis.cache.Employee" useGeneratedKeys="true" keyProperty="id">
        insert into mybatis_employee 
        (last_name,email,gender) 
        values 
        (#{lastName},#{email},#{gender});
    </insert>
```

```java
@Test
    public void testMybatis() {
        String resource = "mybatis-config-cache.xml";//全局配置文件
        InputStream inputStream = null;
        SqlSessionFactory sqlSessionFactory = null;
        try {
            inputStream = Resources.getResourceAsStream(resource);
            sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
            SqlSession sqlSession1 = sqlSessionFactory.openSession();
            EmployeeMapper mapper1 = sqlSession1.getMapper(EmployeeMapper.class);
            Employee emp1 = mapper1.getEmpById(2);
            System.out.println(emp1);
            System.out.println("######");
            //执行增删改操作
            mapper1.addEmp(new Employee(null, "xiaohua", "295273263@qq.com", "1"));
            sqlSession1.commit();
            Employee emp2 = mapper1.getEmpById(2);
            System.out.println(emp2);
            System.out.println(emp1 == emp2);
            sqlSession1.close();
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
        }
    }
```

4）sqlSession相同，手动清除了一级缓存

```java
@Test
public void testMybatis() {
    String resource = "mybatis-config-cache.xml";//全局配置文件
    InputStream inputStream = null;
    SqlSessionFactory sqlSessionFactory = null;
    try {
        inputStream = Resources.getResourceAsStream(resource);
        sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
        SqlSession sqlSession1 = sqlSessionFactory.openSession();
        EmployeeMapper mapper1 = sqlSession1.getMapper(EmployeeMapper.class);
        Employee emp1 = mapper1.getEmpById(2);
        System.out.println(emp1);
        System.out.println("######");
        //手动清楚sqlSession缓存
        sqlSession1.clearCache();
        Employee emp2 = mapper1.getEmpById(2);
        System.out.println(emp2);
        System.out.println(emp1 == emp2);
        sqlSession1.close();
    } catch (IOException e) {
        e.printStackTrace();
    } finally {
    }
}
```

以上介绍了一级缓存失效或者不起作用的几种情况。

当然还有一点可能会被忽视：在执行操作未完成情况下数据库该条内容发生改变，mybatis是无法判别的，mybatis还是取sqlSession缓存操作

```java
@Test
    public void testMybatis() {
        String resource = "mybatis-config-cache.xml";//全局配置文件
        InputStream inputStream = null;
        SqlSessionFactory sqlSessionFactory = null;
        try {
            inputStream = Resources.getResourceAsStream(resource);
            sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
            SqlSession sqlSession1 = sqlSessionFactory.openSession();
            EmployeeMapper mapper1 = sqlSession1.getMapper(EmployeeMapper.class);
            Employee emp1 = mapper1.getEmpById(2);
            System.out.println(emp1);
            System.out.println("######");
            try {
                Thread.sleep(1000*20);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            Employee emp2 = mapper1.getEmpById(2);
            System.out.println(emp2);
            System.out.println(emp1 == emp2);
            sqlSession1.close();
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
        }
    }
```

## 3.一级缓存原理

一级缓存原理实现：实际在sqlsession中有一个数据区域，是map结构，这个区域就是一级缓存区域。

一级缓存中的key是由sql语句、条件、statement等信息组成一个唯一值。一级缓存中的value，就是查询出的结果对象。

图片引自[mybatis–查询缓存](http://blog.csdn.net/csdn_gia/article/details/54948791)
