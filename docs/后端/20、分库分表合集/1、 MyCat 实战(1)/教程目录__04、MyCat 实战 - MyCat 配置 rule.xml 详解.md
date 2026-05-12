# 04、MyCat 实战 - MyCat 配置 rule.xml 详解
- 来源：https://ddkk.com/zhuanlan/sharding/mycat/1/4.html
- 分类：分库分表
- 分组：教程目录
> rule.xml ，配置定义了我们对表进行拆分所涉及到的规则定义。我们可以灵活的对表使用不同的分片算法，或者对表使用相同的算法但具体的参数不同。
>
> rule.xml 配置文件，包含标签  和 。

```java
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mycat:rule SYSTEM "rule.dtd">
<mycat:rule xmlns:mycat="http://io.mycat/">
    <!-- tableRule 标签定义表规则 -->
    <!-- name 属性,指定唯一的名字,用于标识不同的表规则-->
    <tableRule name="mod-long">
        <rule>  <!-- rule 标签,指定对物理表中的哪一列进行拆分和使用什么路由算法 -->
            <columns>id</columns> <!-- columns 属性,指定要拆分的列名字 -->
            <algorithm>mod-long</algorithm>  <!-- algorithm 属性,使用 function 标签中的 name 属性。连接表规则和具体路由算法。当然，多个表规则可以连接到 同一个路由算法上 -->
        </rule>
    </tableRule>
    <!-- name 属性,指定算法的名字   class 属性,指定路由算法具体的类名字 -->
    <function name="mod-long" class="io.mycat.route.function.PartitionByMod">
        <!-- how many data nodes -->
        <property name="count">2</property> <!-- property 标签，为具体算法需要用到的一些属性值 -->
    </function>
</mycat:rule>
```
