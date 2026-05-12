# 09、Mybatis-Plus入门 - 逻辑删除
- 来源：https://ddkk.com/zhuanlan/orm/mybatisplus/5/9.html
- 分类：ORM框架
- 分组：教程目录
## 概念

### 什么是逻辑删除

**逻辑删除**：假删除。将对应数据中代表是否被删除字段状态修改为“被删除状态”，之后在数据库中仍旧能看到此条数据记录。

**数据库实现思路**：插入数据时，标记为未删除状态；查询、修改时，只获取未删除状态的数据进行操作；删除时则更新删除状态为已删除，则可实现逻辑上删除，物理上任存在数据功能。

参考**阿里巴巴开发规范**表达逻辑删除的字段名为 is_deleted，1 表示删除，0 表示未删除。

## 测试案例

**1、** 在表中添加is_deleted字段，并设置默认值为0，实体类添加逻辑删除字段并添加@TableLogic注解；

```java
    @TableLogic
    private Integer isDeleted;
```

**1、** 在YML中配置全局逻辑删除字段；

```java
mybatis-plus:
  global-config:
    db-config:
      logic-delete-field: is_deleted  全局逻辑删除的实体字段名
      logic-delete-value: 1 逻辑已删除值(默认为 1)
      logic-not-delete-value: 0 逻辑未删除值(默认为 0)
```

**1、** 测试逻辑删除查询；

```java
    @Test
    public void selectTest() {
        // ID 查询
        OrderTbl orderTbl = orderTblMapper.selectById(4896);
        // 分页查询
        Page<Map<String, Object>> mapPage = orderTblMapper.selectMapsPage(new Page<>(1, 10), new LambdaQueryWrapper<>());
    }
```

**SQL分析**： 查询都自动加上了is_deleted=0

**1、** 测试逻辑删除插入；

```java
    @Test
    public void insertTest() {
        OrderTbl orderTbl = new OrderTbl().setMoney(100).setUserId("123").setCommodityCode("PHONE");
        orderTblMapper.insert(orderTbl);
    }
```

**SQL分析**：插入时没有插入逻辑删除字段，但是我们数据库配置了自动生成状态0

**1、** 测试逻辑删除更新；

```java
    @Test
    public void updateTest() {
        // 查询一条记录
        OrderTbl orderTbl1 = orderTblMapper.selectById(4896);
        orderTbl1.setMoney(100);
        // 更新
        orderTblMapper.updateById(orderTbl1);
    }
```

**SQL分析**：更新时，会添加is_deleted=0条件

**1、** 测试逻辑删除删除；

```java
    @Test
    public void deleteTest() {
        // 删除
        orderTblMapper.deleteById(4896);
    }
```

**SQL分析**：转变为更新，添加SET is_deleted=1,修改删除状态为1

**1、** 测试逻辑删除XML-SQL；

**SQL分析**：当我们在XML自定义语句时，无法自动添加逻辑删除，需要自己添加条件

### 注意事项

**1、** 只对自动注入的sql起效，XML文件中的SQL无效；

**2、** 逻辑删除字段支持所有数据类型(推荐使用Integer,Boolean,LocalDateTime)；

**3、** 逻辑删除是为了方便数据恢复和保护数据本身价值等等的一种方案，但实际就是删除；

**4、** 如果你需要频繁查出来看就不应使用逻辑删除，而是以一个状态去表示；
