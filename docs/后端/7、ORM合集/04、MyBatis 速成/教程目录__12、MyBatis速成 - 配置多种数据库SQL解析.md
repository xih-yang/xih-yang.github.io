# 12、MyBatis速成 - 配置多种数据库SQL解析
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/9/12.html
- 分类：ORM框架
- 分组：教程目录
前一篇介绍了mybatis配置多个数据源，可以切换不同的数据库环境。有一种情况：比如一个系统中使用了多个数据源，系统该怎么判别每个sql语句使用的是哪种类型数据库的语法呢？mybatis提供了一种方法，可以在配置文件中指定每个sql语句使用的是哪种数据库语法，执行是可按照该数据库解析对应的sql。

该标签为``，在mybatis的主配置文件中添加该标签，在该标签下添加多种数据库，然后在mapper配置文件中的每个语句中指定该语句使用的是哪种数据库解析该语句。

具体操作详见实例：

## 1.创建实例类

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

## 2.创建接口类

EmployeeMapper

```java
package org.mybatis.environments;
public interface EmployeeMapper {
    public Employee getEmpById(Integer id);
}
```

## 3.创建主配置文件

mybatis-config-environments.xml

在配置文件中虹添加如下内容:

`     `

有的版本type=DB_VENDOR，但是有的版本使用的是type=VENDOR，property中的name为mybatis统一提供不能自定义，但是value是自定义的名字可随便拟定。并且databaseIdProvider 的位置需要在environments标签之下。

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
        <package name="org.mybatis.environments"/>
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
    <!-- 如果一个平台使用多个数据库，因为每个数据库都有自己特有的语法，所以系统没法判断到底每个SQL对应哪个数据库，所以可以通过
    databaseIdProvider申明多个数据库，在mapper配置文件中databaseId="mysql"或者databaseId="oracle"
     VendorDatabaseIdProvider -->
    <databaseIdProvider type="VENDOR">
      <property name="SQL Server" value="sqlserver"/>
      <property name="DB2" value="db2"/>        
      <property name="Oracle" value="oracle" />
      <property name="MySQL" value="mysql"/>
    </databaseIdProvider>
    <mappers>
        <mapper resource="mapper/environmentsmapper.xml"/>
    </mappers>
</configuration>
```

## 4.创建mapper配置文件

environmentsmapper.xml

在mapper配置文件中指定每个sql语句所使用的是哪种数据库解析，比如这里使用的是mysql数据，那么通过databaseId指定使用mysql数据库方言解析该sql。

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
  PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.mybatis.environments.EmployeeMapper">
    <select id="getEmpById" resultType="empp" databaseId="mysql">
        select id,last_name,email,gender from mybatis_employee where id ={id}
    </select>
</mapper>
```

## 5.创建测试类

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
            sqlSession.close();
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
        }
    }
}
```

可能在实际的开发过程中这种场景很少出现，可以作为一个拓展。
