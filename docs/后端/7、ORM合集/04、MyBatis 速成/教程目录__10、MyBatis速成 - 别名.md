# 10、MyBatis速成 - 别名
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/9/10.html
- 分类：ORM框架
- 分组：教程目录
前面已经介绍到了参数的传递，但是在真个过程中都使用的是全类名。本篇介绍使用别名：

## 1.创建实体类

```java
package org.mybatis.typeAliases;
import org.apache.ibatis.type.Alias;
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

## 2.创建mapper接口

```java
package org.mybatis.typeAliases;
public interface EmployeeMapper {
    public Employee getEmpById(Integer id);
}
```

## 3.创建主配置文件

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
  PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
    <!-- 
        引入外部资源文件
        resource:引入类路径下的资源文件
        url:引入磁盘或者网络路径下的资源文件
     -->
    <properties resource="db.properties"></properties>
    <!-- 
        配置驼峰命名规则 
    -->
    <settings>
        <setting name="mapUnderscoreToCamelCase" value="true"/>
    </settings>
    <!-- 
        typeAliases:别名处理器，为java类起别名
     -->
    <typeAliases>
        <!-- type为全类名，alias为别名，这里是指定一个类 -->
        <typeAlias type="org.mybatis.typeAliases.Employee" alias="emp"/>
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
    </environments> 
    <mappers>
        <mapper resource="mapper/typeAliasesmapper.xml"/>
    </mappers>
</configuration>
```

## 4.创建mapper配置文件

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
  PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<!-- 
    namespace:名稱空間，使用接口后，該項的值為接口的全類名
    id:標籤的唯一標識，使用接口后，跟接口中的方法名進行綁定
    resultType:返回值類型，想要封裝成什麼對象
   {id}:從傳遞的參數取得的值
    public Employee getEmpById(Integer id);
 -->
<mapper namespace="org.mybatis.typeAliases.EmployeeMapper">
    <!-- resultType使用别名 -->
    <select id="getEmpById" resultType="emp">
        select id,last_name,email,gender from mybatis_employee where id ={id}
    </select>
</mapper>
```

## 5.创建测试类

```java
package org.mybatis.typeAliases;
import java.io.IOException;
import java.io.InputStream;
import org.apache.ibatis.io.Resources;
import org.apache.ibatis.session.SqlSession;
import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.ibatis.session.SqlSessionFactoryBuilder;
import org.junit.Test;
import org.mybatis.typeAliases.Employee;
/**
 * 使用接口式編程
 */
public class MybatisTest {
    @Test
    public void testMybatis() {
        String resource = "mybatis-config-typeAliases.xml";//全局配置文件
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

## 6.测试结果

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
> DEBUG - Created connection 665188480.
>
> DEBUG - ooo Using Connection [com.mysql.jdbc.JDBC4Connection@27a5f880]
>
> DEBUG - ==> Preparing: select id,last_name,email,gender from mybatis_employee where id = ?
>
> DEBUG - ==> Parameters: 2(Integer)
>
> Employee [id=2, lastName=lisi, email=tang_greatman@qq.com, gender=2]
>
> DEBUG - Resetting autocommit to true on JDBC Connection [com.mysql.jdbc.JDBC4Connection@27a5f880]
>
> DEBUG - Closing JDBC Connection [com.mysql.jdbc.JDBC4Connection@27a5f880]
>
> DEBUG - Returned connection 665188480 to pool.

## 7.使用注解方案

Employee实体添加注解empp

```java
@Alias("empp")
public class Employee {
    private Integer id;
    private String lastName;
    private String email;
    private String gender;
```

主配置文件使用包扫描

```xml
<typeAliases>
    <!-- type为全类名，alias为别名，这里是指定一个类 -->
    <!--  <typeAlias type="org.mybatis.typeAliases.Employee" alias="emp"/>-->   
    <!-- 为包下的所有类起别名，默认为类名大小写（不区分大小写） -->
    <package name="org.mybatis.typeAliases"/>
</typeAliases>
```

映射配置文件使用别名empp

```xml
<!-- <select id="getEmpById" resultType="Employee"> -->
<!-- 如果上面没有添加注解empp，那么这里的resultType的值填写类名小写employee也可以进行数据封装，但是如果一个工程中出现多个类名相同的类就容易出现错误，所以不建议使用 -->
<select id="getEmpById" resultType="empp">
select id,last_name,email,gender from mybatis_employee where id ={id}
</select>
```

运行结果：

> DEBUG - Checking to see if class org.mybatis.typeAliases.MybatisTest matches criteria [is assignable to Object]
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
> DEBUG - Created connection 1399499405.
>
> DEBUG - ooo Using Connection [com.mysql.jdbc.JDBC4Connection@536aaa8d]
>
> DEBUG - ==> Preparing: select id,last_name,email,gender from mybatis_employee where id = ?
>
> DEBUG - ==> Parameters: 2(Integer)
>
> Employee [id=2, lastName=lisi, email=tang_greatman@qq.com, gender=2]
>
> DEBUG - Resetting autocommit to true on JDBC Connection [com.mysql.jdbc.JDBC4Connection@536aaa8d]
>
> DEBUG - Closing JDBC Connection [com.mysql.jdbc.JDBC4Connection@536aaa8d]
>
> DEBUG - Returned connection 1399499405 to pool.
