# 13、MyBatis 实战 - 之MyBatis一对多映射查询
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/6/13.html
- 分类：ORM框架
- 分组：教程目录
## 一、两种方式

**1、** 使用collection标签；

**2、** 分步查询；

两张表如下：

学生表t_stu 和 班级表 t_clazz，学生表的cid和班级表的cid关联，

表示一个班级有多个学生

## 二、使用collection标签

pojo类 Clazz

注意：里面的学生集合类，因为一个班级有多个学生，所以使用集合来存放学生类

```java
public class Clazz {
    private Integer cid;
    private String name;
    private List<Stu> stus;
    .....此处省略get、set、构造器方法
```

ClazzMapper接口

```java
public interface ClazzMapper {
    public Clazz selectSingAsManyByCollection(Integer cid);
}
```

ClazzMapper.xml文件

注意：collection 标签的ofType属性，表示集合的类型，比如List,集合的类型就是Stu类

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.powernode.mybatis.mapper.ClazzMapper">
    <!--方式一：colleciton-->
    <resultMap id="singAsManyByCollectionMap" type="Clazz">
        <id property="cid" column="cid"/>
        <result property="name" column="name"/>
        <collection property="stus" ofType="Stu">
            <id property="sid" column="sid"/>
            <result property="name" column="name"/>
        </collection>
    </resultMap>
    <select id="selectSingAsManyByCollection" resultMap="singAsManyByCollectionMap">
        select c.cid,c.name,s.sid,s.name,s.cid 
        from t_clazz c LEFT JOIN t_stu s on c.cid = s.cid
        where c.cid ={cid}
    </select>
</mapper>
```

测试类趴一下

```java
@Test
    public void testSingAsManyByCollection(){
        SqlSession sqlSession = SqlSessionUtil.openSqlSession();
        ClazzMapper mapper = sqlSession.getMapper(ClazzMapper.class);
        Clazz clazz = mapper.selectSingAsManyByCollection(1000);
        System.out.println(clazz.toString());
        sqlSession.close();
    }
```

运行结果：

```java
20:45:36.399 default [main] DEBUG c.p.m.m.C.selectSingAsManyByCollection - ==>  Preparing: select c.cid,c.name,s.sid,s.name,s.cid from t_clazz c LEFT JOIN t_stu s on c.cid = s.cid where c.cid = ?
20:45:36.484 default [main] DEBUG c.p.m.m.C.selectSingAsManyByCollection - ==> Parameters: 1000(Integer)
20:45:36.566 default [main] DEBUG c.p.m.m.C.selectSingAsManyByCollection - <==      Total: 3
Clazz{
     cid=1000, name='高三一班', stus=[Stu{
     sid=1, name='高三一班', clazz=null}, Stu{
     sid=2, name='高三一班', clazz=null}, Stu{
     sid=3, name='高三一班', clazz=null}]}
```

## 三、分步查询

pojo类 Clazz

注意：里面的学生集合类，因为一个班级有多个学生，所以使用集合来存放学生类

```java
public class Clazz {
    private Integer cid;
    private String name;
    private List<Stu> stus;
    .....此处省略get、set、构造器方法
```

pojo类 Stu

```java
public class Stu {
    private Integer sid;
    private String name;
    .....此处省略get、set、构造器方法
```

ClazzMapper接口

```java
public interface ClazzMapper {
    public Clazz selectSingAsManyByCidStep1(Integer cid);
}
```

StuMapper接口

```java
public interface StuMapper {
    public List<Stu> selectByCid(Integer cid);
}
```

StuMapper.xml文件

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.powernode.mybatis.mapper.StuMapper">
    <select id="selectByCid" resultType="Stu">
        select sid,name,cid from t_stu where cid=#{cid}
    </select>
</mapper>
```

ClazzMapper.xml文件

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.powernode.mybatis.mapper.ClazzMapper">
    <!--方式二：分步查询-->
    <resultMap id="singAsManyStepMap" type="Clazz">
        <id property="cid" column="cid"/>
        <result property="name" column="name"/>
        <collection property="stus"
                    select="com.powernode.mybatis.mapper.StuMapper.selectByCid"
                    column="cid"/>
    </resultMap>
    <select id="selectSingAsManyByCidStep1" resultMap="singAsManyStepMap">
        select c.cid,c.name from t_clazz c
        where c.cid ={cid}
    </select>
</mapper>
```

测试类趴一下

```java
@Test
    public void testSingAsManyByCidStep(){
        SqlSession sqlSession = SqlSessionUtil.openSqlSession();
        ClazzMapper mapper = sqlSession.getMapper(ClazzMapper.class);
        Clazz clazz = mapper.selectSingAsManyByCidStep1(1001);
        System.out.println(clazz);
        sqlSession.close();
    }
```

运行结果如下：

```java
20:56:05.559 default [main] DEBUG c.p.m.m.C.selectSingAsManyByCidStep1 - ==>  Preparing: select c.cid,c.name from t_clazz c where c.cid = ?
20:56:05.700 default [main] DEBUG c.p.m.m.C.selectSingAsManyByCidStep1 - ==> Parameters: 1001(Integer)
20:56:05.949 default [main] DEBUG c.p.m.m.C.selectSingAsManyByCidStep1 - <==      Total: 1
20:56:05.953 default [main] DEBUG c.p.m.mapper.StuMapper.selectByCid - ==>  Preparing: select sid,name,cid from t_stu where cid=?
20:56:05.953 default [main] DEBUG c.p.m.mapper.StuMapper.selectByCid - ==> Parameters: 1001(Integer)
20:56:05.957 default [main] DEBUG c.p.m.mapper.StuMapper.selectByCid - <==      Total: 2
Clazz{
     cid=1001, name='高三二班', stus=[Stu{
     sid=4, name='赵六', clazz=null}, Stu{
     sid=5, name='钱七', clazz=null}]}
```

## 四、延迟加载

在进行一对多查询时，如果使用分步查询的方式，此时可以对查询进行延迟加载控制。

通俗点讲就是：用的时候再执行查询语句。不用的时候不查询。

作用:提高性能。尽可能的不查，或者说尽可能的少查。来提高效率。

**2、** 开启延迟加载的两种方式；

（1）局部延迟加载

在mybatis的association标签中添加 fetchType=“lazy”

注意:
默认情况下是没有开启延迟加载的。需要设置:fetchType=“lazy”

这种在association标签中配置fetchType=“lazy”，是局部的设置，只对当前的association关联的sal语句起作用。

（2）全局延迟加载

在实际的开发中，大部分都是需要使用延迟加载的，所以建议开启全部的延迟加载机制:

在mybatis核心配置文件中添加全局配置:lazyLoadingEnabled=true

实际开发中的模式:

把全局的延迟加载打开。

如果某一步不需要使用延迟加载，请设置:fetchType=“eager”

具体的延迟加载描述，可以看我之前专门介绍文章

[https://blog.csdn.net/weixin_43860634/article/details/127585161](/zhuanlan/orm/mybatisplus6/13.html)
