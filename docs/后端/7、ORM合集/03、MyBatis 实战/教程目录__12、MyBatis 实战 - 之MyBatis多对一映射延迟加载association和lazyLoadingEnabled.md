# 12、MyBatis 实战 - 之MyBatis多对一映射延迟加载association和lazyLoadingEnabled
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/6/12.html
- 分类：ORM框架
- 分组：教程目录
## 一、延迟加载

### 1、延迟加载的核心原理

通俗点讲就是：用的时候再执行查询语句。不用的时候不查询。

作用:提高性能。尽可能的不查，或者说尽可能的少查。来提高效率。

### 2、开启延迟加载的两种方式

#### （1）局部延迟加载

在mybatis的association标签中添加 **fetchType=“lazy”**

**注意:**

默认情况下是没有开启延迟加载的。需要设置:fetchType=“lazy”

这种在association标签中配置fetchType=“lazy”，是局部的设置，只对当前的association关联的sal语句起作用。

#### （2）全局延迟加载

在实际的开发中，大部分都是需要使用延迟加载的，所以建议开启全部的延迟加载机制:

在mybatis核心配置文件中添加全局配置:lazyLoadingEnabled=true

实际开发中的模式:

把全局的延迟加载打开。

如果某一步不需要使用延迟加载，请设置:fetchType=“eager”

## 二、局部延迟加载 fetchType=“lazy”

```java
在association标签中配置fetchType="lazy"，是局部的设置，
只对当前的association关联的sal语句起作用。
```

**代码如下：**

```java
StuMapper接口
```

```java
public interface StuMapper {
	public Stu selectBySidStep1(Integer sid);
}
```

```java
ClazzMapper接口
```

```java
public interface ClazzMapper {
    public Clazz selectByCidStep2(Integer cid);
}
```

StuMapper.xml文件

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.powernode.mybatis.mapper.StuMapper">
    <!--分步骤查询-->
    <resultMap id="selectBySidStepMap" type="Stu">
        <id property="sid" column="sid"/>
        <result property="name" column="name"/>
        <association property="clazz"
                     select="com.powernode.mybatis.mapper.ClazzMapper.selectByCidStep2"
                     column="cid"
                     fetchType="lazy"
        />
    </resultMap>
    <select id="selectBySidStep1" resultMap="selectBySidStepMap">
        select s.sid,s.name,s.cid from t_stu s
        where s.sid ={sid}
    </select>
</mapper>
```

```java
测试类 情况一：调用学生类对象的toString()方法
```

```java
@Test
    public void testAdvanceMappingStep(){
        SqlSession sqlSession = SqlSessionUtil.openSqlSession();
        StuMapper mapper = sqlSession.getMapper(StuMapper.class);
        Stu stu = mapper.selectBySidStep1(1);
        System.out.println(stu.toString());
```

```java
运行结果，我们发现，两个接口对应的sql都被执行了
```

```java
StuMapper.selectBySidStep1 - ==>  Preparing: select s.sid,s.name,s.cid from t_stu s where s.sid = ?
StuMapper.selectBySidStep1 - ==> Parameters: 1(Integer)
StuMapper.selectBySidStep1 - <==      Total: 1
ClazzMapper.selectByCidStep2 - ==>  Preparing: select * from t_clazz where cid = ?
ClazzMapper.selectByCidStep2 - ==> Parameters: 1000(Integer)
ClazzMapper.selectByCidStep2 - <==      Total: 1
Stu{
     sid=1, name='张三', clazz=Clazz{
     cid=1000, name='高三一班'}}
```

```java
测试类 情况二：调用学生类对象的getName()方法
```

```java
@Test
    public void testAdvanceMappingStep(){
        SqlSession sqlSession = SqlSessionUtil.openSqlSession();
        StuMapper mapper = sqlSession.getMapper(StuMapper.class);
        Stu stu = mapper.selectBySidStep1(1);
        System.out.println(stu.getName());
```

```java
运行结果，我们发现，只执行了一条sql，说明延迟加载生效了
```

```java
StuMapper.selectBySidStep1 - ==>  Preparing: select s.sid,s.name,s.cid from t_stu s where s.sid = ?
StuMapper.selectBySidStep1 - ==> Parameters: 1(Integer)
StuMapper.selectBySidStep1 - <==      Total: 1
张三
```

```java
测试类 情况三：先调用学生类对象的getName()方法，再调用班级属性方法getClazz()
```

```java
@Test
    public void testAdvanceMappingStep(){
        SqlSession sqlSession = SqlSessionUtil.openSqlSession();
        StuMapper mapper = sqlSession.getMapper(StuMapper.class);
        Stu stu = mapper.selectBySidStep1(1);
        System.out.println(stu.getName());
        System.out.println(stu.getClazz());
```

```java
运行结果，我们发现，只有在调用的时候，sql语句才会被执行，再次验证了延迟加载的配置效果
```

```java
StuMapper.selectBySidStep1 - ==>  Preparing: select s.sid,s.name,s.cid from t_stu s where s.sid = ?
StuMapper.selectBySidStep1 - ==> Parameters: 1(Integer)
StuMapper.selectBySidStep1 - <==      Total: 1
张三
ClazzMapper.selectByCidStep2 - ==>  Preparing: select * from t_clazz where cid = ?
ClazzMapper.selectByCidStep2 - ==> Parameters: 1000(Integer)
ClazzMapper.selectByCidStep2 - <==      Total: 1
Clazz{
     cid=1000, name='高三一班'}
```

## 三、全局延迟加载 lazyLoadingEnabled=true

如果想要实现全局延迟加载，则只需要在mybatis核心配置文件中

添加全局配置:

**lazyLoadingEnabled=true**

```java
具体配置如下：
```

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

## 四、关于lazyLoadingEnabled的补充说明

mybatis3.4.1以及之前版本，开启懒加载lazyLoadingEnabled为true时，得记得把aggressiveLazyLoading设置为false，因为aggressiveLazyLoading它的默认值为true，会强行给你全部加载，因此不显示设置aggressiveLazyLoading为false，那么懒加载lazyLoadingEnabled就起不到作用了，

而mybatis3.4.1之后的版本，aggressiveLazyLoading的默认值为false了，所以开启懒加载lazyLoadingEnabled时候只需要设置lazyLoadingEnabled为true就行，再也不用显示设置aggressiveLazyLoading为false了。
