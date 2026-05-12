# 11、Spring Data JPA 实战 - 复杂查询：方法命名规则查询
- 来源：https://ddkk.com/zhuanlan/orm/springdatajpa/5/11.html
- 分类：ORM框架
- 分组：教程目录
## 0. 规则

```java
是对jpql查询，更加深入一层的封装
	我们只需要按照SpringDataJpa提供的方法名称规则定义方法，不需要再配置jpql语句，完成查询
		findBy开头：	代表查询
			对象中属性名称（首字母大写）
		含义：根据属性名称进行查询
```

```java
方法名的约定:
	findBy :查询
		对象中的属性名(首字母大写) :查询的条件
			比如想要通过custName去查询便使用findByCustName：根据客户名称查询
				默认情况：使用等于的方式查询
				特殊的查询方式：
在springdataJpa的运行阶段，会根据方法名称进行解析findByCustName
	解析为：from xxx(实体类)   where  custName =
		其中：
			findBy   ：from xxx(实体类)
			属性名称：where  custName =
默认情况：findBy + 属性名称(根据属性 名称进行完成匹配的查询=)
	如：findByCustName
特殊情况：findBy +属性名称+“查询方式(Like| isnull)”
	如“：findByCustNameL ike
多条件查询：findBy + 属性名 + "查询方式" + “多条件连接符（and | or）” + 属性名 +  "查询方式" 
```

## 1. 基本查询

在SpringDataJPA（9）中，1中的dao中添加如下方法（在这里我便不将所有的代码复制了）

```java
public Customer findByCustName(String custName);
```

在SpringDataJPA（9）中，1中的测试类中添加如下方法（在这里我便不讲所有的代码复制了）

```java
@Test
public void testFindByName(){
    Customer customer = customerDao.findByCustName("更新后的结果");
    System.out.println(customer);
}
```

运行结果：

## 2. 模糊查询

在SpringDataJPA（9）中，1中的dao中添加如下方法（在这里我便不将所有的代码复制了）

```java
public List<Customer> findByCustNameLike(String custName);
```

在SpringDataJPA（9）中，1中的测试类中添加如下方法（在这里我便不讲所有的代码复制了）

```java
@Test
public void testFindConditionLike(){
    List<Customer> list = customerDao.findByCustNameLike("延%");
    for (Customer customer:list){
        System.out.println(customer);
    }
}
```

运行结果：

## 3. 多条件查询

在SpringDataJPA（9）中，1中的dao中添加如下方法（在这里我便不将所有的代码复制了）

```java
//使用客户名称模糊匹配和客户的industry精准匹配的查询
//这时候参数的顺序不能有误
public Customer findByCustNameLikeAndCustIndustry(String custName,String custIndustry);
```

在SpringDataJPA（9）中，1中的测试类中添加如下方法（在这里我便不讲所有的代码复制了）

```java
@Test
public void testMore(){
    Customer name = customerDao.findByCustNameLikeAndCustIndustry("延%", "学");
    System.out.println(name);
}
```

运行结果：
