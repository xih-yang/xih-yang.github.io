# 14、MyBatis速成 - 参数处理#和$
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/9/14.html
- 分类：ORM框架
- 分组：教程目录
前面演示了Mybatis的部分属性，在操作数据库的时候sql中参数的传递都是使用#{}，其实Mybatis还提供了`$`{}处理参数的方式，也经常被使用。但是使用#{}和`$`{}到底有什么区别呢，这篇做一个对比，主要以例子查看差别。

## 1.创建实体类

Employee

```java
package org.mybatis.dealParams;
import org.apache.ibatis.type.Alias;
@Alias("empp")
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

## 2.创建接口类

EmployeeMapper

```java
package org.mybatis.dealParams;
import org.apache.ibatis.annotations.Param;
public interface EmployeeMapper {
    public Employee getEmpById(Integer id);
    public Employee getEmpByIdAndLastName(@Param("id")Integer id,@Param("lastName")String lastName);
}
```

## 3.创建mapper映射文件

dealparamsmapper.xml

这里参数传递全部使用#{} 传递。

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
  PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.mybatis.dealParams.EmployeeMapper">
    <select id="getEmpById" resultType="empp">
        select id,last_name,email,gender from mybatis_employee where id ={id}
    </select>
    <select id="getEmpByIdAndLastName" resultType="empp">
        select id,last_name,email,gender from mybatis_employee where id ={id} and last_name like{lastName}
    </select>
</mapper>
```

## 4.创建主配置文件

mybatis-config-dealparams.xml，引用mapper配置文件

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
  PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
    <properties resource="db.properties"></properties>
    <settings>
        <setting name="mapUnderscoreToCamelCase" value="true"/>
    </settings>
    <typeAliases>
        <!-- 为包下的所有类起别名，默认为类名大小写（不区分大小写） -->
        <package name="org.mybatis.dealParams"/>
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
        <mapper resource="mapper/dealparamsmapper.xml"/>
    </mappers>
</configuration>
```

## 5.创建测试类

在测试类中调用getEmpByIdAndLastName(2, “%li%”)方法，传递id为2，lastName为%li%进行查询。

```java
package org.mybatis.dealParams;
import java.io.IOException;
import java.io.InputStream;
import org.apache.ibatis.io.Resources;
import org.apache.ibatis.session.SqlSession;
import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.ibatis.session.SqlSessionFactoryBuilder;
import org.junit.Test;
/**
 * 使用接口式編程
 */
public class MybatisTest {
    @Test
    public void testMybatis() {
        String resource = "mybatis-config-dealparams.xml";//全局配置文件
        InputStream inputStream = null;
        SqlSessionFactory sqlSessionFactory = null;
        SqlSession sqlSession = null;
        try {
            inputStream = Resources.getResourceAsStream(resource);
            sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
            sqlSession = sqlSessionFactory.openSession();
            EmployeeMapper mapper = sqlSession.getMapper(EmployeeMapper.class);
            Employee emp = mapper.getEmpByIdAndLastName(2, "%li%");
            System.out.println(emp);
            sqlSession.close();
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
        }
    }
}
```

执行结果如下：

> DEBUG - ooo Using Connection [com.mysql.jdbc.JDBC4Connection@4232c52b]
>
> DEBUG - ==> Preparing: select id,last_name,email,gender from mybatis_employee where id = ? and last_name like ?
>
> DEBUG - ==> Parameters: 2(Integer), %li%(String)
>
> Employee [id=2, lastName=lisi, email=tang_greatman@qq.com, gender=2]
>
> DEBUG - Resetting autocommit to true on JDBC Connection [com.mysql.jdbc.JDBC4Connection@4232c52b]
>
> DEBUG - Closing JDBC Connection [com.mysql.jdbc.JDBC4Connection@4232c52b]
>
> DEBUG - Returned connection 1110623531 to pool.

由打印的结果可以看到执行的sql语句使用的是预编译的形式处理。

## 6.使用$处理参数

将#{id} 改成`$`{id} 进行处理：

```xml
<select id="getEmpByIdAndLastName" resultType="empp">
        select id,last_name,email,gender from mybatis_employee where id = ${id} and last_name like{lastName}
    </select>
```

执行结果如下：

> DEBUG - ooo Using Connection [com.mysql.jdbc.JDBC4Connection@58c1670b]
>
> DEBUG - ==> Preparing: select id,last_name,email,gender from mybatis_employee where id = 2 and last_name like ?
>
> DEBUG - ==> Parameters: %li%(String)
>
> Employee [id=2, lastName=lisi, email=tang_greatman@qq.com, gender=2]
>
> DEBUG - Resetting autocommit to true on JDBC Connection [com.mysql.jdbc.JDBC4Connection@58c1670b]
>
> DEBUG - Closing JDBC Connection [com.mysql.jdbc.JDBC4Connection@58c1670b]
>
> DEBUG - Returned connection 1489069835 to pool.

由结果可以看出这里使用的是sql拼接的方式进行处理的。

两种方式都可以参数的处理，不难发现第一种不会出现sql注入，第二种方式会出现sql注入的情况。那么第二种方式又有什么存在的价值呢？

其实使用`$`{} 方式对于处理分库分表的情况是必不可少的是#{}无法替代的。

比如有很多的订单表，2015_order_info,2016_order_info,2017_order_info等多张订单表，如果想按照年份查询订单数据该怎么处理呢？

这里做一个演示：

添加getEmpByIdAndLastNameAndTableName方法：

```java
public Employee getEmpByIdAndLastNameAndTableName(@Param("tableName")String tableName,@Param("id")Integer id,@Param("lastName")String lastName);
```

拼接表名：

```xml
<select id="getEmpByIdAndLastNameAndTableName" resultType="empp">
        select id,last_name,email,gender from ${tableName}_employee where id ={id} and last_name like{lastName}
    </select>
```

测试：

```java
@Test
    public void testMybatis() {
        String resource = "mybatis-config-dealparams.xml";//全局配置文件
        InputStream inputStream = null;
        SqlSessionFactory sqlSessionFactory = null;
        SqlSession sqlSession = null;
        try {
            inputStream = Resources.getResourceAsStream(resource);
            sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
            sqlSession = sqlSessionFactory.openSession();
            EmployeeMapper mapper = sqlSession.getMapper(EmployeeMapper.class);
//          Employee emp = mapper.getEmpByIdAndLastName(2, "%li%");
            Employee emp = mapper.getEmpByIdAndLastNameAndTableName("mybatis", 2, "%li%");
            System.out.println(emp);
            sqlSession.close();
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
        }
    }
```

执行结果：

> DEBUG - ooo Using Connection [com.mysql.jdbc.JDBC4Connection@58c1670b]
>
> DEBUG - ==> Preparing: select id,last_name,email,gender from mybatis_employee where id = ? and last_name like ?
>
> DEBUG - ==> Parameters: 2(Integer), %li%(String)
>
> Employee [id=2, lastName=lisi, email=tang_greatman@qq.com, gender=2]
>
> DEBUG - Resetting autocommit to true on JDBC Connection [com.mysql.jdbc.JDBC4Connection@58c1670b]
>
> DEBUG - Closing JDBC Connection [com.mysql.jdbc.JDBC4Connection@58c1670b]
>
> DEBUG - Returned connection 1489069835 to pool.

由结果可以看到表名mybatis_employee拼接成功。
