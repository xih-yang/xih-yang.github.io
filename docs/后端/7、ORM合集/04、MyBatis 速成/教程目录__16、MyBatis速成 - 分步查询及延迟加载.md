# 16、MyBatis速成 - 分步查询及延迟加载
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/9/16.html
- 分类：ORM框架
- 分组：教程目录
前面文章介绍了都是一个sql语句完成所有的查询操作，包括在执行联合查询的时候也是一个sql语句完成查询，然后将查询结果通过resultMap进行封装。mybatis也提供了分步查询的功能，在完成一个操作之后，将查询的结果使用到第二个三个查询参数中完成所有的查询。具体如何实现，还是结合示例做展示：

## 分步查询

**1）association**

使用association实现分步查询操作。

**创建实体**

Employee和Department

```java
package org.mybatis.resultmap;
public class Employee {
    private Integer id;
    private String lastName;
    private String email;
    private String gender;
    private Department department;
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
    public Department getDepartment() {
        return department;
    }
    public void setDepartment(Department department) {
        this.department = department;
    }
    @Override
    public String toString() {
        return "Employee [id=" + id + ", lastName=" + lastName + ", email="
                + email + ", gender=" + gender + ", department=" + department
                + "]";
    }
}
```

```java
package org.mybatis.resultmap;
public class Department {
    private Integer id;
    private String deptName;
    public Integer getId() {
        return id;
    }
    public void setId(Integer id) {
        this.id = id;
    }
    public String getDeptName() {
        return deptName;
    }
    public void setDeptName(String deptName) {
        this.deptName = deptName;
    }
    public String toString() {
        return "Department [id=" + id + ", deptName=" + deptName + "]";
    }
}
```

**创建接口类**

DepartmentMapper和EmployeeMapper

```java
package org.mybatis.resultmap;
public interface DepartmentMapper {
    public Department getDeptById(Integer id);
}
```

```java
package org.mybatis.resultmap;
public interface EmployeeMapper {
    /**
     * 分步查询
     * @param id
     * @return
     */
    public Employee getEmpAndDeptByStep(Integer id);
}
```

**创建映射配置文件**

resultmapmapper.xml对应Employee和resultmapdepartmentmapper.xml对应Department

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
  PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.mybatis.resultmap.EmployeeMapper">
    <!-- 分步查询 -->
    <resultMap type="org.mybatis.resultmap.Employee" id="mstep">
        <id column="id" property="id"/>
        <result column="last_name" property="lastName"/>
        <result column="email" property="email"/>
        <result column="gender" property="gender"/>
        <!--org.mybatis.resultmap.DepartmentMapper.getDeptById为定义的DepartmentMapper的查询接口-->
        <!--dept_id是Employee中对应Department的id值，作为传递参数-->
        <association property="department" select="org.mybatis.resultmap.DepartmentMapper.getDeptById" column="dept_id"></association>
    </resultMap>
    <select id="getEmpAndDeptByStep" resultMap="mstep">
        select * from mybatis_employee where id ={id}
    </select>
</mapper>
```

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
  PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.mybatis.resultmap.DepartmentMapper">
    <select id="getDeptById" resultType="org.mybatis.resultmap.Department">
        select id,deptName from mybatis_department where id ={id}
    </select>
</mapper>
```

**创建主配置文件**

mybatis-config-resultmap.xml

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
        <package name="org.mybatis.resultmap"/>
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
        <mapper resource="mapper/resultmapmapper.xml"/>
        <mapper resource="mapper/resultmapdepartmentmapper.xml"/>
    </mappers>
</configuration>
```

**创建测试类**

```java
package org.mybatis.resultmap;
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
        String resource = "mybatis-config-resultmap.xml";//全局配置文件
        InputStream inputStream = null;
        SqlSessionFactory sqlSessionFactory = null;
        SqlSession sqlSession = null;
        try {
            inputStream = Resources.getResourceAsStream(resource);
            sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
            sqlSession = sqlSessionFactory.openSession();
            EmployeeMapper mapper = sqlSession.getMapper(EmployeeMapper.class);
            //分步查询
            Employee emp4 = mapper.getEmpAndDeptByStep(2);
            System.out.println(emp4.getLastName());
            System.out.println("######");
            System.out.println(emp4.getDepartment());
            sqlSession.close();
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
        }
    }
}
```

**执行结果：**

> DEBUG - ooo Using Connection [com.mysql.jdbc.JDBC4Connection@528931cf]
>
> DEBUG - ==> Preparing: select * from mybatis_employee where id = ?
>
> DEBUG - ==> Parameters: 2(Integer)
>
> DEBUG - ooo Using Connection [com.mysql.jdbc.JDBC4Connection@528931cf]
>
> DEBUG - ==> Preparing: select id,deptName from mybatis_department where id = ?
>
> DEBUG - ==> Parameters: 2(Integer)
>
> lisi
>
> ·######
>
> Department [id=2, deptName=测试部]
>
> DEBUG - Resetting autocommit to true on JDBC Connection [com.mysql.jdbc.JDBC4Connection@528931cf]
>
> DEBUG - Closing JDBC Connection [com.mysql.jdbc.JDBC4Connection@528931cf]
>
> DEBUG - Returned connection 1384722895 to pool.

与之前展示的不一样的是本次操作发送了两次sql请求，先获取到第一条数据的内容，然后从第一次请求获取的结果中使用某个关联值作为第二次查询的参数。完成分步的查询操作。

**1）collection**

使用collection实现分步查询操作，跟使用association基本相似。

Employee和Department实体类不做任何修改。

DepartmentMapper添加查询方法

```java
public Department getDeptWithEmpByStep(Integer id);
```

EmployeeMapper添加查询方法

```java
/**
 * 通过部门id查询Employee
 * @param id 部门id
 */
public List<Employee> getEmpByDeptId(Integer id);
```

Employee对应的resultmapmapper.xml配置文件添加如下查询方法：

```xml
<select id="getEmpByDeptId" resultType="org.mybatis.resultmap.Employee">
    select id,last_name,email,gender,dept_id from mybatis_employee where dept_id ={deptId}
</select>
```

Department对应的resultmapdepartmentmapper.xml配置文件添加如下查询方法：

```xml
<!-- 分步查询 collection-->
<resultMap type="org.mybatis.resultmap.Department" id="mstep2">
    <id column="did" property="id"/>
    <result column="deptName" property="deptName"/>
    <!-- 一个department对应多个employee -->
    <collection property="emps" select="org.mybatis.resultmap.EmployeeMapper.getEmpByDeptId" column="did">
        <id column="eid" property="id"/>
        <result column="last_name" property="lastName"/>
        <result column="email" property="email"/>
        <result column="gender" property="gender"/>
    </collection>
</resultMap>
<select id="getDeptWithEmpByStep" resultMap="mstep2">
    SELECT
        md.id did,
        md.deptName deptName
    FROM
        mybatis_department md
    WHERE
        md.id ={id}
</select>
```

**测试collection分步查询**

```java
@Test
public void testMybatis() {
    String resource = "mybatis-config-resultmap.xml";//全局配置文件
    InputStream inputStream = null;
    SqlSessionFactory sqlSessionFactory = null;
    SqlSession sqlSession = null;
    try {
        inputStream = Resources.getResourceAsStream(resource);
        sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
        sqlSession = sqlSessionFactory.openSession();
        DepartmentMapper mapper = sqlSession.getMapper(DepartmentMapper.class);
        Department dept2 = mapper.getDeptWithEmpByStep(2);
        System.out.println(dept2);
        System.out.println(dept2.getEmps());
        sqlSession.close();
    } catch (IOException e) {
        e.printStackTrace();
    } finally {
    }
}
```

**测试结果**

> DEBUG - ooo Using Connection [com.mysql.jdbc.JDBC4Connection@4c762604]
>
> DEBUG - ==> Preparing: SELECT md.id did, md.deptName deptName FROM mybatis_department md WHERE md.id = ?
>
> DEBUG - ==> Parameters: 2(Integer)
>
> DEBUG - ooo Using Connection [com.mysql.jdbc.JDBC4Connection@4c762604]
>
> DEBUG - ==> Preparing: select id,last_name,email,gender,dept_id from mybatis_employee where dept_id = ?
>
> DEBUG - ==> Parameters: 2(Integer)
>
> Department [id=2, deptName=测试部]
>
> [Employee [id=2, lastName=lisi, email=tang_greatman@qq.com, gender=2], Employee [id=5, lastName=huanhuan, email=tang_greatman@sina.com, gender=2], Employee [id=6, lastName=huanan, email=tang_man@sina.com, gender=2]]
>
> DEBUG - Resetting autocommit to true on JDBC Connection [com.mysql.jdbc.JDBC4Connection@4c762604]
>
> DEBUG - Closing JDBC Connection [com.mysql.jdbc.JDBC4Connection@4c762604]
>
> DEBUG - Returned connection 1282811396 to pool.

同样发送了两次sql请求，数据封装完成。

**如果在第二步查询的过程中需要传递多个参数，可以使用Map的形式进行传递，如：column=”did”可以写成column=”{deptId=did}”。**

## 2.延迟加载

在分步查询的基础之上，介绍一下延迟加载的内容。

关联查询的使用中，可能每次查询只使用其中一个类的属性，关联类的属性不需要使用，能够不加载呢？mybatis提供延迟加载方案，设置延迟加载参数配置，可在使用的时候才加载某些数据。

如上面展示一次发送两个sql请求，将Employee和Department中的数据都查询出来了。如果我想在使用Department的时候才去加载Department该如何实现呢？

在主配置文件中`` 标签添加如下配置：

```xml
<setting name="lazyLoadingEnabled" value="true" />
<setting name="aggressiveLazyLoading" value="false"/>
```

再次测试

> DEBUG - ooo Using Connection [com.mysql.jdbc.JDBC4Connection@4cf4d528]
>
> DEBUG - ==> Preparing: select * from mybatis_employee where id = ?
>
> DEBUG - ==> Parameters: 2(Integer)
>
> lisi
>
> \######
>
> DEBUG - ooo Using Connection [com.mysql.jdbc.JDBC4Connection@4cf4d528]
>
> DEBUG - ==> Preparing: select id,deptName from mybatis_department where id = ?
>
> DEBUG - ==> Parameters: 2(Integer)
>
> Department [id=2, deptName=测试部]
>
> DEBUG - Resetting autocommit to true on JDBC Connection [com.mysql.jdbc.JDBC4Connection@4cf4d528]
>
> DEBUG - Closing JDBC Connection [com.mysql.jdbc.JDBC4Connection@4cf4d528]
>
> DEBUG - Returned connection 1291113768 to pool.

结果显示在使用Department之前，只发送了一个sql语句，当调用getDepartment()方法时才从后台获取数据。
