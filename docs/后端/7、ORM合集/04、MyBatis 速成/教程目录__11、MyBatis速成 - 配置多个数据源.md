# 11、MyBatis速成 - 配置多个数据源
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/9/11.html
- 分类：ORM框架
- 分组：教程目录
开发过程中会使用到多个数据源，如本地数据源，测试环境数据源，生产环境数据源。并且不同环境下数据源的各项配置也都不一样，如果不配置多个数据源，可能每次测试都要手动的改动很多的数据。mybatis提供了可以配置多个数据源的标签`environments`，在该标签下可以配置多个`environment`。

这里展示两个不同数据源之间的切换：

## 1.创建实体类

Employee

```java
package org.mybatis.environments;
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

## 2.创建方法接口类

EmployeeMapper

```java
package org.mybatis.environments;
public interface EmployeeMapper {
    public Employee getEmpById(Integer id);
}
```

## 3.创建mapper配置文件

environmentsmapper.xml

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
  PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.mybatis.environments.EmployeeMapper">
    <select id="getEmpById" resultType="empp">
        select id,last_name,email,gender from mybatis_employee where id ={id}
    </select>
</mapper>
```

## 4.创建数据源配置文件

db.properties

生产环境数据库为td_xkd

测试环境数据库为td_xkd_test

> mysql.driver=com.mysql.jdbc.Driver
>
> mysql.url=jdbc:mysql://localhost:3306/td_xkd
>
> mysql.username=root
>
> mysql.password=1234
>
> mysql.drivertest=com.mysql.jdbc.Driver
>
> mysql.urltest=jdbc:mysql://localhost:3306/td_xkd_test
>
> mysql.usernametest=root
>
> mysql.passwordtest=1234

## 5.创建主配置文件

mybatis-config-environments.xml

transactionManager 为事务管理器，mybatis提供了两种事务管理器，分别是JDBC和MANAGED。

JDBC表示使用jdbc的方式进行事务控制，MANAGED表示使用J2EE容器的方式进行事务管理，最终方案还是使用Spring的事务管理，这里只做了解。

dataSource数据源类型默认使用POOLED，还有其他UNPOOLED和JNDI两种方式，当然也可以通过实现DataSourceFactory接口返回C3P0等类型的数据源配置自定义的数据源，此时type配置为实现DataSourceFactory接口类的全类名即可。最终还是在结合了Spring之后，使用Spring来配置。

数据也可以配置不同类型的数据库mysql，oracle

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
        <package name="org.mybatis.environments"/>
    </typeAliases>
    <environments default="dev_mysql">
        <!-- 配置生产环境数据源dev_mysql -->
        <environment id="dev_mysql">
            <transactionManager type="JDBC" />
            <dataSource type="POOLED">
                <property name="driver" value="${mysql.driver}" />
                <property name="url" value="${mysql.url}" />
                <property name="username" value="${mysql.username}" />
                <property name="password" value="${mysql.password}" />
            </dataSource>
        </environment>
        <!-- 配置测试环境数据源test_mysql -->
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
        <mapper resource="mapper/environmentsmapper.xml"/>
    </mappers>
</configuration>
```

## 6.创建测试类

```java
package org.mybatis.environments;
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
        String resource = "mybatis-config-environments.xml";//全局配置文件
        InputStream inputStream = null;
        SqlSessionFactory sqlSessionFactory = null;
        SqlSession sqlSession = null;
        try {
            inputStream = Resources.getResourceAsStream(resource);
            sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
            sqlSession = sqlSessionFactory.openSession();
            EmployeeMapper mapper = sqlSession.getMapper(EmployeeMapper.class);
            Employee emp = mapper.getEmpById(2);
            System.out.println(emp);
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            sqlSession.close();
        }
    }
}
```

测试过程中，将``标签配置不同环境``的id值
