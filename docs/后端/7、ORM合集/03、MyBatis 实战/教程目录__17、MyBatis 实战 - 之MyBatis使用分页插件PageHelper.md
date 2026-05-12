# 17、MyBatis 实战 - 之MyBatis使用分页插件PageHelper
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/6/17.html
- 分类：ORM框架
- 分组：教程目录
## 一、关于mysql的分页说明

**1、mysql当中的分页sql需要使用limit关键字。**

**2、limit 语法格式:**

limit startIndex,pageSize

startIndex ：开始下标

pageSize：显示的记录条数

select * from t car limit 0, 3;

mysql当中起始行的下标从0开始。第一条记录的下标是0

**3、计算下标**

假设每页显示3条记录:

第1页:limit 0,3 (012)

第2页:limit 3,3 (345)

第3页:limit 6,3(678)

第4页:limit 9,3 (910 11)

…

假设每页显示pageSize条记录，第pageNum页，使用limit表示：

```java
limit (pageNum-1)*pageSize，pageSize
```

**4、小细节**

```java
select * from t car limit 2; 和 select * from t car limit 0，2;是等效的。
```

## 二、MyBatis使用分页插件PageHelper

**1、引入分页插件pagehelper的依赖**

```xml
<!--分页插件pagehelper-->
      <dependency>
          <groupId>com.github.pagehelper</groupId>
          <artifactId>pagehelper</artifactId>
          <version>5.3.1</version>
      </dependency>
```

**2、mybatis-cofig.xml配置mybatis分页的拦截器**

```java
plugin interceptor="com.github.pagehelper.PageInterceptor"
```

完整配置如下：

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
        PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
    <properties resource="jdbc.properties"/>
    <settings>
        <setting name="lazyLoadingEnabled" value="true"/>
    </settings>
    <typeAliases>
        <package name="com.powernode.mybatis.pojo" />
    </typeAliases>
    <!--mybatis分页的拦截器-->
    <plugins>
        <plugin interceptor="com.github.pagehelper.PageInterceptor">			       </plugin>
    </plugins>
    <environments default="dev">
        <environment id="dev">
            <transactionManager type="JDBC"/>
            <dataSource type="POOLED">
                <property name="driver" value="${jdbc.driver}"/>
                <property name="url" value="${jdbc.url}"/>
                <property name="username" value="${jdbc.username}"/>
                <property name="password" value="${jdbc.password}"/>
            </dataSource>
        </environment>
    </environments>
    <mappers>
        <package name="com.powernode.mybatis.mapper"/>
    </mappers>
</configuration>
```

**3、pojo类Clazz**

```java
public class Clazz implements Serializable {
    private Integer cid;
    private String name;
    ......此处省略get、set方法
}
```

**4、** ClazzMapper接口；

```java
public interface ClazzMapper {
    List<Clazz> selectAll();
}
```

**5、ClazzMapper.xml文件**

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.powernode.mybatis.mapper.ClazzMapper">
    <select id="selectAll" resultType="Clazz">
        select * from t_clazz
    </select>
</mapper>
```

**6、** 测试类趴一下；

记得在查询sql之前，加上这句PageHelper.startPage(pageNum,pageSize);相当于开启PageHelper，否则分页不会生效。

```java
@Test
    public void testAll(){
        SqlSession sqlSession = SqlSessionUtil.openSqlSession();
        ClazzMapper mapper = sqlSession.getMapper(ClazzMapper.class);
        int pageNum = 2;
        int pageSize = 2;
        PageHelper.startPage(pageNum,pageSize);
        List<Clazz> clazzes = mapper.selectAll();
        clazzes.forEach(e-> System.out.println(e));
        sqlSession.close();
    }
```

运行结果

如果需要更加详细的信息，可以使用PageInfo对象来处理：

PageInfo pageInfo = new PageInfo<>(clazzes,4)

```java
@Test
    public void testAll(){
        SqlSession sqlSession = SqlSessionUtil.openSqlSession();
        ClazzMapper mapper = sqlSession.getMapper(ClazzMapper.class);
        int pageNum = 2;
        int pageSize = 2;
        PageHelper.startPage(pageNum,pageSize);
        List<Clazz> clazzes = mapper.selectAll();
        PageInfo<Clazz> pageInfo = new PageInfo<>(clazzes,4);
        System.out.println(pageInfo);
        sqlSession.close();
    }
```

运行结果，会有非常详细的分页查询信息

```java
PageInfo{
     pageNum=2, pageSize=2, size=2, startRow=3, endRow=4, total=10, pages=5, list=Page{
     count=true, pageNum=2, pageSize=2, startRow=2, endRow=4, total=10, pages=5, reasonable=false, pageSizeZero=false}[Clazz{
     cid=1003, name='高三三班', stus=null}, Clazz{
     cid=1004, name='高三四班', stus=null}], prePage=1, nextPage=3, isFirstPage=false, isLastPage=false, hasPreviousPage=true, hasNextPage=true, navigatePages=4, navigateFirstPage=1, navigateLastPage=4, navigatepageNums=[1, 2, 3, 4]}
```
