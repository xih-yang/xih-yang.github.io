# 09、MyBatis 实战 - 之MyBatis动态SQL标签总结
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/6/9.html
- 分类：ORM框架
- 分组：教程目录
## 一、if标签

**1、** if标签中test属性是必须的；

**2、** if标签中test属性的值是false或者true；

**3、** 如果test是true，则if标签中的sql语句就会拼接反之，则不会拼接；

**4、** test属性中可以使用的是:；

当使用了@Param注解，那么test中要出现的是@Param注解指定的参数名。@Param(“brand”)，那么这里只能使用brand当没有使用@Param注解，那么test中要出现的是:param1 param2 param3 arg0 arg1 arg2…当使用了POJO，那么test中出现的是POJO类的属性名。

**5、** 在mybatis的动态SQL当中，不能使用&&，只能使用and；

```xml
<select id="selectList" resultType="Student">
	select * from t_car where 1 = 1
	<if test="guidePrice != null and guidePrice !=''">
		and guide_price >{guidePrice}
		</if>
	<if test="carType != null and carType != ''">
		and car_type ={carType}
	</if>
</select>
```

## 二、where标签

- where标签的作用:让where子句更加动态智能。
- 所有条件都为空时，where标签保证不会生成where子句。·自动去除某些条件**前面**多余的and或or。

```xml
<select id="selectList" resultType="Student">
	select * from t_car
	<where>
		<if test="guidePrice != null and guidePrice !=''">
			and guide_price >{guidePrice}
			</if>
		<if test="carType != null and carType != ''">
			and car_type ={carType}
		</if>
	</where>
</select>
```

- 如果把and放在后面，如下面代码，这样是不可以的哦

```xml
<select id="selectList" resultType="Student">
	select * from t_car
	<where>
		<if test="guidePrice != null and guidePrice !=''">
			guide_price >{guidePrice} and 
			</if>
		<if test="carType != null and carType != ''">
			car_type ={carType}
		</if>
	</where>
</select>
```

## 三、trim标签

**trim标签的属性:**

- prefix:在trim标签中的语句前添加内容·
- suffix:在trim标签中的语句后添加内容
- prefixOverrides:前缀覆盖掉(去掉)
- suffixOverrides:后缀覆盖掉(去掉)

案例如下：

```xml
<select id="selectByMultiConditionWithTrim" resultType="Car">
        select * from t_car
        <!--
            prefix:加前缀 suffix:加后缀
            prefix0verrides:删除前缀 suffix0verrides:删除后缀
            prefix="where"是在trim标签所有内容的前面添加 where
        -->
        <!--
            suffix0verrides="and|or"把trim标签中内容的后缀and或or去掉
        -->
        <trim prefix="where" suffixOverrides="and|or">
            <if test="brand != null and brand != ''">
                brand like "%"#{brand}"%" and</if>
            <if test="guidePrice != null and guidePrice != ''">
                guide price >{guideprice} and</if>
            <if test="carType != null and carType != ''">
                car_type ={carType}</if>
        </trim>
    </select>
```

案例说明：

prefix:加前缀 suffix:加后缀

prefix0verrides:删除前缀 suffix0verrides:删除后缀

prefix="where"是在trim标签所有内容的前面添加 where

suffix0verrides="and|or"把trim标签中内容的后缀and或or去掉

## 四、set标签

- 主要使用在update语句当中，用来生成set关键字，同时去掉最后多余的“，”
- 比如我们只更新提交的不为空的字段，如果提交的数据是空或者""，那么这个字段我们将不更新。

传统写法：

```xml
<update id="update">
        update t_car set
            name ={name},
            sex ={sex}
        where id ={id}
    </update>
```

如果需要避免更新空值字段，可以这样写，并且可以自动的去掉最后的逗号

```java
update t_car
   <set>
        <if test="name != null and name !=''">name ={name},</if>
        <if test="sex != null and sex !=''">sex ={sex},</if>
        <if test="guidePrice != null and guidePrice !=''">guide_price ={guidePrice},</if>
    </set>
where 
  id ={id}
```

## 五、choose when otherwise标签

这三个标签是在一起使用的:

语法格式

```xml
<choose>
	<when></when>
	<when></when>
	 <when></when> 
	<otherwise></otherwise> 
</choose> 
```

相当于java中的

```java
if(){
}else if(){
}else if(){
}else if(){
}else{
}
```

案例如下：

有时候，我们不想使用所有的条件，而只是想从多个条件中选择一个使用。针对这种情况，MyBatis 提供了 choose 元素，它有点像 Java 中的 switch 语句。

还是上面的例子，但是策略变为：传入了 “title” 就按 “title” 查找，传入了 “author” 就按 “author” 查找的情形。若两者都没有传入，就返回标记为 featured 的 BLOG（这可能是管理员认为，与其返回大量的无意义随机 Blog，还不如返回一些由管理员挑选的 Blog）。

```xml
<select id="findActiveBlogLike"
     resultType="Blog">
  SELECT * FROM BLOG WHERE state = ‘ACTIVE’
  <choose>
    <when test="title != null">
      AND title like{title}
    </when>
    <when test="author != null and author.name != null">
      AND author_name like{author.name}
    </when>
    <otherwise>
      AND featured = 1
    </otherwise>
  </choose>
</select>
```

## 六、foreach标签

foreach标签的属性:

collection:指定数组或者集合

item:代表数组或集合中的元素

separator:循环之间的分隔符

案例如下：

```java
int deleteByIds(Long[] ids);
```

```xml
<delete id="deleteByIds">
        delete from t_car where id in (
          <foreach collection="ids" item="id" separator=",">
             {id}
          </foreach>
        )
    </delete>
```

**collection=“ids” 这样写会报错，报错信息：[array，arg0]**

原因是：如果不指定名称，mybatis默认是传array或者arg0

解决办法1：

```xml
<delete id="deleteByIds">
        delete from t_car where id in (
          <foreach collection="array" item="id" separator=",">
             {id}
          </foreach>
        )
    </delete>
```

解决办法2：

```xml
<delete id="deleteByIds">
        delete from t_car where id in (
          <foreach collection="arg0" item="id" separator=",">
             {id}
          </foreach>
        )
    </delete>
```

解决办法3：将接口的参数加上@Param注解，指定名称

```java
int deleteByIds(@Param("ids") Long[] ids);
```

```xml
<delete id="deleteByIds">
        delete from t_car where id in (
          <foreach collection="ids" item="id" separator=",">
             {id}
          </foreach>
        )
    </delete>
```

最后再补充一下foreach的 open和close属性

- open:foreach循环拼接的所有sql语句的最前面以什么开始。
- close:foreach循环拼接的所有sql语句的最后面以什么结束。

所以上面的sql语句也可以写成这样：

```xml
<delete id="deleteByIds">
        delete from t_car where id in 
          <foreach collection="ids" item="id" open="(" close=")" separator=",">
             {id}
          </foreach>
    </delete>
```

批量删除的另外一种方式：使用or关键字

```java
 <delete id="deleteByIds">
        delete from t_car where
          <foreach collection="ids" item="id"  separator="or">
             id ={id}
          </foreach>
    </delete>
```

## 七、include标签和sql标签

- sql标签用来声明sql片段
- include标签用来将声明的sql片段包含到某个sgl语句当中
- 作用:代码复用。易维护。
