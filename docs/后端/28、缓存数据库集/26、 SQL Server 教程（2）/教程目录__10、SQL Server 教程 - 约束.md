# 10、SQL Server 教程 - 约束
- 来源：https://ddkk.com/zhuanlan/db/sqlserver/2/10.html
- 分类：缓存数据库
- 分组：教程目录
使用数据库约束就是保证数据库完整性的方法。数据库设计的完整性实际上就是为了保证数据的正确性，那么为了保证数据正确，在SQL Server当中涉及的完整性主要有三个，即**实体完整性、区域完整性、参考完整性。**

1．实体完整性

实体完整性针对表中的行数据，要求表中的主键字段都不能为空或者重复的值。例如，每个人的身份证号码都是唯一的，在学校里每个学生的学号是唯一的，银行卡的卡号也是唯一的，等等。

2．区域完整性

区域完整性针对表中的列数据，是保证输入到数据库中的数据是在有效范围内的，可以通过数据类型或使用CHECK约束来设置。比如，输入身份证号码要有15位或18位，输入年龄只能是数字，输入姓名不能有字母，年龄范围在1～120之间等。

3．参照完整性

参照完整性，可以保证数据库中相关联的表里数据的正确性，使用外键约束就可以保证参照完整性。确保数据表的参照完整性，就可以避免错误地删除或增加数据。比如，学生选了课程，如果因为某种原因，学校取消了该课程，那么可能导致学生该时段没有课程可上，但是加上外键约束后，学校如果想取消该课程，首先得通知学生不选该课程，然后才能删除。所以使用参照完整性设计数据表就会避免产生脏数据。

**约束的类型**

1．主键约束(Primary Key)

主键约束在每个数据表中只能有一个，但是一个主键约束可以由多个列组成，通常把由多个列组成的主键又叫做复合主键或组合主键。主键约束可以保证主键列的数据没有重复值且值不为空，也可以说它是保证记录唯一且不为空的一种方式。

2．外键约束(Foreign Key)

外键约束之所以被称为是参照约束，是因为它主要用来把一个表中的数据和另一个表中的数据进行关联，表和表之间的关联是为了保证数据库中数据的完整性。使用外键保证数据的完整性，也叫参照完整性。

3．唯一约束‘( Unique)

唯一约束和主键约束一样都是设置表中的列不能重复的约束，区别就是一个表中只能有一个主键约束，．却可以有多个唯一约束，通常情况下设置唯一约束的目的就是为了使非主键列没有重复值f唯一约束与主键约束的另一个区别是如果数据表中的某一列中有空值，那么就不能把这个列设置为主键列，但可以设置成唯一约束。比如，在商品信息表中把商品的编号设置成了主键，但是还要保证商品的名称不重名，就可以对商品名称设置唯一约束。

4．检查约束(Check)

检查约束是用来指定表中列的值的取值范围的，该约束更适合完成与业务逻辑相关的限制，比如，商品信息表中商品数量的列，如果要求商品数量在10到500之间，就可以使用检查约束进行设置，当输入的值不在有效范围内时，就会出现错误，这样就保证了数据库数据的有效性。

5．非空约束(Not Null)

非空约束是用来约束表中的列不允许为空的，比如，员工信息表中员工身份证号码列，当要求员工必须输入时，可以使用非空约束来保证该列不能为空。

**约束的语法**

[CONSTRAINT constraint_name ]

{
{PRIMARY KEY | UNIQUE }

[CLUSTERED | NONCLUSTERED ]

(column [ ASC I DESC ] [ ,...n )

[WITH FILLFACTOR = fillfactor

[WITH ([ ,...n ] ) ]

[ON { partition_scheme_name ( partition_column_name ...) I filegroup I "default" } ]

IFOREIGN KEY

REFERENCES referenced_table_name [ ( ref_column [ ,...] ) ]

ICHECK [ NOT FOR REPLICAT工ON ] ( logical_expression )

}

示例1利用T-SQL增加主键。利用T-SQL为AdventureWorks数据库中的表test增加id字段和age字段的组合主键。

USEAdventureWorks

GO
ALTER TABLE test

ADD
CONSTRAINT PK_test PRIMARY KEY NONCLUSTERED

(id,age)

示例2利用T-SQL增加外键约束。求利用T-SQL为表orderinfo和表productinfo增加外键约束，关联列为orderinfo表中的

Productld列和productinfo表中的Productld列。

USEAdventureWorks

GO
ALTER TABLE orderinfo

WITH CHECK

ADDCONSTRAINT FK_orderinfo_orderinfo

FOREIGN KEY ( ProductId)

REFERENCES dbo.productinfo(ProductId)

GO

示例3利用T-SQL创建CHECK约束，该约束限制表orderinfo中OrderQuantity字段的值，规定该值大于0小于1000

ALTER TABLE orderinfo

WITH NOCHECK

ADDCONSTRAINT CK_orderinfo_orderQuantity_se

CHECK

(orderQuantity>0 AND OrderQuantity < 100)
