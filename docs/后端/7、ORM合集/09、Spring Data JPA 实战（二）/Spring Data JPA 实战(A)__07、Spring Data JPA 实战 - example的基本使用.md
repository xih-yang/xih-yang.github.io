# 07、Spring Data JPA 实战 - example的基本使用
- 来源：https://ddkk.com/zhuanlan/orm/springdatajpa/6/7.html
- 分类：ORM框架
- 分组：Spring Data JPA 实战(A)
## 简单查询

```java
@Test
public void testExample(){
    Customer customer=new Customer();
    customer.setCustName("飞飞飞");
    Example<Customer> example=Example.of(customer);
    List<Customer> customers = this.customerRepository.findAll(example);
    customers.forEach(value -> System.out.println(value));
}
```

## 使用ExampleMatcher

```java
/**
     * 测试ExampleMatcher
     */
@Test
public void testExampleMatcher(){
    Customer customer=new Customer();
    customer.setCustName("记忆");
    customer.setCustIndustry("溜溜");
    customer.setCustPhone("5566");
    customer.setCustAddress("china");
    customer.setCustSource("aaa");
    ExampleMatcher exampleMatcher=ExampleMatcher.matching()
        .withMatcher("custName",ExampleMatcher.GenericPropertyMatchers.startsWith())   //模糊查询匹配开头
        .withMatcher("custIndustry",ExampleMatcher.GenericPropertyMatchers.contains()) //全部模糊查询
        .withIgnoreCase("custAddress")   //忽略大小写
        .withMatcher("custPhone",ExampleMatcher.GenericPropertyMatchers.exact())  //精准匹配
        .withIgnorePaths("custSource");  //忽略字段，即不管custSource是什么值都不加入查询条件
    Example<Customer> example=Example.of(customer,exampleMatcher);
    List<Customer> customers = this.customerRepository.findAll(example);
    customers.forEach(value-> System.out.println(value));
}
```

**输出**

## lambda的方式

```java
ExampleMatcher exampleMatcher2=ExampleMatcher.matching()
    .withMatcher("custName",match->match.startsWith())
    .withMatcher("custIndustry",match->match.contains())
    .withMatcher("custAddress",match->match.ignoreCase())
    .withMatcher("custPhone",match->match.exact())
    .withIgnorePaths("custSource");
```

> 该种方式和上面的ExampleMatcher效果是相同的

## StringMatcher 参数

Matching
生成的语句
说明

DEFAULT (case-sensitive)
firstname = ?0
默认（大小写敏感）

DEFAULT (case-insensitive)
LOWER(firstname) = LOWER(?0)
默认（忽略大小写）

EXACT (case-sensitive)
firstname = ?0
精确匹配（大小写敏感）

EXACT (case-insensitive)
LOWER(firstname) = LOWER(?0)
精确匹配（忽略大小写）

STARTING (case-sensitive)
firstname like ?0 + ‘%’
前缀匹配（大小写敏感）

STARTING (case-insensitive)
LOWER(firstname) like LOWER(?0) + ‘%’
前缀匹配（忽略大小写）

ENDING (case-sensitive)
firstname like ‘%’ + ?0
后缀匹配（大小写敏感）

ENDING (case-insensitive)
LOWER(firstname) like ‘%’ + LOWER(?0)
后缀匹配（忽略大小写）

CONTAINING (case-sensitive)
firstname like ‘%’ + ?0 + ‘%’
模糊查询（大小写敏感）

CONTAINING (case-insensitive)
LOWER(firstname) like ‘%’ + LOWER(?0) + ‘%’
模糊查询（忽略大小写）
